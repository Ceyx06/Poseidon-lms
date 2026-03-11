import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const resumes = await (prisma as any).resume.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { crewName, fileName, fileUrl, fileSize, publicId } = await req.json();
    const resume = await (prisma as any).resume.create({
      data: { crewName, fileName, fileUrl, fileSize, publicId },
    });
    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, publicId } = await req.json();

    // Try to delete file from storage - ignore all errors
    if (publicId) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );
        await supabase.storage.from("Poseidon-files").remove([publicId]);
      } catch { /* ignore */ }

      try {
        const cloudinary = (await import("@/lib/cloudinary")).default;
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      } catch { /* ignore */ }

      try {
        const cloudinary = (await import("@/lib/cloudinary")).default;
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch { /* ignore */ }
    }

    // Always delete from DB
    await (prisma as any).resume.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}