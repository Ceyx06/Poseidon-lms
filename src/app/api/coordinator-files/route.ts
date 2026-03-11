import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("crew_documents")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    const mapped = data.map((r) => ({
      id: r.id,
      crewName: r.crew_name,
      crewKey: r.crew_key,
      fileName: r.file_name,
      fileUrl: r.file_url,
      fileSize: r.file_size,
      publicId: r.public_id,
      uploadedAt: new Date(r.uploaded_at).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      }),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { crewName, crewKey, fileName, fileUrl, fileSize, publicId } = await req.json();

    const { data, error } = await supabase
      .from("crew_documents")
      .insert({
        crew_name: crewName,
        crew_key: crewKey,
        file_name: fileName,
        file_url: fileUrl,
        file_size: fileSize,
        public_id: publicId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      crewName: data.crew_name,
      crewKey: data.crew_key,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileSize: data.file_size,
      publicId: data.public_id,
      uploadedAt: new Date(data.uploaded_at).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      }),
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}