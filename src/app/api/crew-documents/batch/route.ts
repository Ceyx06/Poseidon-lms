import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { updates } = await req.json();
    const results = await Promise.all(
      updates.map(({ id, data }: { id: string; data: any }) =>
        supabase
          .from("crew_tracker")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)
      )
    );
    const failed = results.find(r => r.error);
    if (failed?.error) throw failed.error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}