export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAppointment, cancelAppointment, updateAppointment } from "@/services/appointmentService";

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

// PATCH /api/appointments/:id  (body: { business_id, ...updates })
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { business_id, ...updates } = body;
  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  try {
    const appointment = await updateAppointment(id, business_id as string, updates as Parameters<typeof updateAppointment>[2]);
    return NextResponse.json({ appointment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isConflict = message.includes("conflict");
    return NextResponse.json({ error: message }, { status: isConflict ? 409 : 400 });
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
