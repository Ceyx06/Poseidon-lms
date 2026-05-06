import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error);
}

export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    if (!publicId) return NextResponse.json({ error: "Missing publicId" }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from("Poseidon-files")
      .remove([publicId]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
