import { getDashboardStats, getExpiringAlerts } from "@/lib/actions/dashboard";

export const revalidate = 60;

export default async function DashboardPage() {
  const [stats, alerts] = await Promise.all([
    getDashboardStats(),
    getExpiringAlerts(),
  ]);

  const urgentAlerts = alerts.filter(
    (a: any) => a.urgency === "expired" || a.urgency === "critical"
  );

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: "bold",
          fontSize: "24px",
          color: "#1a2d45",
          marginBottom: "4px",
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Overview of maritime document compliance and expiry tracking
        </p>
      </div>

      {/* Urgent Banner */}
      {urgentAlerts.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "16px 20px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #fff5f5, #fff0eb)",
          border: "1.5px solid rgba(239,68,68,0.2)",
          marginBottom: "24px",
        }}>
          <span style={{ fontSize: "22px" }}>🚨</span>
          <div>
            <p style={{ fontWeight: "600", color: "#c0392b", fontSize: "14px", fontFamily: "var(--font-cinzel)" }}>
              {urgentAlerts.length} document{urgentAlerts.length > 1 ? "s" : ""} require immediate attention
            </p>
            <p style={{ fontSize: "12px", color: "#e07060", marginTop: "2px" }}>
              {urgentAlerts.filter((a: any) => a.urgency === "expired").length} expired ·{" "}
              {urgentAlerts.filter((a: any) => a.urgency === "critical").length} expiring within 30 days
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "16px",
        marginBottom: "24px",
      }}>
        {[
          { label: "Total Documents", value: stats.totalDocuments, sub: `${stats.totalVessels} vessels · ${stats.totalCrew} crew`, icon: "📄", color: "#1a6bbf", bg: "#eef4ff" },
          { label: "Expired", value: stats.expired, sub: "Immediate renewal", icon: "🔴", color: "#c0392b", bg: "#fff5f5" },
          { label: "Expiring 31–60d", value: stats.warning, sub: "Plan renewal soon", icon: "🟡", color: "#9a7d0a", bg: "#fdfbea" },
          { label: "Fully Valid", value: stats.safe, sub: "More than 90 days", icon: "🟢", color: "#1a7a4a", bg: "#edfff5" },
        ].map((card) => (
          <div key={card.label} style={{
            background: card.bg,
            border: `1px solid ${card.color}30`,
            borderRadius: "16px",
            padding: "20px 16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: "22px", marginBottom: "10px" }}>{card.icon}</div>
            <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "28px", color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "500", color: card.color, marginTop: "4px" }}>
              {card.label}
            </div>
            <div style={{ fontSize: "10px", color: `${card.color}99`, marginTop: "2px" }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Table */}
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e8eef5",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        padding: "24px",
      }}>
        <h2 style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: "bold",
          fontSize: "13px",
          color: "#1a2d45",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "4px",
        }}>
          Expiry Tracker
        </h2>
        <p style={{ fontSize: "12px", color: "#a0b0c0", marginBottom: "20px" }}>
          All documents expiring within 90 days — sorted by urgency
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["DATE OF OWWA RENEWAL", "NAME OF CREW", "BIRTHDATE", "E-REG NO", "DATE PROCESSED", "STATUS/TRANSACTION", "OEC NO.", "RPF NO.", "POSITION", "VESSEL", "PRINCIPAL"].map((h) => (
                <th key={h} style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  fontSize: "10px",
                  fontFamily: "var(--font-cinzel)",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#a0b0c0",
                  borderBottom: "1px solid #e8eef5",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#a0b0c0" }}>
                  🎉 No documents expiring within 90 days
                </td>
              </tr>
            )}
            {alerts.map((alert: any, i: number) => {
              const urgencyStyles: Record<string, { color: string; bg: string; label: string }> = {
                expired: { color: "#c0392b", bg: "rgba(192,57,43,0.08)", label: "Expired" },
                critical: { color: "#c0600a", bg: "rgba(192,96,10,0.08)", label: "Critical" },
                warning: { color: "#9a7d0a", bg: "rgba(154,125,10,0.08)", label: "Expiring" },
                caution: { color: "#0e7490", bg: "rgba(14,116,144,0.08)", label: "Upcoming" },
                safe: { color: "#1a7a4a", bg: "rgba(26,122,74,0.08)", label: "Valid" },
              };
              const s = urgencyStyles[alert.urgency] ?? urgencyStyles.safe;
              const icons: Record<string, string> = {
                VesselCertificate: "🚢", CrewDocument: "👤",
                PortPermit: "⚓", ShipInspection: "🔍",
              };
              const labels: Record<string, string> = {
                VesselCertificate: "Vessel Cert", CrewDocument: "Crew Doc",
                PortPermit: "Port Permit", ShipInspection: "Inspection",
              };

              return (
                <tr key={alert.id} style={{
                  borderTop: "1px solid #f0f4f8",
                  background: i % 2 === 0 ? "#ffffff" : "#fafbfd",
                }}>
                  <td style={{ padding: "12px 16px", fontSize: "18px" }}>
                    {icons[alert.entityType] ?? "📄"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ fontWeight: "500", color: "#1a2d45", marginBottom: "2px" }}>
                      {alert.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "#a0b0c0" }}>
                      {labels[alert.entityType]}
                    </p>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6a85a0" }}>{alert.owner}</td>
                  <td style={{ padding: "12px 16px", color: "#6a85a0" }}>
                    {new Date(alert.expiryDate).toLocaleDateString("en-PH", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontWeight: "600", color: s.color }}>
                      {alert.daysLeft < 0
                        ? `${Math.abs(alert.daysLeft)}d overdue`
                        : alert.daysLeft === 0
                          ? "Today"
                          : `${alert.daysLeft}d left`}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-cinzel)",
                      fontWeight: "bold",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      background: s.bg,
                      color: s.color,
                    }}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}