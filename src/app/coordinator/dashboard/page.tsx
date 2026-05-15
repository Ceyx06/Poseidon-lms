import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoordinatorDashboardPage() {
  async function safeCount(countFn: () => Promise<number>): Promise<number> {
    try {
      return await countFn();
    } catch (error) {
      console.error("Dashboard count failed:", error);
      return 0;
    }
  }

  const [totalCrew, totalDocs] = await Promise.all([
    safeCount(() => prisma.crewMember.count()),
    safeCount(() => prisma.crewDocument.count()),
  ]);

  const modules = [
    {
      href: "/coordinator/dashboard/crew",
      label: "Crew Documents",
      desc: "IDs, certs & required files",
      color: "#1a6bbf",
      bg: "linear-gradient(135deg,#eef4ff 0%,#dbeafe 100%)",
      border: "#bfdbfe",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="6" width="18" height="24" rx="3" fill="#1a6bbf" fillOpacity="0.18"/>
          <rect x="8" y="2" width="18" height="24" rx="3" fill="#1a6bbf" fillOpacity="0.35"/>
          <rect x="12" y="6" width="18" height="24" rx="3" fill="#1a6bbf" fillOpacity="0.9"/>
          <path d="M17 14h8M17 18h8M17 22h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/sea-service",
      label: "Sea Service Records",
      desc: "Vessel service history",
      color: "#0d8a7a",
      bg: "linear-gradient(135deg,#edfcfc 0%,#ccfbf1 100%)",
      border: "#99f6e4",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M5 24l4-8 5 4 5-10 5 6 5-4" stroke="#0d8a7a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="10" r="4" fill="#0d8a7a" fillOpacity="0.2" stroke="#0d8a7a" strokeWidth="1.5"/>
          <path d="M6 28h24" stroke="#0d8a7a" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/employment",
      label: "Employment Certs",
      desc: "Certificate of employment",
      color: "#7c3aed",
      bg: "linear-gradient(135deg,#f5f0ff 0%,#ede9fe 100%)",
      border: "#ddd6fe",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="7" y="4" width="22" height="28" rx="3" fill="#7c3aed" fillOpacity="0.12" stroke="#7c3aed" strokeWidth="1.5"/>
          <path d="M12 12h12M12 17h12M12 22h8" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="26" cy="27" r="5" fill="#7c3aed"/>
          <path d="M24 27l1.5 1.5L28 25" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/resumes",
      label: "JM Global Resumes",
      desc: "POSEIDON-JM Global resumes",
      color: "#b45309",
      bg: "linear-gradient(135deg,#fdfbea 0%,#fef9c3 100%)",
      border: "#fde68a",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="13" r="6" fill="#b45309" fillOpacity="0.2" stroke="#b45309" strokeWidth="1.5"/>
          <path d="M7 30c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/metrobank",
      label: "Metrobank Referral",
      desc: "Payroll referral forms",
      color: "#1a7a4a",
      bg: "linear-gradient(135deg,#edfff5 0%,#dcfce7 100%)",
      border: "#bbf7d0",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="10" width="28" height="18" rx="4" fill="#1a7a4a" fillOpacity="0.12" stroke="#1a7a4a" strokeWidth="1.5"/>
          <path d="M4 15h28" stroke="#1a7a4a" strokeWidth="1.5"/>
          <rect x="8" y="20" width="6" height="4" rx="1" fill="#1a7a4a" fillOpacity="0.6"/>
          <circle cx="26" cy="8" r="4" fill="#1a7a4a" fillOpacity="0.2" stroke="#1a7a4a" strokeWidth="1.2"/>
          <path d="M24.5 8l1 1 2-2" stroke="#1a7a4a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/panstar-dep",
      label: "PANSTAR Departures",
      desc: "Pre-departure documents",
      color: "#b91c1c",
      bg: "linear-gradient(135deg,#fff5f5 0%,#fee2e2 100%)",
      border: "#fecaca",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M4 26c4-3 8-5 14-5s10 2 14 5" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 18c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/>
          <ellipse cx="18" cy="18" rx="4" ry="4" fill="#b91c1c" fillOpacity="0.2" stroke="#b91c1c" strokeWidth="1.5"/>
          <path d="M18 8V5M26 12l2-2M10 12l-2-2" stroke="#b91c1c" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/panstar-con",
      label: "PANSTAR Contracts",
      desc: "Crew contract details",
      color: "#c2410c",
      bg: "linear-gradient(135deg,#fff8f0 0%,#ffedd5 100%)",
      border: "#fed7aa",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="8" y="4" width="20" height="26" rx="3" fill="#c2410c" fillOpacity="0.12" stroke="#c2410c" strokeWidth="1.5"/>
          <path d="M13 11h10M13 16h10M13 21h6" stroke="#c2410c" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11 28l2 2 4-4" stroke="#c2410c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      href: "/coordinator/dashboard/eregistration",
      label: "E-Registration",
      desc: "Email, E-Reg & Marine Rights",
      color: "#0e7490",
      bg: "linear-gradient(135deg,#ecfeff 0%,#cffafe 100%)",
      border: "#a5f3fc",
      icon: (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="8" y="10" width="20" height="16" rx="3" fill="#0e7490" fillOpacity="0.12" stroke="#0e7490" strokeWidth="1.5"/>
          <path d="M8 13l10 8 10-8" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="27" cy="10" r="4" fill="#0e7490"/>
          <path d="M25.5 10h3M27 8.5v3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        fontFamily: "var(--font-dm, system-ui, sans-serif)",
        minHeight: "100vh",
        padding: "28px 32px",
        background: "linear-gradient(160deg,#f4f8fd 0%,#f8fafc 60%,#eef4ff 100%)",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-stat  { animation: fadeUp 0.45s ease both; }
        .dash-mod   { animation: fadeUp 0.45s ease both; transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .dash-mod:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(15,39,66,0.13) !important; }
        .dash-mod:hover .mod-open { gap: 6px !important; }
        .mod-open { transition: gap 0.18s ease; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32, animation: "fadeUp 0.4s ease both" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a8fa5", fontWeight: 700 }}>
          Coordinator Workspace
        </p>
        <h1
          style={{
            margin: "0 0 6px",
            fontFamily: "var(--font-cinzel, Georgia, serif)",
            fontWeight: 700,
            fontSize: 28,
            color: "#0f2742",
            letterSpacing: "0.02em",
          }}
        >
          Coordinator Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#5a6f86" }}>
          Manage crew documents, records and deployment requirements
        </p>
      </div>

      {/* ── Stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 36,
        }}
      >
        {[
          {
            label: "Total Crew",
            value: totalCrew,
            accent: "#1a6bbf",
            bg: "linear-gradient(135deg,#eef4ff,#dbeafe)",
            border: "#bfdbfe",
            delay: "0.1s",
            icon: (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="10" cy="10" r="5" fill="#1a6bbf" fillOpacity="0.25"/>
                <circle cx="18" cy="10" r="5" fill="#1a6bbf" fillOpacity="0.45"/>
                <path d="M3 24c0-4 3.134-7 7-7h8c3.866 0 7 3 7 7" stroke="#1a6bbf" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            label: "Total Documents",
            value: totalDocs,
            accent: "#0d8a7a",
            bg: "linear-gradient(135deg,#edfcfc,#ccfbf1)",
            border: "#99f6e4",
            delay: "0.18s",
            icon: (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="3" width="14" height="19" rx="2.5" fill="#0d8a7a" fillOpacity="0.18"/>
                <rect x="8" y="6" width="14" height="19" rx="2.5" fill="#0d8a7a" fillOpacity="0.55"/>
                <path d="M11 13h7M11 17h5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            label: "Modules Active",
            value: 8,
            accent: "#b45309",
            bg: "linear-gradient(135deg,#fdfbea,#fef9c3)",
            border: "#fde68a",
            delay: "0.26s",
            icon: (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" fill="#b45309" fillOpacity="0.35"/>
                <rect x="15" y="3" width="10" height="10" rx="2" fill="#b45309" fillOpacity="0.55"/>
                <rect x="3" y="15" width="10" height="10" rx="2" fill="#b45309" fillOpacity="0.55"/>
                <rect x="15" y="15" width="10" height="10" rx="2" fill="#b45309" fillOpacity="0.8"/>
              </svg>
            ),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="dash-stat"
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 18,
              padding: "24px 28px",
              boxShadow: "0 4px 20px rgba(15,39,66,0.07)",
              animationDelay: s.delay,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circle */}
            <div style={{ position: "absolute", top: -20, right: -20, width: 90, height: 90, borderRadius: "50%", background: s.accent, opacity: 0.06 }} />
            <div style={{ marginBottom: 14 }}>{s.icon}</div>
            <div
              style={{
                fontFamily: "var(--font-cinzel, Georgia, serif)",
                fontWeight: 700,
                fontSize: 42,
                lineHeight: 1,
                color: s.accent,
                marginBottom: 8,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: s.accent, fontWeight: 600, opacity: 0.85 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Module header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-cinzel, Georgia, serif)",
            fontSize: 12,
            fontWeight: 700,
            color: "#1a2d45",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Document Modules
        </h2>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#d0dce8,transparent)" }} />
        <span
          style={{
            fontSize: 11,
            color: "#7a8fa5",
            background: "#f0f4f8",
            border: "1px solid #dce6f0",
            borderRadius: 999,
            padding: "3px 10px",
            fontWeight: 600,
          }}
        >
          8 modules
        </span>
      </div>

      {/* ── Module grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
        }}
      >
        {modules.map((mod, i) => (
          <Link key={mod.href} href={mod.href} style={{ textDecoration: "none" }}>
            <div
              className="dash-mod"
              style={{
                background: mod.bg,
                border: `1px solid ${mod.border}`,
                borderRadius: 16,
                padding: "22px 20px 18px",
                boxShadow: "0 2px 12px rgba(15,39,66,0.06)",
                cursor: "pointer",
                height: "100%",
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                animationDelay: `${0.08 + i * 0.05}s`,
              }}
            >
              {/* Subtle corner accent */}
              <div
                style={{
                  position: "absolute",
                  bottom: -16,
                  right: -16,
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: mod.color,
                  opacity: 0.07,
                }}
              />

              {/* Icon */}
              <div style={{ marginBottom: 14 }}>{mod.icon}</div>

              {/* Label */}
              <div
                style={{
                  fontFamily: "var(--font-cinzel, Georgia, serif)",
                  fontWeight: 700,
                  fontSize: 12,
                  color: mod.color,
                  marginBottom: 6,
                  letterSpacing: "0.02em",
                  lineHeight: 1.3,
                }}
              >
                {mod.label}
              </div>

              {/* Desc */}
              <div
                style={{
                  fontSize: 11.5,
                  color: "#6a85a0",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {mod.desc}
              </div>

              {/* Open link */}
              <div
                className="mod-open"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  color: mod.color,
                  fontWeight: 700,
                  background: `${mod.color}14`,
                  border: `1px solid ${mod.color}28`,
                  borderRadius: 999,
                  padding: "4px 12px",
                }}
              >
                Open
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke={mod.color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>


    </div>
  );
}