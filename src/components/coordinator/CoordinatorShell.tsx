"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/coordinator/dashboard",                label: "Dashboard",           icon: "📊" },
  { href: "/coordinator/dashboard/crew",           label: "Crew Documents",      icon: "📁" },
  { href: "/coordinator/dashboard/sea-service",    label: "Sea Service Records", icon: "⚓" },
  { href: "/coordinator/dashboard/employment",     label: "Employment Certs",    icon: "📜" },
  { href: "/coordinator/dashboard/resumes",        label: "JM Global Resumes",   icon: "👤" },
  { href: "/coordinator/dashboard/metrobank",      label: "Metrobank Referral",  icon: "🏦" },
  { href: "/coordinator/dashboard/panstar-dep",    label: "PANSTAR Departures",  icon: "🚢" },
  { href: "/coordinator/dashboard/panstar-con",    label: "PANSTAR Contracts",   icon: "📋" },
  { href: "/coordinator/dashboard/eregistration",  label: "Account Email & Password",      icon: "🔐" },
];

export default function CoordinatorShell({ children, user }: {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f0f4f8" }}>

      {/* Sidebar */}
      <aside style={{
        width: "255px", flexShrink: 0, display: "flex", flexDirection: "column",
        height: "100vh", background: "#ffffff",
        borderRight: "1px solid #e8eef5", boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}>
        {/* Logo */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eef5", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/poseidon-logo.png" alt="Poseidon" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "12px", color: "#8a6010" }}>Poseidon IMS</div>
            <div style={{ fontSize: "9px", color: "#10b8a4", letterSpacing: "0.08em", fontWeight: "600", textTransform: "uppercase" }}>Crewing Coordinator</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          <p style={{ fontSize: "9px", fontFamily: "var(--font-cinzel)", fontWeight: "600", letterSpacing: "0.2em", color: "#c9972a", textTransform: "uppercase", padding: "0 12px", marginBottom: "10px" }}>
            Crew Management
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "12px", marginBottom: "2px",
                fontSize: "12px", textDecoration: "none", fontFamily: "var(--font-dm)",
                background: isActive ? "rgba(16,184,164,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(16,184,164,0.25)" : "1px solid transparent",
                color: isActive ? "#0d8a7a" : "#6a85a0",
                fontWeight: isActive ? "500" : "400",
              }}>
                <span style={{ fontSize: "15px" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b8a4" }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #e8eef5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b8a4" }} />
            <p style={{ fontSize: "10px", color: "#a0b0c0" }}>System Online</p>
          </div>
          <p style={{ fontSize: "10px", color: "#c0d0e0" }}>© 2026 Poseidon IMS</p>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* TopBar */}
        <header style={{
          height: "64px", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px",
          background: "#ffffff", borderBottom: "1px solid #e8eef5",
          boxShadow: "0 1px 8px rgba(0,0,0,0.05)", flexShrink: 0,
        }}>
          <p style={{ fontSize: "12px", color: "#a0b0c0" }}>
            {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "rgba(16,184,164,0.08)", border: "1px solid rgba(16,184,164,0.2)" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b8a4" }} />
              <span style={{ fontSize: "11px", color: "#0d8a7a" }}>Live</span>
            </div>
            <Link
              href="/coordinator/dashboard/security"
              title="Open Security Settings"
              style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a2d45" }}>{user?.name}</p>
                <p style={{ fontSize: "11px", color: "#a0b0c0" }}>{user?.email}</p>
              </div>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,184,164,0.12)", border: "1.5px solid rgba(16,184,164,0.3)", fontSize: "14px", fontWeight: "bold", color: "#0d8a7a" }}>
                {user?.name?.[0]?.toUpperCase() ?? "C"}
              </div>
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ fontSize: "12px", color: "#a0b0c0", cursor: "pointer", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e8eef5", background: "transparent" }}>
              Sign out
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px", background: "#f0f4f8" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

