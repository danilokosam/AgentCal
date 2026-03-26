import { createAdminClient } from "@/lib/supabase";
import { generateSlots, rangesOverlap, isValidISODate, isValidTimeRange } from "@/lib/dateUtils";
import type {
  AvailabilityQuery,
  AvailabilityResult,
  BookAppointmentInput,
  ConflictCheckResult,
  AppointmentWithRelations,
} from "@/types/appointments";
import type { AppointmentRow } from "@/types/database";

// ─── Conflict Detection ──────────────────────────────────────────────────────

/**
 * Checks whether a proposed [start_time, end_time) window conflicts with any
 * existing appointment for the same staff_id or room_id.
 *
 * Overlap condition: existing.start < proposed.end AND existing.end > proposed.start
 * (standard interval overlap — touching boundaries are NOT a conflict)
 */
export async function checkConflicts(
  business_id: string,
  start_time: string,
  end_time: string,
  options: { staff_id?: string; room_id?: string; exclude_appointment_id?: string }
): Promise<ConflictCheckResult> {
  const db = createAdminClient();

  if (!options.staff_id && !options.room_id) {
    return { hasConflict: false };
  }

  // Fetch all active appointments in the business that overlap the window
  let query = db
    .from("appointments")
    .select("id, staff_id, room_id")
    .eq("business_id", business_id)
    .neq("status", "cancelled")
    .lt("start_time", end_time)   // existing.start < proposed.end
    .gt("end_time", start_time);  // existing.end   > proposed.start

  if (options.exclude_appointment_id) {
    query = query.neq("id", options.exclude_appointment_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(`DB error checking conflicts: ${error.message}`);

  for (const appt of data ?? []) {
    if (options.staff_id && appt.staff_id === options.staff_id) {
      return { hasConflict: true, conflictingAppointmentId: appt.id, conflictType: "staff" };
    }
    if (options.room_id && appt.room_id === options.room_id) {
      return { hasConflict: true, conflictingAppointmentId: appt.id, conflictType: "room" };
    }
  }

  return { hasConflict: false };
}

// ─── Availability ────────────────────────────────────────────────────────────

/**
 * Returns all open time slots for a given date/staff/room combination.
 * Slots are generated every 30 min within the 08:00–18:00 UTC window,
 * then filtered by removing any that would cause a conflict.
 */
export async function getAvailability(query: AvailabilityQuery): Promise<AvailabilityResult> {
  const { business_id, date, staff_id, room_id, duration_minutes } = query;

  const candidates = generateSlots(date, duration_minutes);

  const db = createAdminClient();

  // Load all confirmed/pending appointments for that day touching our resources
  const { data: existing, error } = await db
    .from("appointments")
    .select("id, staff_id, room_id, start_time, end_time")
    .eq("business_id", business_id)
    .neq("status", "cancelled")
    .gte("start_time", `${date}T00:00:00.000Z`)
    .lte("start_time", `${date}T23:59:59.999Z`);

  if (error) throw new Error(`DB error fetching appointments: ${error.message}`);

  const existingAppts = existing ?? [];

  const available_slots = candidates.filter((slot) => {
    for (const appt of existingAppts) {
      if (!rangesOverlap(slot, { start: appt.start_time, end: appt.end_time })) continue;
      if (staff_id && appt.staff_id === staff_id) return false;
      if (room_id && appt.room_id === room_id) return false;
    }
    return true;
  });

  return { available_slots, date, duration_minutes };
}

// ─── Booking ─────────────────────────────────────────────────────────────────

/**
 * Books an appointment after validating inputs and checking for conflicts.
 * Throws a descriptive error on any failure — callers decide how to surface it.
 */
export async function bookAppointment(
  input: BookAppointmentInput
): Promise<AppointmentRow> {
  const { business_id, staff_id, room_id, title, description, start_time, end_time, metadata } =
    input;

  // ── Validations ──
  if (!isValidISODate(start_time)) throw new Error("Invalid start_time — must be ISO 8601 UTC");
  if (!isValidISODate(end_time)) throw new Error("Invalid end_time — must be ISO 8601 UTC");
  if (!isValidTimeRange(start_time, end_time)) throw new Error("start_time must be before end_time");
  if (!staff_id && !room_id) throw new Error("At least one of staff_id or room_id is required");

  // ── Conflict check ──
  const conflict = await checkConflicts(business_id, start_time, end_time, { staff_id, room_id });
  if (conflict.hasConflict) {
    throw new Error(
      `Scheduling conflict: ${conflict.conflictType} is already booked (appointment ${conflict.conflictingAppointmentId})`
    );
  }

  // ── Insert ──
  const db = createAdminClient();
  const { data, error } = await db
    .from("appointments")
    .insert({
      business_id,
      staff_id: staff_id ?? null,
      room_id: room_id ?? null,
      title,
      description: description ?? null,
      start_time,
      end_time,
      status: "confirmed",
      metadata: metadata ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return data;
}

// ─── Cancellation ────────────────────────────────────────────────────────────

export async function cancelAppointment(
  appointment_id: string,
  business_id: string
): Promise<AppointmentRow> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointment_id)
    .eq("business_id", business_id)
    .select()
    .single();

  if (error) throw new Error(`Failed to cancel appointment: ${error.message}`);
  if (!data) throw new Error("Appointment not found or access denied");
  return data;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getAppointment(
  appointment_id: string,
  business_id: string
): Promise<AppointmentWithRelations> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("appointments")
    .select(`*, staff:staff_id(id, name, email), room:room_id(id, name, capacity)`)
    .eq("id", appointment_id)
    .eq("business_id", business_id)
    .single();

  if (error) throw new Error(`Appointment not found: ${error.message}`);
  return data as unknown as AppointmentWithRelations;
}

export async function listAppointments(
  business_id: string,
  filters: { date?: string; staff_id?: string; room_id?: string; status?: string } = {}
): Promise<AppointmentWithRelations[]> {
  const db = createAdminClient();
  let query = db
    .from("appointments")
    .select(`*, staff:staff_id(id, name, email), room:room_id(id, name, capacity)`)
    .eq("business_id", business_id)
    .order("start_time", { ascending: true });

  if (filters.date) {
    query = query
      .gte("start_time", `${filters.date}T00:00:00.000Z`)
      .lte("start_time", `${filters.date}T23:59:59.999Z`);
  }
  if (filters.staff_id) query = query.eq("staff_id", filters.staff_id);
  if (filters.room_id) query = query.eq("room_id", filters.room_id);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list appointments: ${error.message}`);
  return (data ?? []) as unknown as AppointmentWithRelations[];
}
