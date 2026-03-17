import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "poseidon-ims/profiles",
        public_id: `profile_${userId}`,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as { secure_url: string });
      }
    ).end(buffer);
  });

  return NextResponse.json({
    ok: true,
    imageUrl: result.secure_url,
  });
}