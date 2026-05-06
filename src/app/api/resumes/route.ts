import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "Poseidon-files";
const FOLDER = "resumes";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// GET — fetch all resumes
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .order("uploadedAt", { ascending: false });

    if (error) throw error;

    const resumes = (data ?? []).map((r: any) => ({
      id: r.id,
      crewName: r.crewName ?? "",
      fileName: r.fileName ?? "",
      fileUrl: r.fileUrl ?? "",
      fileSize: r.fileSize ?? "",
      publicId: r.publicId ?? "",
      uploadedAt: r.uploadedAt ?? r.createdAt ?? "",
    }));

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST — upload file to Supabase Storage + save record
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const formData = await req.formData();
    const crewName = formData.get("crewName") as string;
    const file = formData.get("file") as File;

    if (!crewName || !file) {
      return NextResponse.json(
        { error: "crewName and file are required." },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${FOLDER}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;
    const fileSize = formatFileSize(file.size);

    // Save to DB
    const { data, error: saveError } = await supabase
      .from("resume")
      .insert({
        crewName: crewName.trim(),
        fileName: file.name,
        fileUrl,
        fileSize,
        publicId: storagePath,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({ resume: data }, { status: 201 });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// DELETE — remove from storage + DB
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { id, publicId } = await req.json();

    if (publicId) {
      await supabase.storage.from(BUCKET).remove([publicId]);
    }

    const { error } = await supabase.from("resume").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}