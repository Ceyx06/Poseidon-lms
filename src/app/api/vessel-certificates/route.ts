// src/app/api/vessel-certificates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getDaysLeft, getUrgency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vesselId = searchParams.get("vesselId");
  const status = searchParams.get("status");

  const records = await prisma.vesselCertificate.findMany({
    where: {
      ...(vesselId ? { vesselId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { vessel: { select: { name: true, imoNumber: true } } },
    orderBy: { expiryDate: "asc" },
  });

  const enriched = records.map((r) => ({
    ...r,
    daysLeft: getDaysLeft(r.expiryDate),
    urgency: getUrgency(getDaysLeft(r.expiryDate)),
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const record = await prisma.vesselCertificate.create({ data: body });

  return NextResponse.json(record, { status: 201 });
}
