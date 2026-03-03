import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoordinatorDashboardPage() {
  const [totalCrew, totalDocs] = await Promise.all([
    prisma.crewMember.count(),
    prisma.crewDocument.count(),
  ]);

  const modules = [
    { href: "/coordinator/dashboard/crew",          label: "Crew Documents",      icon: "📁", color: "#1a6bbf", bg: "#eef4ff",  desc: "IDs, certs & required files" },
    { href: "/coordinator/dashboard/sea-service",   label: "Sea Service Records", icon: "⚓", color: "#0d8a7a", bg: "#edfcfc",  desc: "Vessel service history" },
    { href: "/coordinator/dashboard/employment",    label: "Employment Certs",    icon: "📜", color: "#8b5cf6", bg: "#f5f0ff",  desc: "Certificate of employment" },
    { href: "/coordinator/dashboard/resumes",       label: "JM Global Resumes",   icon: "👤", color: "#c9972a", bg: "#fdfbea",  desc: "POSEIDON-JM Global resumes" },
    { href: "/coordinator/dashboard/metrobank",     label: "Metrobank Referral",  icon: "🏦", color: "#1a7a4a", bg: "#edfff5",  desc: "Payroll referral forms" },
    { href: "/coordinator/dashboard/panstar-dep",   label: "PANSTAR Departures",  icon: "🚢", color: "#c0392b", bg: "#fff5f5",  desc: "Pre-departure documents" },
    { href: "/coordinator/dashboard/panstar-con",   label: "PANSTAR Contracts",   icon: "📋", color: "#c0600a", bg: "#fff8f0",  desc: "Crew contract details" },
    { href: "/coordinator/dashboard/eregistration", label: "E-Registration",      icon: "🔐", color: "#0e7490", bg: "#edfcfc",  desc: "Email, E-Reg & Marine Rights" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "24px", color: "#1a2d45", marginBottom: "4px" }}>
          Coordinator Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Manage crew documents, records and deployment requirements
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Crew",      value: totalCrew, icon: "👥", color: "#1a6bbf", bg: "#eef4ff" },
          { label: "Total Documents", value: totalDocs, icon: "📄", color: "#0d8a7a", bg: "#edfcfc" },
          { label: "Modules Active",  value: 8,         icon: "📂", color: "#c9972a", bg: "#fdfbea" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: "16px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "32px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: s.color, marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "13px", fontWeight: "bold", color: "#1a2d45", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
        Document Modules
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: mod.bg,
              border: `1px solid ${mod.color}25`,
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              cursor: "pointer",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>{mod.icon}</div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "12px", color: mod.color, marginBottom: "4px" }}>
                {mod.label}
              </div>
              <div style={{ fontSize: "11px", color: "#6a85a0", marginBottom: "10px" }}>
                {mod.desc}
              </div>
              <div style={{ fontSize: "11px", color: mod.color, fontWeight: "600" }}>
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
