"use client";

import { useState, useEffect } from "react";

interface CrewDoc {
  id: string;
  vesselName: string;
  crewName: string;
  position: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  expiryDate: string;
  principal: string;
  remarks: string;
  status: "valid" | "expiring" | "expired";
}

export default function CrewDocumentsPage() {
  const [documents, setDocuments] = useState<CrewDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crew-documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    return `${day}/${month}/${y}`;
  }

  function getStatusStyle(status: string) {
    if (status === "expired")  return { color: "#c0392b", bg: "rgba(192,57,43,0.08)",  label: "Expired"  };
    if (status === "expiring") return { color: "#c0600a", bg: "rgba(192,96,10,0.08)",  label: "Expiring" };
    return                            { color: "#1a7a4a", bg: "rgba(26,122,74,0.08)",  label: "Valid"    };
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: "#a0b0c0" }}>
        <p>Loading crew documents...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
          👥 Crew Documents
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Overview of all crew document records
        </p>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Crew Documents</p>
            <p style={{ fontSize: "13px" }}>No crew documents have been added yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Vessel", "Crew Name", "Position", "Doc Type", "Doc Number", "Issue Date", "Expiry Date", "Principal", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => {
                  const s = getStatusStyle(doc.status);
                  return (
                    <tr key={doc.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{doc.vesselName || "—"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: "500", color: "#1a2d45", whiteSpace: "nowrap" }}>{doc.crewName}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{doc.position || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{doc.docType || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{doc.docNumber || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{formatDate(doc.issueDate)}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{formatDate(doc.expiryDate)}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{doc.principal || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-cinzel)", fontWeight: "bold", padding: "4px 10px", borderRadius: "8px", background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}