"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface TopBarProps {
  user?: { name?: string | null; email?: string | null; };
}

export default function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name?: string; email?: string; imageUrl?: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/security", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setProfile({
          name: data.name,
          email: data.email,
          imageUrl: data.imageUrl ?? null,
        });
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayImage = profile?.imageUrl || null;

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

        <button
          type="button"
          onClick={() => router.push("/dashboard/security")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#1a2d45" }}>
              {displayName}
            </p>
            <p style={{ fontSize: "11px", color: "#a0b0c0" }}>
              {displayEmail}
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
            overflow: "hidden",
          }}>
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              displayName?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#ffffff",
            cursor: "pointer",
            padding: "9px 14px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #b8841f, #e8b84b, #c9972a)",
            boxShadow: "0 4px 20px rgba(201,151,42,0.35)",
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
