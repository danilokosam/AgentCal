import type { AppointmentStatus } from "./database";

// ─── Domain / business-logic types ──────────────────────────────────────────

export type TimeSlot = {
  start: Date; // always UTC internally
  end: Date;
};

export type AvailabilityQuery = {
  business_id: string;
  date: string;        // YYYY-MM-DD in the business's local date
  staff_id?: string;
  room_id?: string;
  duration_minutes: number;
};

export type AvailableSlot = {
  start: string; // ISO 8601 UTC
  end: string;   // ISO 8601 UTC
};

export type AvailabilityResult = {
  available_slots: AvailableSlot[];
  date: string;
  duration_minutes: number;
};

export type BookAppointmentInput = {
  business_id: string;
  staff_id?: string;
  room_id?: string;
  title: string;
  description?: string;
  start_time: string; // ISO 8601 UTC
  end_time: string;   // ISO 8601 UTC
  metadata?: Record<string, unknown>;
};

export type ConflictCheckResult =
  | { hasConflict: false }
  | { hasConflict: true; conflictingAppointmentId: string; conflictType: "staff" | "room" };

export type AppointmentWithRelations = {
  id: string;
  business_id: string;
  staff_id: string | null;
  room_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  staff?: { id: string; name: string; email: string } | null;
  room?: { id: string; name: string; capacity: number } | null;
};
