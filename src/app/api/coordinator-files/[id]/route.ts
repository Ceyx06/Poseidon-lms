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

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await context.params;

    const { data: record, error: fetchError } = await supabase
      .from("crew_documents")
      .select("public_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!record) return NextResponse.json({ error: "File not found" }, { status: 404 });

    if (record.public_id) {
      const { error: storageError } = await supabase.storage
        .from("Poseidon-files")
        .remove([record.public_id]);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from("crew_documents")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
