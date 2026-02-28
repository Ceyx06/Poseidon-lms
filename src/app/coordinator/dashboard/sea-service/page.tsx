"use client";

import { useState } from "react";

interface ServiceRecord {
  id: string;
  crewName: string;
  rank: string;
  vesselName: string;
  vesselType: string;
  flag: string;
  grt: string;
  signOnDate: string;
  signOffDate: string;
  duration: string;
  remarks: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

function calcDuration(signOn: string, signOff: string): string {
  if (!signOn || !signOff) return "—";
  const diff = new Date(signOff).getTime() - new Date(signOn).getTime();
  if (diff < 0) return "Invalid";
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
  if (months === 0) return `${days}d`;
  return `${months}m ${days}d`;
}

export default function SeaServicePage() {
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    crewName: "", rank: "", vesselName: "", vesselType: "",
    flag: "", grt: "", signOnDate: "", signOffDate: "",
    remarks: "", fileName: "", fileUrl: "",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
  }

  function handleSubmit() {
    if (!form.crewName || !form.vesselName) {
      alert("Please fill in Crew Name and Vessel Name.");
      return;
    }
    const duration = calcDuration(form.signOnDate, form.signOffDate);
    if (editId) {
      setRecords((prev) => prev.map((r) => r.id === editId ? { ...r, ...form, duration } : r));
      setEditId(null);
    } else {
      setRecords((prev) => [{ id: Date.now().toString(), ...form, duration, createdAt: new Date().toLocaleDateString("en-PH") }, ...prev]);
    }
    setForm({ crewName: "", rank: "", vesselName: "", vesselType: "", flag: "", grt: "", signOnDate: "", signOffDate: "", remarks: "", fileName: "", fileUrl: "" });
    setShowForm(false);
  }

  function handleEdit(r: ServiceRecord) {
    setForm({ crewName: r.crewName, rank: r.rank, vesselName: r.vesselName, vesselType: r.vesselType, flag: r.flag, grt: r.grt, signOnDate: r.signOnDate, signOffDate: r.signOffDate, remarks: r.remarks, fileName: r.fileName, fileUrl: r.fileUrl });
    setEditId(r.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this sea service record?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const filtered = records.filter((r) =>
    r.crewName.toLowerCase().includes(search.toLowerCase()) ||
    r.vesselName.toLowerCase().includes(search.toLowerCase()) ||
    r.rank.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45",
    background: "#f8fafc", outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)",
    fontWeight: "600" as const, color: "#8a6010",
    textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: "6px",
  };

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
            ⚓ Sea Service Records
          </h1>
          <p style={{ fontSize: "13px", color: "#6a85a0" }}>
            Track crew vessel service history and sea time
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ crewName: "", rank: "", vesselName: "", vesselType: "", flag: "", grt: "", signOnDate: "", signOffDate: "", remarks: "", fileName: "", fileUrl: "" }); }}
          style={{ fontSize: "13px", padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold" }}>
          + Add Record
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Records", value: records.length,                                          color: "#0d8a7a", bg: "#edfcfc" },
          { label: "Total Crew",    value: new Set(records.map(r => r.crewName)).size,              color: "#1a6bbf", bg: "#eef4ff" },
          { label: "Vessels",       value: new Set(records.map(r => r.vesselName)).size,            color: "#c9972a", bg: "#fdfbea" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: "14px", padding: "16px" }}>
            <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "26px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: s.color, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid rgba(201,151,42,0.25)", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#1a2d45", marginBottom: "20px" }}>
            {editId ? "✏️ Edit Sea Service Record" : "⚓ Add Sea Service Record"}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Crew Name *</label>
              <input value={form.crewName} onChange={(e) => setForm({ ...form, crewName: e.target.value })} placeholder="Full name of crew" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rank / Position</label>
              <input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="e.g. Chief Officer, AB" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vessel Name *</label>
              <input value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} placeholder="e.g. MV Pacific Star" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vessel Type</label>
              <input value={form.vesselType} onChange={(e) => setForm({ ...form, vesselType: e.target.value })} placeholder="e.g. Bulk Carrier, Tanker" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Flag</label>
              <input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="e.g. Panama, Philippines" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>GRT (Gross Tonnage)</label>
              <input value={form.grt} onChange={(e) => setForm({ ...form, grt: e.target.value })} placeholder="e.g. 25,000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sign-On Date</label>
              <input type="date" value={form.signOnDate} onChange={(e) => setForm({ ...form, signOnDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sign-Off Date</label>
              <input type="date" value={form.signOffDate} onChange={(e) => setForm({ ...form, signOffDate: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* Duration Preview */}
          {form.signOnDate && form.signOffDate && (
            <div style={{ marginBottom: "16px", padding: "10px 16px", borderRadius: "10px", background: "rgba(13,138,122,0.08)", border: "1px solid rgba(13,138,122,0.2)" }}>
              <span style={{ fontSize: "12px", color: "#0d8a7a", fontWeight: "600" }}>
                ⏱️ Duration: {calcDuration(form.signOnDate, form.signOffDate)}
              </span>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." rows={2} style={{ ...inputStyle, resize: "none" }} />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Upload Certificate (PDF / Image)</label>
            <div style={{ border: "2px dashed #dce6f0", borderRadius: "12px", padding: "20px", textAlign: "center", background: "#f8fafc", cursor: "pointer" }}
              onClick={() => document.getElementById("ssrFileInput")?.click()}>
              {form.fileName ? (
                <div>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>📎</div>
                  <p style={{ fontSize: "13px", color: "#1a6bbf", fontWeight: "500" }}>{form.fileName}</p>
                  <p style={{ fontSize: "11px", color: "#a0b0c0" }}>Click to change file</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>☁️</div>
                  <p style={{ fontSize: "13px", color: "#6a85a0" }}>Click to upload PDF or image</p>
                  <p style={{ fontSize: "11px", color: "#a0b0c0" }}>Supports: PDF, JPG, PNG</p>
                </div>
              )}
            </div>
            <input id="ssrFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSubmit} style={{ padding: "10px 24px", borderRadius: "10px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "13px" }}>
              {editId ? "Save Changes" : "Save Record"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ padding: "10px 20px", borderRadius: "10px", background: "#f8fafc", color: "#6a85a0", border: "1px solid #e8eef5", cursor: "pointer", fontSize: "13px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "16px" }}>
          <input placeholder="Search by crew name, vessel or rank..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>⚓</div>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Sea Service Records Yet</p>
            <p style={{ fontSize: "13px" }}>Click "+ Add Record" to add the first sea service record.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Crew Name", "Rank", "Vessel", "Type", "Flag", "GRT", "Sign-On", "Sign-Off", "Duration", "File", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "500", color: "#1a2d45", whiteSpace: "nowrap" }}>{r.crewName}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.rank || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.vesselName}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.vesselType || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.flag || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.grt || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.signOnDate || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.signOffDate || "—"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "rgba(13,138,122,0.08)", color: "#0d8a7a", fontWeight: "600", whiteSpace: "nowrap" }}>
                        {r.duration}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {r.fileUrl ? (
                        <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#1a6bbf", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", border: "1px solid rgba(26,107,191,0.2)", whiteSpace: "nowrap" }}>
                          📎 View
                        </a>
                      ) : <span style={{ color: "#a0b0c0", fontSize: "12px" }}>No file</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleEdit(r)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", color: "#1a6bbf", border: "1px solid rgba(26,107,191,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>✏️ Edit</button>
                        <button onClick={() => handleDelete(r.id)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}