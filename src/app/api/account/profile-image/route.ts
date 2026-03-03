import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function getExtensionFromMime(mime: string): string | null {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be 2MB or smaller" }, { status: 400 });
  }

  const ext = getExtensionFromMime(file.type);
  if (!ext) {
    return NextResponse.json({ error: "Use JPG, PNG, or WEBP" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "profiles");
  await fs.mkdir(dir, { recursive: true });

  const oldFiles = await fs.readdir(dir);
  await Promise.all(
    oldFiles
      .filter((f) => f.startsWith(`${userId}.`))
      .map((f) => fs.unlink(path.join(dir, f)).catch(() => {}))
  );

  const fileName = `${userId}${ext}`;
  const filePath = path.join(dir, fileName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));

  return NextResponse.json({
    ok: true,
    imageUrl: `/uploads/profiles/${fileName}?v=${Date.now()}`,
  });
}

