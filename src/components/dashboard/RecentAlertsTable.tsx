// src/components/dashboard/RecentAlertsTable.tsx
"use client";

import { useState } from "react";
import { formatDate, formatDaysLeft, URGENCY_CONFIG } from "@/lib/utils";
import type { UrgencyLevel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  entityType: string;
  name: string;
  owner: string;
  expiryDate: Date;
  daysLeft: number;
  urgency: UrgencyLevel;
}

const ENTITY_ICONS: Record<string, string> = {
  VesselCertificate: "🚢",
  CrewDocument: "👤",
  PortPermit: "⚓",
  ShipInspection: "🔍",
};

const ENTITY_LABELS: Record<string, string> = {
  VesselCertificate: "Vessel Certificate",
  CrewDocument: "Crew Document",
  PortPermit: "Port Permit",
  ShipInspection: "Ship Inspection",
};

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "🔴 Expired", value: "expired" },
  { label: "🟠 Critical", value: "critical" },
  { label: "🟡 Warning", value: "warning" },
  { label: "🔵 Caution", value: "caution" },
];

export default function RecentAlertsTable({ alerts }: { alerts: Alert[] }) {
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = alerts.filter((a) => {
    const urgencyMatch = filter === "all" || a.urgency === filter;
    const typeMatch = typeFilter === "all" || a.entityType === typeFilter;
    return urgencyMatch && typeMatch;
  });

  return (
    <div className="bg-[#111e35] rounded-2xl border border-white/[0.06] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-syne font-semibold text-sm text-slate-200 uppercase tracking-widest">
            Expiry Tracker
          </h2>
          <p className="text-slate-500 text-xs font-dm mt-0.5">All documents expiring within 90 days</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-[#0f2044] border border-white/[0.08] text-slate-300 rounded-lg px-3 py-2 font-dm focus:outline-none focus:border-[#1a9bdc]/40"
          >
            <option value="all">All Types</option>
            <option value="VesselCertificate">🚢 Vessel Certs</option>
            <option value="CrewDocument">👤 Crew Docs</option>
            <option value="PortPermit">⚓ Port Permits</option>
            <option value="ShipInspection">🔍 Inspections</option>
          </select>
        </div>
      </div>

      {/* Urgency filter pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg font-dm transition-all",
              filter === opt.value
                ? "bg-[#1a9bdc]/20 text-[#1a9bdc] border border-[#1a9bdc]/30 font-medium"
                : "text-slate-400 border border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.04]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
        <table className="w-full text-sm font-dm">
          <thead>
            <tr className="bg-[#0f2044]">
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Document</th>
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Vessel / Owner</th>
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Expiry Date</th>
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Days Left</th>
              <th className="text-left px-4 py-3 text-[11px] font-syne uppercase tracking-widest text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 text-sm">
                  No records match the selected filters
                </td>
              </tr>
            )}
            {filtered.map((alert, i) => {
              const config = URGENCY_CONFIG[alert.urgency];
              return (
                <tr
                  key={alert.id}
                  className={cn(
                    "border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors",
                    config.rowClass
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="text-base">{ENTITY_ICONS[alert.entityType]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium text-xs">{alert.name}</p>
                    <p className="text-slate-500 text-[11px]">{ENTITY_LABELS[alert.entityType]}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{alert.owner}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(alert.expiryDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        alert.urgency === "expired" ? "text-red-400" :
                        alert.urgency === "critical" ? "text-orange-400" :
                        alert.urgency === "warning" ? "text-yellow-400" :
                        "text-cyan-400"
                      )}
                    >
                      {formatDaysLeft(alert.daysLeft)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-syne font-semibold px-2 py-1 rounded-md", config.badgeClass)}>
                      {config.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-[11px] font-dm mt-3">
        Showing {filtered.length} of {alerts.length} records within 90-day window
      </p>
    </div>
  );
}
