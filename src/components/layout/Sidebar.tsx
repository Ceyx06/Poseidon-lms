"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/crew", label: "Crew Documents", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "240px",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#ffffff",
      borderRight: "1px solid #e8eef5",
      boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
    }}>

      {/* Logo */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e8eef5",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <img
          src="/poseidon-logo.png"
          alt="Poseidon"
          style={{ width: "40px", height: "40px", objectFit: "contain" }}
        />
        <div>
          <div style={{
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "13px",
            color: "#8a6010",
            letterSpacing: "0.05em",
          }}>
            Poseidon IMS
          </div>
          <div style={{ fontSize: "9px", color: "#a0b0c0", letterSpacing: "0.1em" }}>
            MARITIME SERVICES
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        <p style={{
          fontSize: "9px",
          fontFamily: "var(--font-cinzel)",
          fontWeight: "600",
          letterSpacing: "0.2em",
          color: "#c9972a",
          textTransform: "uppercase",
          padding: "0 12px",
          marginBottom: "8px",
        }}>
          Main Menu
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "12px",
                marginBottom: "2px",
                fontSize: "13px",
                textDecoration: "none",
                fontFamily: "var(--font-dm)",
                transition: "all 0.15s",
                background: isActive ? "rgba(201,151,42,0.1)" : "transparent",
                border: isActive ? "1px solid rgba(201,151,42,0.25)" : "1px solid transparent",
                color: isActive ? "#8a6010" : "#6a85a0",
                fontWeight: isActive ? "500" : "400",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <div style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#c9972a",
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid #e8eef5",
      }}>
        <p style={{ fontSize: "10px", color: "#a0b0c0" }}>Poseidon IMS v1.0.0</p>
        <p style={{ fontSize: "10px", color: "#c0d0e0" }}>© 2026 All Rights Reserved</p>
      </div>
    </aside>
  );
}