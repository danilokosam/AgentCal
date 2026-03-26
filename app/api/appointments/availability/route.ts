export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/services/appointmentService";

// GET /api/appointments/availability?business_id=&date=&duration_minutes=&staff_id=&room_id=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const business_id = searchParams.get("business_id");
  const date = searchParams.get("date");
  const duration_minutes = Number(searchParams.get("duration_minutes"));

  if (!business_id || !date || !duration_minutes) {
    return NextResponse.json(
      { error: "business_id, date, and duration_minutes are required" },
      { status: 400 }
    );
  }

  try {
    const result = await getAvailability({
      business_id,
      date,
      duration_minutes,
      staff_id: searchParams.get("staff_id") ?? undefined,
      room_id: searchParams.get("room_id") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
