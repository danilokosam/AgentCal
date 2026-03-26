import { NextRequest, NextResponse } from "next/server";
import { bookAppointment, listAppointments } from "@/services/appointmentService";

// GET /api/appointments?business_id=&date=&staff_id=&room_id=&status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const business_id = searchParams.get("business_id");
  const date = searchParams.get("date");
  console.log("[GET /api/appointments] business_id:", business_id, "| date:", date);

  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  try {
    const appointments = await listAppointments(business_id, {
      date: date ?? undefined,
      staff_id: searchParams.get("staff_id") ?? undefined,
      room_id: searchParams.get("room_id") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    console.log("[GET /api/appointments] Supabase Response:", { count: appointments.length, error: null });
    return NextResponse.json({ appointments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/appointments] Supabase Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/appointments
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const appointment = await bookAppointment(body as Parameters<typeof bookAppointment>[0]);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isConflict = message.includes("conflict");
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 400 });
  }
}
