// src/components/dashboard/AlertsPanel.tsx
import { formatDaysLeft, formatDate, URGENCY_CONFIG } from "@/lib/utils";
import type { UrgencyLevel } from "@/lib/utils";

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

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="bg-[#111e35] rounded-2xl border border-white/[0.06] p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-syne font-semibold text-sm text-slate-200 uppercase tracking-widest">
            Active Alerts
          </h2>
          <p className="text-slate-500 text-xs font-dm mt-0.5">Requires attention</p>
        </div>
        <span className="bg-red-500/20 text-red-400 text-xs font-syne font-semibold px-2.5 py-1 rounded-full border border-red-500/25">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {alerts.length === 0 && (
          <p className="text-slate-500 text-sm font-dm text-center py-8">
            🎉 No active alerts within 90 days
          </p>
        )}
        {alerts.map((alert) => {
          const config = URGENCY_CONFIG[alert.urgency];
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0f2044] flex items-center justify-center text-sm">
                {ENTITY_ICONS[alert.entityType] ?? "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-xs font-dm font-medium truncate">{alert.name}</p>
                <p className="text-slate-500 text-[10px] font-dm truncate">{alert.owner}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-syne font-semibold px-1.5 py-0.5 rounded-md ${config.badgeClass}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-dm">
                    {formatDaysLeft(alert.daysLeft)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
