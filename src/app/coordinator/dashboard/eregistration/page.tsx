"use client";

import { useMemo, useState } from "react";

type AccountCategory =
  | "E-REGISTRATION"
  | "MARINE RIGHTS"
  | "MISMO ACCOUNT";

type Row = {
  id: string;
  category: AccountCategory;
  crewName: string;
  email: string;
  password: string;
};

const CATEGORIES: AccountCategory[] = [
  "E-REGISTRATION",
  "MARINE RIGHTS",
  "MISMO ACCOUNT",
];

const EMPTY_FORM = {
  crewName: "",
  email: "",
  password: "",
};

export default function ERegistrationPage() {
  const [activeTab, setActiveTab] = useState<AccountCategory>("E-REGISTRATION");
  const [rows, setRows] = useState<Row[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.category !== activeTab) return false;
      if (!q) return true;
      return r.crewName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    });
  }, [rows, activeTab, query]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function saveRow() {
    if (!form.crewName.trim() || !form.email.trim() || !form.password.trim()) {
      alert("Please fill in Name of Crew, Email, and Password.");
      return;
    }

    if (editId) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editId
            ? {
              ...r,
              crewName: form.crewName,
              email: form.email,
              password: form.password,
            }
            : r,
        ),
      );
    } else {
      setRows((prev) => [
        {
          id: Date.now().toString(),
          category: activeTab,
          crewName: form.crewName,
          email: form.email,
          password: form.password,
        },
        ...prev,
      ]);
    }

    setShowForm(false);
    resetForm();
  }

  function editRow(row: Row) {
    setEditId(row.id);
    setForm({
      crewName: row.crewName,
      email: row.email,
      password: row.password,
    });
    setShowForm(true);
  }

  function deleteRow(id: string) {
    if (!confirm("Delete this record?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d8e0ea",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#1a2d45",
    background: "#fff",
    outline: "none",
  };

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "14px" }}>
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "22px",
            color: "#1a2d45",
            marginBottom: "4px",
            textTransform: "uppercase",
          }}
        >
          E-Registration
        </h1>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        {CATEGORIES.map((cat) => {
          const active = activeTab === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveTab(cat);
                setShowForm(false);
                setEditId(null);
              }}
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                border: active ? "1px solid #22406e" : "1px solid #d8e0ea",
                background: active ? "#0f2347" : "#fff",
                color: active ? "#fff" : "#5d728a",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          type="button"
          onClick={openAdd}
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#fff",
            background: "#1a6bbf",
            border: "none",
            borderRadius: "8px",
            padding: "9px 14px",
            cursor: "pointer",
          }}
        >
          Add Row
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email..."
          style={{ ...inputStyle, maxWidth: 360 }}
        />
      </div>

      {showForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #d8e0ea",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <input
              value={form.crewName}
              onChange={(e) => setForm((p) => ({ ...p, crewName: e.target.value }))}
              placeholder="Name of Crew"
              style={inputStyle}
            />
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              style={inputStyle}
            />
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={saveRow}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                background: "#16a34a",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              {editId ? "Save Changes" : "Save Row"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#5d728a",
                background: "#fff",
                border: "1px solid #d8e0ea",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #d7e1ec", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f2347" }}>
                {["NAME OF CREW", "EMAIL", "PASSWORD", "ACTIONS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "14px 18px",
                      fontSize: "12px",
                      fontFamily: "var(--font-cinzel)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.75)",
                      borderRight: "1px solid rgba(255,255,255,0.16)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "26px 22px", color: "#8ea1b8", fontSize: "13px" }}>
                    No records for {activeTab}.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fbff", borderTop: "1px solid #e2ebf4" }}>
                    <td style={{ padding: "12px 18px", color: "#2d3b4f", fontWeight: 600 }}>{r.crewName}</td>
                    <td style={{ padding: "12px 18px", color: "#1a6bbf" }}>{r.email}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", color: "#2d3b4f" }}>
                          {showPassword[r.id] ? r.password : "********"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                          style={{
                            fontSize: "11px",
                            border: "1px solid #d8e0ea",
                            borderRadius: "6px",
                            background: "#fff",
                            padding: "3px 8px",
                            color: "#6a85a0",
                            cursor: "pointer",
                          }}
                        >
                          {showPassword[r.id] ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => editRow(r)}
                          style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", color: "#1a6bbf", border: "1px solid rgba(26,107,191,0.2)", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(r.id)}
                          style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
