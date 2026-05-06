// app/dashboard/page.tsx
import { getDashboardStats, getExpiringAlerts } from "@/lib/actions/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type CrewAlert = Awaited<ReturnType<typeof getExpiringAlerts>>[number];
// ─── helpers ─────────────────────────────────────────────────────────────────

function displayDate(iso: string | Date) {
  if (!iso) return "—";
  const raw = iso instanceof Date ? iso.toISOString() : iso;
  const [y, m, d] = raw.slice(0, 10).split("-");
  return `${m}/${d}/${y}`;
}

const STATUS_META = {
  EXPIRED: { label: "Expired", color: "#dc2626", bg: "#fff1f2", border: "#fca5a5", dot: "#dc2626" },
  EXPIRING: { label: "Expiring Soon", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", dot: "#f59e0b" },
} as const;

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, bg, border,
}: {
  label: string; value: number; sub: string;
  color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 16, padding: "20px 18px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "var(--font-cinzel)", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: color + "99", marginTop: 2 }}>{sub}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  const m = STATUS_META[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontWeight: 700, padding: "3px 8px",
      borderRadius: 999, background: m.bg, color: m.color,
      letterSpacing: "0.05em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [stats, alerts] = await Promise.all([
    getDashboardStats(),
    getExpiringAlerts(),  ]);

  const expiredAlerts = alerts.filter((a) => a.status === "EXPIRED");
  const expiringSoonAlerts = alerts.filter((a) => a.status === "EXPIRING");
  const urgentAlerts = [...expiredAlerts, ...expiringSoonAlerts];
  const expiredCount = expiredAlerts.length;
  const expiringSoonCount = expiringSoonAlerts.length;
  const expiredCrewCount = new Set(expiredAlerts.map((a) => a.id.split("-")[0])).size;
  const expiringSoonCrewCount = new Set(expiringSoonAlerts.map((a) => a.id.split("-")[0])).size;

  return (
    <div style={{ fontFamily: "var(--font-dm)", padding: "28px 32px", background: "#f0f4f8", minHeight: "100vh" }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#2563eb", marginBottom: 4 }}>
          Poseidon Management
        </p>
        <h1 style={{
          fontFamily: "var(--font-cinzel)", fontWeight: "bold",
          fontSize: 28, color: "#0f1f3d", marginBottom: 4, lineHeight: 1.15,
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          Crew document compliance · OWWA (2-year) and OEC (2-month) expiry tracking
        </p>

      </div>

      {/* ── Urgent banner ─────────────────────────────────────────────────── */}
      {urgentAlerts.length > 0 && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          padding: "16px 20px", borderRadius: 14,
          background: "linear-gradient(135deg,#fff1f2,#fffbeb)",
          border: "1.5px solid #fca5a5",
          marginBottom: 24,
          boxShadow: "0 2px 10px rgba(220,38,38,.08)",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>🚨</span>
          <div>
            <p style={{ fontWeight: 700, color: "#dc2626", fontSize: 14, fontFamily: "var(--font-cinzel)", marginBottom: 3 }}>
              {urgentAlerts.length} crew document{urgentAlerts.length > 1 ? "s" : ""} require immediate attention
            </p>
            <p style={{ fontSize: 12, color: "#b45309" }}>
              {expiredCount > 0 && <><strong>{expiredCount}</strong> already expired &nbsp;·&nbsp;</>}
              {expiringSoonCount > 0 && <><strong>{expiringSoonCount}</strong> expiring soon</>}
              &nbsp;— scroll down to view details
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14, marginBottom: 26,
      }}>
        <StatCard
          label="Total Crew"
          value={stats.totalCrew}
          sub="Active records"
          color="#0f1f3d" bg="#ffffff" border="#e2e8f0"
        />
        <StatCard
          label="Expiring Soon"
          value={expiringSoonCrewCount}
          sub={`${expiringSoonCount} document alerts`}
          color="#ca8a04" bg="#fefce8" border="#fde047"
        />
        <StatCard
          label="Expired"
          value={expiredCrewCount}
          sub={`${expiredCount} document alerts`}
          color="#dc2626" bg="#fff1f2" border="#fca5a5"
        />
      </div>

      {/* ── Expiry tracker ────────────────────────────────────────────────── */}
      <div style={{
        background: "#ffffff", borderRadius: 16,
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 14px rgba(15,31,61,.07)",
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          padding: "18px 24px 0",
          borderBottom: "1px solid #e2e8f0",
          background: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{
                fontFamily: "var(--font-cinzel)", fontWeight: "bold",
                fontSize: 13, color: "#0f1f3d",
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 3,
              }}>
                Expiry Tracker
              </h2>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>
                Crew requiring document renewal — categorized as Expiring Soon or Expired
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["EXPIRED", "EXPIRING"] as const).map((statusKey) => {
                const count = alerts.filter((a) => a.status === statusKey).length;
                if (!count) return null;
                const m = STATUS_META[statusKey];
                return (
                  <span key={statusKey} style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px",
                    borderRadius: 999, background: m.bg, color: m.color,
                    border: `1px solid ${m.border}`,
                  }}>
                    {count} {m.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  { label: "#", w: 40 },
                  { label: "Crew Name", w: 200 },
                  { label: "Document", w: 130 },
                  { label: "Start Date", w: 120 },
                  { label: "Expiry Date", w: 120 },
                  { label: "Days Left", w: 110 },
                  { label: "Status", w: 130 },
                ].map(h => (
                  <th key={h.label} style={{
                    textAlign: "left", padding: "10px 16px",
                    fontSize: 10, fontFamily: "var(--font-cinzel)",
                    textTransform: "uppercase", letterSpacing: "0.12em",
                    color: "#94a3b8", borderBottom: "2px solid #e2e8f0",
                    fontWeight: 700, whiteSpace: "nowrap",
                    minWidth: h.w,
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    textAlign: "center", padding: "52px 24px",
                    color: "#94a3b8", fontSize: 14,
                  }}>
                    <span style={{ display: "block", fontSize: 32, marginBottom: 10 }}>🎉</span>
                    All crew documents are valid for the next 90 days
                  </td>
                </tr>
              ) : (
                alerts.map((alert: CrewAlert, i: number) => {
                  const m = STATUS_META[alert.status];
                  const isExpired = alert.status === "EXPIRED";

                  return (
                    <tr key={alert.id} style={{
                      borderTop: "1px solid #f1f5f9",
                      background: i % 2 === 0 ? "#ffffff" : "#fafbfd",
                      transition: "background .12s",
                    }}>
                      {/* Row number */}
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 11, fontWeight: 500 }}>
                        {i + 1}
                      </td>

                      {/* Crew name */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            background: m.bg, color: m.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {(alert.name || "?")[0].toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 600, color: "#0f1f3d", fontSize: 13 }}>
                            {alert.name || <em style={{ color: "#94a3b8", fontStyle: "italic" }}>Unnamed</em>}
                          </span>
                        </div>
                      </td>

                      {/* Document type */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.05em" }}>{alert.document}</span>
                      </td>

                      {/* Start date */}
                      <td style={{ padding: "12px 16px", color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                        {displayDate(alert.startDate)}
                      </td>

                      {/* Expiry date */}
                      <td style={{ padding: "12px 16px", color: isExpired ? "#dc2626" : "#64748b", fontWeight: isExpired ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                        {displayDate(alert.expiryDate)}
                      </td>

                      {/* Days left */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 700, color: m.color, fontSize: 13 }}>
                          {isExpired
                            ? `${Math.abs(alert.daysLeft)}d overdue`
                            : alert.daysLeft === 0
                              ? "Today"
                              : `${alert.daysLeft}d left`}
                        </span>
                      </td>

                      {/* Urgency badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={alert.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div style={{
            padding: "10px 20px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Showing {alerts.length} alert{alerts.length !== 1 ? "s" : ""} — expiring in active notification windows or already expired
            </span>
            <Link href="/dashboard/crew" style={{
              fontSize: 11, fontWeight: 600, color: "#2563eb",
              textDecoration: "none",
            }}>
              View all crew →
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}







