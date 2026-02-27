"use client";

import { useState } from "react";

const TABS = [
  { id: "account", label: "Account Email & Password", icon: "📧" },
  { id: "ereg",    label: "E-Registration",           icon: "📋" },
  { id: "marine",  label: "Marine Rights",            icon: "⚓" },
  { id: "mismo",   label: "MISMO Account",            icon: "🖥️" },
];

interface AccountRecord {
  id: string;
  crewName: string;
  email: string;
  password: string;
  platform: string;
  remarks: string;
  createdAt: string;
}

export default function ERegistrationPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [form, setForm] = useState({
    crewName: "", email: "", password: "", platform: "", remarks: "",
  });
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  function handleSubmit() {
    if (!form.crewName || !form.email || !form.password) {
      alert("Please fill in Crew Name, Email and Password.");
      return;
    }

    if (editId) {
      setRecords((prev) =>
        prev.map((r) => r.id === editId ? { ...r, ...form } : r)
      );
      setEditId(null);
    } else {
      const newRecord: AccountRecord = {
        id: Date.now().toString(),
        ...form,
        createdAt: new Date().toLocaleDateString("en-PH"),
      };
      setRecords((prev) => [newRecord, ...prev]);
    }

    setForm({ crewName: "", email: "", password: "", platform: "", remarks: "" });
    setShowForm(false);
  }

  function handleEdit(record: AccountRecord) {
    setForm({
      crewName: record.crewName,
      email: record.email,
      password: record.password,
      platform: record.platform,
      remarks: record.remarks,
    });
    setEditId(record.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this record?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function handlePrint() {
    window.print();
  }

  const filtered = records.filter((r) =>
    r.crewName.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
            🔐 Account & Registration
          </h1>
          <p style={{ fontSize: "13px", color: "#6a85a0" }}>
            Manage account credentials, e-registration, marine rights and MISMO
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ crewName: "", email: "", password: "", platform: "", remarks: "" }); }}
          style={{ fontSize: "13px", padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold" }}>
          + Add Record
        </button>
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

      {/* Account Tab */}
      {activeTab === "account" && (
        <div>
          {/* Add/Edit Form */}
          {showForm && (
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid rgba(201,151,42,0.25)", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(201,151,42,0.08)" }}>
              <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#1a2d45", marginBottom: "20px" }}>
                {editId ? "✏️ Edit Account Record" : "📧 Add Account Record"}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)", fontWeight: "600", color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Crew Name *
                  </label>
                  <input
                    value={form.crewName}
                    onChange={(e) => setForm({ ...form, crewName: e.target.value })}
                    placeholder="Full name of crew"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)", fontWeight: "600", color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Platform / System
                  </label>
                  <input
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    placeholder="e.g. SIRB Online, MarSafe"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)", fontWeight: "600", color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="crew@email.com"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)", fontWeight: "600", color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                    Password *
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Account password"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-cinzel)", fontWeight: "600", color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  Remarks
                </label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #dce6f0", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", resize: "none", boxSizing: "border-box" }}
                />
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

          {/* Records Table */}
          <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
              <input
                placeholder="Search crew name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none" }}
              />
              {records.length > 0 && (
                <button onClick={handlePrint} style={{ padding: "10px 18px", borderRadius: "10px", background: "#f8fafc", color: "#6a85a0", border: "1px solid #e8eef5", cursor: "pointer", fontSize: "13px" }}>
                  🖨️ Print
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📧</div>
                <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Records Yet</p>
                <p style={{ fontSize: "13px" }}>Click "+ Add Record" to add the first account.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Crew Name", "Platform", "Email", "Password", "Remarks", "Date Added", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, i) => (
                    <tr key={record.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "500", color: "#1a2d45" }}>{record.crewName}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{record.platform || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#1a6bbf" }}>{record.email}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", color: "#1a2d45", fontSize: "13px" }}>
                            {showPassword[record.id] ? record.password : "••••••••"}
                          </span>
                          <button
                            onClick={() => setShowPassword((prev) => ({ ...prev, [record.id]: !prev[record.id] }))}
                            style={{ fontSize: "12px", background: "none", border: "none", cursor: "pointer", color: "#a0b0c0" }}>
                            {showPassword[record.id] ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{record.remarks || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#a0b0c0", fontSize: "11px" }}>{record.createdAt}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleEdit(record)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", color: "#1a6bbf", border: "1px solid rgba(26,107,191,0.2)", cursor: "pointer" }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDelete(record.id)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer" }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== "account" && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>
              {TABS.find(t => t.id === activeTab)?.icon}
            </div>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </p>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>Coming soon — form functionality will be added here.</p>
          </div>
        </div>
      )}
    </div>
  );
}