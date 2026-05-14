import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function resolveProfileImageUrl(userId: string): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/poseidon-ims/profiles/profile_${userId}.jpg?v=${Date.now()}`;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const imageUrl = await resolveProfileImageUrl(userId);
  return NextResponse.json({
    name: user.name,
    email: user.email,
    imageUrl,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!name && !email && !newPassword) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data: { name?: string; email?: string; password?: string } = {};

  if (name) {
    if (name.length < 2) return NextResponse.json({ error: "Username is too short" }, { status: 400 });
    data.name = name;
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    data.email = email;
  }

  if (newPassword) {
    if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    if (!currentPassword) return NextResponse.json({ error: "Current password is required" }, { status: 400 });

    const validCurrent = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrent) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    data.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, email: true },
  });

  return NextResponse.json({
    ok: true,
    user: updated,
    message: "Security settings updated",
  });
}
