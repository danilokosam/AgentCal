import { NextRequest, NextResponse } from "next/server";
import { getAppointment, cancelAppointment } from "@/services/appointmentService";

type Params = { params: Promise<{ id: string }> };

// GET /api/appointments/:id?business_id=
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const business_id = new URL(req.url).searchParams.get("business_id");

  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  try {
    const appointment = await getAppointment(id, business_id);
    return NextResponse.json({ appointment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

// DELETE /api/appointments/:id  (body: { business_id })
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: { business_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  try {
    const appointment = await cancelAppointment(id, body.business_id);
    return NextResponse.json({ appointment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
