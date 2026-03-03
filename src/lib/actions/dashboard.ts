// src/lib/actions/dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getDaysLeft, getUrgency } from "@/lib/utils";
import { computeCrewExpiryDate, listCrewDocuments } from "@/lib/crew-documents";
import { addMonths, differenceInCalendarDays, isBefore, startOfDay, subMonths, subWeeks } from "date-fns";

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
  ] = await Promise.all([
    prisma.vesselCertificate.findMany({ select: { expiryDate: true, status: true } }),
    listCrewDocuments(),
    prisma.portPermit.findMany({ select: { expiryDate: true, status: true } }),
    prisma.shipInspection.findMany({ select: { nextDueDate: true, status: true } }),
    prisma.vessel.count({ where: { status: "ACTIVE" } }),
  ]);

  // Dashboard "Total Crew" should follow Crew Documents table rows (OWWA records).
  const totalCrew = crewRows.length;

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
  const today = startOfDay(new Date());

  const records = await listCrewDocuments();

  type AlertStatus = "EXPIRED" | "EXPIRING";
  const statusRank: Record<AlertStatus, number> = {
    EXPIRED: 0,
    EXPIRING: 1,
  };

  const alerts = records
    .flatMap((r) => {
      const name = r.crewName?.trim() || "Unnamed";
      const rows: Array<{
        id: string;
        entityType: "CrewDocument";
        name: string;
        document: "OWWA RENEWAL" | "OEC";
        startDate: Date;
        expiryDate: Date;
        daysLeft: number;
        warnDays: number;
        urgency: ReturnType<typeof getUrgency>;
        status: AlertStatus;
        shouldShow: boolean;
      }> = [];

      if (r.owwaRenewalDate) {
        // OWWA: trigger exactly 2 calendar months before renewal date.
        const expiryDate = startOfDay(r.owwaRenewalDate);
        const notificationStartDate = subMonths(expiryDate, 2);
        const daysLeft = differenceInCalendarDays(expiryDate, today);
        const warnDays = 60; // used only for UI metadata
        rows.push({
          id: `${r.id}-owwa`,
          entityType: "CrewDocument",
          name,
          document: "OWWA RENEWAL",
          startDate: r.owwaStartDate ?? r.owwaRenewalDate,
          expiryDate,
          daysLeft,
          warnDays,
          urgency: getUrgency(daysLeft),
          status: daysLeft < 0 ? "EXPIRED" : "EXPIRING",
          shouldShow: !isBefore(today, notificationStartDate),
        });
      }

      if (r.dateProcessed) {
        // OEC: expires after 2 months, but alert starts 2 weeks before expiry.
        const expiryDate = startOfDay(addMonths(r.dateProcessed, 2));
        const notificationStartDate = subWeeks(expiryDate, 2);
        const daysLeft = differenceInCalendarDays(expiryDate, today);
        const warnDays = 14; // 2 weeks
        rows.push({
          id: `${r.id}-oec`,
          entityType: "CrewDocument",
          name,
          document: "OEC",
          startDate: r.dateProcessed,
          expiryDate,
          daysLeft,
          warnDays,
          urgency: getUrgency(daysLeft),
          status: daysLeft < 0 ? "EXPIRED" : "EXPIRING",
          shouldShow: !isBefore(today, notificationStartDate),
        });
      }

      return rows;
    })
    // Show EXPIRED and in-window EXPIRING alerts only.
    .filter((a) => a.shouldShow)
    .sort((a, b) => {
      // 1) EXPIRED first, 2) then EXPIRING.
      const rankDiff = statusRank[a.status] - statusRank[b.status];
      if (rankDiff !== 0) return rankDiff;

      if (a.status === "EXPIRED") {
        // Within EXPIRED: most overdue first.
        const aDaysOverdue = Math.abs(a.daysLeft);
        const bDaysOverdue = Math.abs(b.daysLeft);
        const overdueDiff = bDaysOverdue - aDaysOverdue;
        if (overdueDiff !== 0) return overdueDiff;
      } else {
        // Within EXPIRING: closest expiry first.
        const daysLeftDiff = a.daysLeft - b.daysLeft;
        if (daysLeftDiff !== 0) return daysLeftDiff;
      }

      return a.name.localeCompare(b.name);
    });

  return alerts;
}
