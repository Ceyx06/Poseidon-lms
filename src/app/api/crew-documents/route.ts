import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUCKET = "Poseidon-files";
const FOLDER = "crew-documents";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

// GET all crew documents
export async function GET() {
  try {
    const docs = await prisma.coordinatorFile.findMany({
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST — upload a new crew document to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const crewName = formData.get("crewName") as string;
    const file = formData.get("file") as File;

    if (!crewName || !file) {
      return NextResponse.json(
        { error: "crewName and file are required." },
        { status: 400 }
      );
    }

    const crewKey = crewName.trim().toLowerCase().replace(/\s+/g, "_");
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${FOLDER}/${crewKey}/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getSupabase();

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData.publicUrl;

    // Format file size
    const fileSize =
      file.size >= 1_048_576
        ? `${(file.size / 1_048_576).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    // Save to DB
    const doc = await prisma.coordinatorFile.create({
      data: {
        crewName: crewName.trim(),
        crewKey,
        fileName: file.name,
        fileUrl,
        fileSize,
        publicId: storagePath, // reuse publicId to store storage path for deletion
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}