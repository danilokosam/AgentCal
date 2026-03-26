import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// GET /api/staff?business_id=
export async function GET(req: NextRequest) {
  const business_id = new URL(req.url).searchParams.get("business_id");

  if (!business_id) {
    return NextResponse.json({ error: "business_id is required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("staff")
    .select("*")
    .eq("business_id", business_id)
    .eq("is_active", true)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ staff: data });
}

// POST /api/staff
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("staff")
    .insert(body as Parameters<typeof db.from>[0])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ staff: data }, { status: 201 });
}
