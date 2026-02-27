// src/components/dashboard/ExpiryDonutChart.tsx
"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  stats: {
    expired: number;
    critical: number;
    warning: number;
    caution: number;
    safe: number;
  };
}

export default function ExpiryDonutChart({ stats }: Props) {
  const data = {
    labels: ["Expired", "Critical (≤30d)", "Warning (31–60d)", "Caution (61–90d)", "Valid (>90d)"],
    datasets: [
      {
        data: [stats.expired, stats.critical, stats.warning, stats.caution, stats.safe],
        backgroundColor: [
          "rgba(239, 68, 68, 0.85)",
          "rgba(249, 115, 22, 0.85)",
          "rgba(234, 179, 8, 0.85)",
          "rgba(34, 211, 238, 0.85)",
          "rgba(52, 211, 153, 0.85)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 0.3)",
          "rgba(249, 115, 22, 0.3)",
          "rgba(234, 179, 8, 0.3)",
          "rgba(34, 211, 238, 0.3)",
          "rgba(52, 211, 153, 0.3)",
        ],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#94a3b8",
          font: { size: 11, family: "'DM Sans', sans-serif" },
          padding: 12,
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
        },
      },
      tooltip: {
        backgroundColor: "#111e35",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        titleColor: "#e2e8f0",
        bodyColor: "#94a3b8",
        padding: 10,
        cornerRadius: 10,
      },
    },
  };

  const total = stats.expired + stats.critical + stats.warning + stats.caution + stats.safe;
  const atRisk = stats.expired + stats.critical;
  const pct = total > 0 ? Math.round((atRisk / total) * 100) : 0;

  return (
    <div className="bg-[#111e35] rounded-2xl border border-white/[0.06] p-6 h-full">
      <h2 className="font-syne font-semibold text-sm text-slate-200 uppercase tracking-widest mb-1">
        Expiry Status
      </h2>
      <p className="text-slate-500 text-xs font-dm mb-5">Distribution across all document types</p>

      <div className="relative" style={{ height: "220px" }}>
        <Doughnut data={data} options={options} />
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-syne font-bold text-3xl text-white">{pct}%</span>
          <span className="text-[10px] text-slate-500 font-dm">At Risk</span>
        </div>
      </div>
    </div>
  );
}
