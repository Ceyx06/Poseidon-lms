// src/app/api/cron/update-statuses/route.ts
// This route should be called daily via Vercel Cron Jobs (vercel.json)
// or an external scheduler. It auto-updates document statuses based on expiry dates.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDaysLeft, getUrgency } from "@/lib/utils";

// Secure with a secret header so only your scheduler can call it
function isAuthorized(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let updated = 0;

  // ── Vessel Certificates ────────────────────────────────────────────────────
  const certs = await prisma.vesselCertificate.findMany({
    where: { status: { not: "RENEWED" } },
  });
  for (const cert of certs) {
    const days = getDaysLeft(cert.expiryDate);
    const newStatus =
      days < 0 ? "EXPIRED" :
      days <= 90 ? "EXPIRING_SOON" :
      "VALID";
    if (cert.status !== newStatus) {
      await prisma.vesselCertificate.update({
        where: { id: cert.id },
        data: { status: newStatus as any },
      });
      updated++;
    }
  }

  // ── Crew Documents ─────────────────────────────────────────────────────────
  const docs = await prisma.crewDocument.findMany({
    where: { status: { not: "RENEWED" } },
  });
  for (const doc of docs) {
    const days = getDaysLeft(doc.expiryDate);
    const newStatus = days < 0 ? "EXPIRED" : days <= 90 ? "EXPIRING_SOON" : "VALID";
    if (doc.status !== newStatus) {
      await prisma.crewDocument.update({ where: { id: doc.id }, data: { status: newStatus as any } });
      updated++;
    }
  }

  // ── Port Permits ───────────────────────────────────────────────────────────
  const permits = await prisma.portPermit.findMany({
    where: { status: { not: "RENEWED" } },
  });
  for (const permit of permits) {
    const days = getDaysLeft(permit.expiryDate);
    const newStatus = days < 0 ? "EXPIRED" : days <= 90 ? "EXPIRING_SOON" : "VALID";
    if (permit.status !== newStatus) {
      await prisma.portPermit.update({ where: { id: permit.id }, data: { status: newStatus as any } });
      updated++;
    }
  }

  // ── Ship Inspections ───────────────────────────────────────────────────────
  const inspections = await prisma.shipInspection.findMany({
    where: { status: { not: "RENEWED" } },
  });
  for (const insp of inspections) {
    const days = getDaysLeft(insp.nextDueDate);
    const newStatus = days < 0 ? "EXPIRED" : days <= 90 ? "EXPIRING_SOON" : "VALID";
    if (insp.status !== newStatus) {
      await prisma.shipInspection.update({ where: { id: insp.id }, data: { status: newStatus as any } });
      updated++;
    }
  }

  console.log(`[CRON] Updated ${updated} document statuses`);
  return NextResponse.json({ success: true, updated, timestamp: new Date().toISOString() });
}
