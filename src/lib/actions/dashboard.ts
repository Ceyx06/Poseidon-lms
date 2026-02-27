// src/lib/actions/dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getDaysLeft, getUrgency } from "@/lib/utils";
import { computeCrewExpiryDate, listCrewDocuments } from "@/lib/crew-documents";

export async function getDashboardStats() {
  const today = new Date();
  const in90Days = new Date();
  in90Days.setDate(today.getDate() + 90);

  const [
    vesselCerts,
    crewRows,
    portPermits,
    shipInspections,
    totalVessels,
    totalCrew,
  ] = await Promise.all([
    prisma.vesselCertificate.findMany({ select: { expiryDate: true, status: true } }),
    listCrewDocuments(),
    prisma.portPermit.findMany({ select: { expiryDate: true, status: true } }),
    prisma.shipInspection.findMany({ select: { nextDueDate: true, status: true } }),
    prisma.vessel.count({ where: { status: "ACTIVE" } }),
    prisma.crewMember.count(),
  ]);

  function countByUrgency(records: { expiryDate: Date }[]) {
    return records.reduce(
      (acc, r) => {
        const days = getDaysLeft(r.expiryDate);
        const urgency = getUrgency(days);
        acc[urgency] = (acc[urgency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  const inspectionMapped = shipInspections.map((i) => ({ expiryDate: i.nextDueDate }));

  const crewMapped = crewRows
    .map((r) => {
      const expiryDate = computeCrewExpiryDate(r);
      return expiryDate ? { expiryDate } : null;
    })
    .filter((r): r is { expiryDate: Date } => r !== null);

  const all = [
    ...vesselCerts.map((r) => ({ expiryDate: r.expiryDate })),
    ...crewMapped,
    ...portPermits.map((r) => ({ expiryDate: r.expiryDate })),
    ...inspectionMapped,
  ];

  const urgencyCounts = countByUrgency(all);

  return {
    totalDocuments: all.length,
    totalVessels,
    totalCrew,
    expired: urgencyCounts.expired || 0,
    critical: urgencyCounts.critical || 0,
    warning: urgencyCounts.warning || 0,
    caution: urgencyCounts.caution || 0,
    safe: urgencyCounts.safe || 0,
    byCategory: {
      vesselCerts: vesselCerts.length,
      crewDocs: crewMapped.length,
      portPermits: portPermits.length,
      shipInspections: shipInspections.length,
    },
  };
}

export async function getExpiringAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in90Days = new Date();
  in90Days.setDate(today.getDate() + 90);

  const records = await listCrewDocuments();

  const alerts = records
    .map((r) => {
      const expiryDate = computeCrewExpiryDate(r);
      if (!expiryDate) return null;
      const daysLeft = getDaysLeft(expiryDate);

      return {
        id: r.id,
        entityType: "CrewDocument" as const,
        name: r.crewName,
        owner: r.vessel ?? r.principal ?? "-",
        expiryDate,
        daysLeft,
        urgency: getUrgency(daysLeft),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .filter((a) => a.expiryDate <= in90Days)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return alerts;
}
