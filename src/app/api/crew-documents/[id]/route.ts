import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUCKET = "Poseidon-files";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const doc = await prisma.coordinatorFile.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }


    // Delete from Supabase Storage using the stored path
    if (doc.publicId) {
      const supabase = getSupabase();
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([doc.publicId]);

      if (deleteError) throw deleteError;
    }

    await prisma.coordinatorFile.delete({ where: { id } });


    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}