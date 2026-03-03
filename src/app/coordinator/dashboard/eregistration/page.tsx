"use client";

import { useState } from "react";

const TABS = [
  { id: "account", label: "Account Email & Password", icon: "📧" },
  { id: "ereg",    label: "E-Registration",           icon: "📋" },
  { id: "marine",  label: "Marine Rights",            icon: "⚓" },
  { id: "mismo",   label: "MISMO Account",            icon: "🖥️" },
];

interface Record {
  id: string;
  crewName: string;
  email: string;
  password: string;
  platform: string;
  remarks: string;
  createdAt: string;
  deletedAt?: string;
}

function TabContentWrapper({ tabLabel, tabIcon }: { tabLabel: string; tabIcon: string }) {
  const [showForm, setShowForm]       = useState(false);
  const [showTrash, setShowTrash]     = useState(false);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [records, setRecords]         = useState<Record[]>([]);
  const [trash, setTrash]             = useState<Record[]>([]);
  const [form, setForm]               = useState({ crewName: "", email: "", password: "", platform: "", remarks: "" });
  const [search, setSearch]           = useState("");
  const [editId, setEditId]           = useState<string | null>(null);

  function handleSubmit() {
    if (!form.crewName || !form.email || !form.password) {
      alert("Please fill in Crew Name, Email and Password.");
      return;
    }
    if (editId) {
      setRecords((prev) => prev.map((r) => r.id === editId ? { ...r, ...form } : r));
      setEditId(null);
    } else {
      setRecords((prev) => [{
        id: Date.now().toString(), ...form,
        createdAt: new Date().toLocaleDateString("en-PH"),
      }, ...prev]);
    }
    setForm({ crewName: "", email: "", password: "", platform: "", remarks: "" });
    setShowForm(false);
  }

  function handleEdit(r: Record) {
    setForm({ crewName: r.crewName, email: r.email, password: r.password, platform: r.platform, remarks: r.remarks });
    setEditId(r.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm("Move this record to Recently Deleted?")) {
      const record = records.find((r) => r.id === id);
      if (!record) return;
      setTrash((prev) => [{
        ...record,
        deletedAt: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      }, ...prev]);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function handleRestore(id: string) {
    const record = trash.find((r) => r.id === id);
    if (!record) return;
    const { deletedAt, ...restored } = record;
    setRecords((prev) => [restored, ...prev]);
    setTrash((prev) => prev.filter((r) => r.id !== id));
  }

  function handlePermanentDelete(id: string) {
    if (confirm("Permanently delete this record? This cannot be undone.")) {
      setTrash((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function handleEmptyTrash() {
    if (confirm(`Permanently delete all ${trash.length} records in trash? This cannot be undone.`)) {
      setTrash([]);
    }
  }

  const filtered = records.filter((r) =>
    r.crewName.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
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
    <div>
      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm({ crewName: "", email: "", password: "", platform: "", remarks: "" }); setShowTrash(false); }}
            style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "10px", background: "rgba(201,151,42,0.1)", color: "#8a6010", border: "1px solid rgba(201,151,42,0.3)", cursor: "pointer", fontWeight: "500" }}>
            + Add {tabLabel} Record
          </button>
          <button
            onClick={() => { setShowTrash(!showTrash); setShowForm(false); }}
            style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "10px", background: showTrash ? "rgba(192,57,43,0.1)" : "#f8fafc", color: showTrash ? "#c0392b" : "#6a85a0", border: showTrash ? "1px solid rgba(192,57,43,0.3)" : "1px solid #e8eef5", cursor: "pointer", fontWeight: "500" }}>
            🗑️ Recently Deleted {trash.length > 0 && `(${trash.length})`}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid rgba(201,151,42,0.25)", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#1a2d45", marginBottom: "20px" }}>
            {editId ? `✏️ Edit ${tabLabel} Record` : `${tabIcon} Add ${tabLabel} Record`}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Crew Name *</label>
              <input value={form.crewName} onChange={(e) => setForm({ ...form, crewName: e.target.value })} placeholder="Full name of crew" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Platform / System</label>
              <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} placeholder="e.g. SIRB Online, MarSafe" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="crew@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Account password" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." rows={2} style={{ ...inputStyle, resize: "none" }} />
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

      {/* Recently Deleted */}
      {showTrash && (
        <div style={{ background: "#fff5f5", borderRadius: "16px", border: "1.5px solid rgba(192,57,43,0.2)", padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#c0392b" }}>
                🗑️ Recently Deleted
              </h3>
              <p style={{ fontSize: "12px", color: "#e07060", marginTop: "2px" }}>
                Records can be restored anytime or permanently deleted
              </p>
            </div>
            {trash.length > 0 && (
              <button onClick={handleEmptyTrash}
                style={{ fontSize: "11px", padding: "6px 14px", borderRadius: "8px", background: "rgba(192,57,43,0.1)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)", cursor: "pointer" }}>
                🗑️ Empty Trash
              </button>
            )}
          </div>

          {trash.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#a0b0c0" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
              <p style={{ fontSize: "13px" }}>No recently deleted records</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "rgba(192,57,43,0.05)" }}>
                    {["Crew Name", "Platform", "Email", "Deleted At", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c0392b", borderBottom: "1px solid rgba(192,57,43,0.15)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trash.map((r, i) => (
                    <tr key={r.id} style={{ borderTop: "1px solid rgba(192,57,43,0.08)", background: i % 2 === 0 ? "transparent" : "rgba(192,57,43,0.02)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "500", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.crewName}</td>
                      <td style={{ padding: "12px 14px", color: "#a0b0c0" }}>{r.platform || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#a0b0c0" }}>{r.email}</td>
                      <td style={{ padding: "12px 14px", color: "#a0b0c0", fontSize: "11px", whiteSpace: "nowrap" }}>{r.deletedAt}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleRestore(r.id)}
                            style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,122,74,0.08)", color: "#1a7a4a", border: "1px solid rgba(26,122,74,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                            ♻️ Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(r.id)}
                            style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                            ✕ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "16px" }}>
          <input placeholder="Search by crew name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>{tabIcon}</div>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No {tabLabel} Records Yet</p>
            <p style={{ fontSize: "13px" }}>Click the button above to add the first record.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Crew Name", "Platform", "Email", "Password", "Remarks", "Date Added", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "500", color: "#1a2d45", whiteSpace: "nowrap" }}>{r.crewName}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.platform || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#1a6bbf" }}>{r.email}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", color: "#1a2d45" }}>
                          {showPassword[r.id] ? r.password : "••••••••"}
                        </span>
                        <button onClick={() => setShowPassword((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                          style={{ fontSize: "14px", background: "none", border: "none", cursor: "pointer" }}>
                          {showPassword[r.id] ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.remarks || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#a0b0c0", fontSize: "11px", whiteSpace: "nowrap" }}>{r.createdAt}</td>
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

export default function ERegistrationPage() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "24px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
  🔐 Account Email & Password
</h1>
<p style={{ fontSize: "13px", color: "#6a85a0" }}>
  Manage account credentials, e-registration, marine rights and MISMO
</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 18px", borderRadius: "12px", fontSize: "13px", cursor: "pointer",
            fontFamily: "var(--font-dm)", fontWeight: activeTab === tab.id ? "600" : "400",
            background: activeTab === tab.id ? "rgba(201,151,42,0.12)" : "#ffffff",
            border: activeTab === tab.id ? "1.5px solid rgba(201,151,42,0.4)" : "1px solid #e8eef5",
            color: activeTab === tab.id ? "#8a6010" : "#6a85a0",
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {TABS.map((tab) => (
        <div key={tab.id} style={{ display: activeTab === tab.id ? "block" : "none" }}>
          <TabContentWrapper tabLabel={tab.label} tabIcon={tab.icon} />
        </div>
      ))}
    </div>
  );
}