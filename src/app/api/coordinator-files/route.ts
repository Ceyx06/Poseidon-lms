import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureCoordinatorFileTable() {
  // Safety net for environments without Prisma migrations applied.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CoordinatorFile" (
      "id" TEXT PRIMARY KEY,
      "crewName" TEXT NOT NULL,
      "crewKey" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "fileSize" TEXT NOT NULL,
      "publicId" TEXT,
      "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CoordinatorFile_crewKey_idx"
    ON "CoordinatorFile" ("crewKey");
  `);
}

export async function GET() {
  try {
    await ensureCoordinatorFileTable();

    const files = await prisma.coordinatorFile.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = files.map((file) => ({
      id: file.id,
      crewName: file.crewName,
      crewKey: file.crewKey,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      publicId: file.publicId ?? undefined,
      uploadedAt: file.uploadedAt.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/coordinator-files error:", error);
    return NextResponse.json({ error: "Failed to fetch files." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureCoordinatorFileTable();

    const { crewName, crewKey, fileName, fileUrl, fileSize, publicId } = await req.json();

    if (!crewName || !fileName || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const file = await prisma.coordinatorFile.create({
      data: {
        crewName,
        crewKey: crewKey || crewName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        fileName,
        fileUrl,
        fileSize: fileSize || "",
        publicId: publicId || null,
      },
    });

    return NextResponse.json({
      id: file.id,
      crewName: file.crewName,
      crewKey: file.crewKey,
      fileName: file.fileName,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      publicId: file.publicId ?? undefined,
      uploadedAt: file.uploadedAt.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("POST /api/coordinator-files error:", error);
    const message = error instanceof Error ? error.message : "Failed to save file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
