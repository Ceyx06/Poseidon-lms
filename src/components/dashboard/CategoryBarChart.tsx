// src/components/dashboard/CategoryBarChart.tsx
"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  stats: {
    byCategory: {
      vesselCerts: number;
      crewDocs: number;
      portPermits: number;
      shipInspections: number;
    };
  };
}

export default function CategoryBarChart({ stats }: Props) {
  const { byCategory } = stats;

  const data = {
    labels: ["Vessel Certificates", "Crew Documents", "Port Permits", "Ship Inspections"],
    datasets: [
      {
        label: "Total Documents",
        data: [
          byCategory.vesselCerts,
          byCategory.crewDocs,
          byCategory.portPermits,
          byCategory.shipInspections,
        ],
        backgroundColor: [
          "rgba(26, 155, 220, 0.7)",
          "rgba(13, 211, 184, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(249, 115, 22, 0.7)",
        ],
        borderColor: [
          "rgba(26, 155, 220, 1)",
          "rgba(13, 211, 184, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(249, 115, 22, 1)",
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#64748b",
          font: { size: 11, family: "'DM Sans', sans-serif" },
        },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: "#64748b",
          font: { size: 11, family: "'DM Sans', sans-serif" },
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="bg-[#111e35] rounded-2xl border border-white/[0.06] p-6 h-full">
      <h2 className="font-syne font-semibold text-sm text-slate-200 uppercase tracking-widest mb-1">
        Documents by Category
      </h2>
      <p className="text-slate-500 text-xs font-dm mb-5">Total tracked per maritime document type</p>

      <div style={{ height: "240px" }}>
        <Bar data={data} options={options as any} />
      </div>
    </div>
  );
}
