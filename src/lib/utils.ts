// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, isAfter } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Expiry Utilities ─────────────────────────────────────────────────────────

export type UrgencyLevel = "expired" | "critical" | "warning" | "caution" | "safe";

export interface UrgencyConfig {
  label: string;
  badgeClass: string;
  rowClass: string;
  dotClass: string;
  daysRange: string;
}

export function getDaysLeft(expiryDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(new Date(expiryDate), today);
}

export function getUrgency(daysLeft: number): UrgencyLevel {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "critical";
  if (daysLeft <= 60) return "warning";
  if (daysLeft <= 90) return "caution";
  return "safe";
}

export const URGENCY_CONFIG: Record<UrgencyLevel, UrgencyConfig> = {
  expired: {
    label: "Expired",
    badgeClass: "bg-red-500/20 text-red-400 border border-red-500/30",
    rowClass: "bg-red-500/5 border-l-2 border-l-red-500",
    dotClass: "bg-red-500",
    daysRange: "Past due",
  },
  critical: {
    label: "Critical",
    badgeClass: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    rowClass: "bg-orange-500/5 border-l-2 border-l-orange-500",
    dotClass: "bg-orange-500",
    daysRange: "≤ 30 days",
  },
  warning: {
    label: "Expiring",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    rowClass: "bg-yellow-500/5 border-l-2 border-l-yellow-500",
    dotClass: "bg-yellow-500",
    daysRange: "31–60 days",
  },
  caution: {
    label: "Upcoming",
    badgeClass: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    rowClass: "bg-cyan-500/5 border-l-2 border-l-cyan-500",
    dotClass: "bg-cyan-400",
    daysRange: "61–90 days",
  },
  safe: {
    label: "Valid",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    rowClass: "",
    dotClass: "bg-emerald-400",
    daysRange: "> 90 days",
  },
};

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatDaysLeft(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export const ENTITY_TYPES = [
  { value: "VesselCertificate", label: "Vessel Certificates", icon: "🚢" },
  { value: "CrewDocument", label: "Crew Documents", icon: "👤" },
  { value: "PortPermit", label: "Port Permits", icon: "⚓" },
  { value: "ShipInspection", label: "Ship Inspections", icon: "🔍" },
] as const;

export type EntityType = typeof ENTITY_TYPES[number]["value"];
