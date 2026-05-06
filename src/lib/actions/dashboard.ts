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

  function parseDateString(value: string | null): Date | null {
    if (!value) return null;
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);
      const month = Number(slashMatch[1]) - 1;
      const day = Number(slashMatch[2]);
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  type AlertStatus = "EXPIRED" | "EXPIRING";
  const statusRank: Record<AlertStatus, number> = {
    EXPIRED: 0,
    EXPIRING: 1,
  };

  const alerts = records
    .map((r) => {
      const name = r.crewName?.trim() || "Unnamed";
      const rows: Array<{
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
        // OWWA: expires 2 years after encoded OWWA date.
        const expiryDate = startOfDay(addMonths(r.owwaRenewalDate, 24));
        const notificationStartDate = subMonths(expiryDate, 2);
        const daysLeft = differenceInCalendarDays(expiryDate, today);
        const warnDays = 60; // used only for UI metadata
        rows.push({
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

      const oecBaseDate = r.dateProcessed ?? parseDateString(r.oecNo ?? null);
      if (oecBaseDate) {
        // OEC: expires after 2 months, but alert starts 2 weeks before expiry.
        const expiryDate = startOfDay(addMonths(oecBaseDate, 2));
        const notificationStartDate = subWeeks(expiryDate, 2);
        const daysLeft = differenceInCalendarDays(expiryDate, today);
        const warnDays = 14; // 2 weeks
        rows.push({
          document: "OEC",
          startDate: oecBaseDate,
          expiryDate,
          daysLeft,
          warnDays,
          urgency: getUrgency(daysLeft),
          status: daysLeft < 0 ? "EXPIRED" : "EXPIRING",
          shouldShow: !isBefore(today, notificationStartDate),
        });
      }

      const visible = rows.filter((x) => x.shouldShow);
      if (!visible.length) return null;

      const sorted = [...visible].sort((a, b) => {
        const rankDiff = statusRank[a.status] - statusRank[b.status];
        if (rankDiff !== 0) return rankDiff;
        if (a.status === "EXPIRED") {
          return Math.abs(b.daysLeft) - Math.abs(a.daysLeft);
        }
        return a.daysLeft - b.daysLeft;
      });

      const primary = sorted[0];
      const docs = new Set(visible.map((v) => v.document));
      const documentLabel =
        docs.size === 2 ? "OWWA RENEWAL / OEC" : primary.document;

      return {
        id: r.id,
        entityType: "CrewDocument" as const,
        name,
        document: documentLabel,
        startDate: primary.startDate,
        expiryDate: primary.expiryDate,
        daysLeft: primary.daysLeft,
        warnDays: primary.warnDays,
        urgency: primary.urgency,
        status: primary.status,
        shouldShow: true,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    // Show EXPIRED and in-window EXPIRING alerts only.
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
