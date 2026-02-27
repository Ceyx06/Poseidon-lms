"use client";

import { signOut } from "next-auth/react";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null; };
}

export default function TopBar({ user }: TopBarProps) {
  const dateStr = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <header style={{
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      background: "#ffffff",
      borderBottom: "1px solid #e8eef5",
      boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
      flexShrink: 0,
    }}>
      <p style={{ fontSize: "12px", color: "#a0b0c0" }}>
        {dateStr}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "999px",
          background: "rgba(16,184,164,0.08)",
          border: "1px solid rgba(16,184,164,0.2)",
        }}>
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#10b8a4",
          }} />
          <span style={{ fontSize: "11px", color: "#0d8a7a" }}>Live</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a2d45" }}>
              {user?.name}
            </p>
            <p style={{ fontSize: "11px", color: "#a0b0c0" }}>
              {user?.email}
            </p>
          </div>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(201,151,42,0.12)",
            border: "1.5px solid rgba(201,151,42,0.3)",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#8a6010",
          }}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            fontSize: "12px",
            color: "#a0b0c0",
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #e8eef5",
            background: "transparent",
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}