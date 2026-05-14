"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRows() {
      try {
        setLoading(true);
        const res = await fetch("/api/eregistration", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load records.");
        if (!active) return;

        const mapped: Row[] = (json.records ?? []).map((r: any) => ({
          id: String(r.id),
          category: r.category as AccountCategory,
          crewName: String(r.crew_name ?? ""),
          email: String(r.email ?? ""),
          password: String(r.password ?? ""),
        }));

        setRows(mapped);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load records.";
        alert(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRows();
    return () => {
      active = false;
    };
  }, []);

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

  async function saveRow() {
    if (!form.crewName.trim() || !form.email.trim() || !form.password.trim()) {
      alert("Please fill in Name of Crew, Email, and Password.");
      return;
    }
    if (saving) return;

    try {
      setSaving(true);
      if (editId) {
        const res = await fetch("/api/eregistration", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editId,
            crewName: form.crewName.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to update record.");

        setRows((prev) =>
          prev.map((r) =>
            r.id === editId
              ? {
                ...r,
                crewName: String(json.record?.crew_name ?? form.crewName.trim()),
                email: String(json.record?.email ?? form.email.trim()),
                password: String(json.record?.password ?? form.password.trim()),
              }
              : r,
          ),
        );
      } else {
        const res = await fetch("/api/eregistration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: activeTab,
            crewName: form.crewName.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to create record.");

        setRows((prev) => [
          {
            id: String(json.record?.id),
            category: (json.record?.category ?? activeTab) as AccountCategory,
            crewName: String(json.record?.crew_name ?? form.crewName.trim()),
            email: String(json.record?.email ?? form.email.trim()),
            password: String(json.record?.password ?? form.password.trim()),
          },
          ...prev,
        ]);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save record.";
      alert(message);
    } finally {
      setSaving(false);
    }
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

  async function deleteRow(id: string) {
    if (!confirm("Delete this record?")) return;

    try {
      const res = await fetch("/api/eregistration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete record.");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete record.";
      alert(message);
    }
  }

  const colors = {
    navy: "#102a43",
    slate: "#5a6f86",
    line: "#d8e3ef",
    panel: "#ffffff",
    soft: "#f8fbff",
    gold: "#b8841f",
    goldSoft: "#fdf7e9",
    blue: "#1a6bbf",
  } as const;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: `1px solid ${colors.line}`,
    borderRadius: "8px",
    fontSize: "13px",
    color: colors.navy,
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
                border: active ? `1px solid ${colors.gold}` : `1px solid ${colors.line}`,
                background: active ? colors.goldSoft : "#fff",
                color: active ? colors.gold : colors.slate,
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
            background: "linear-gradient(135deg, #b8841f, #e8b84b)",
            border: "none",
            borderRadius: "8px",
            padding: "9px 14px",
            cursor: "pointer",
          }}
        >
          Add Account
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
            background: colors.panel,
            border: `1px solid ${colors.line}`,
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
              disabled={saving}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                background: saving ? "#86c29b" : "#16a34a",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : editId ? "Save Changes" : "Save Row"}
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
                color: colors.slate,
                background: "#fff",
                border: `1px solid ${colors.line}`,
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

      <div style={{ background: colors.panel, border: `1px solid ${colors.line}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(16,42,67,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["NAME OF CREW", "EMAIL", "PASSWORD", "ACTIONS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "13px 18px",
                      fontSize: "11px",
                      fontFamily: "var(--font-cinzel)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: colors.gold,
                      borderRight: `1px solid ${colors.line}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={4} style={{ padding: "26px 22px", color: "#8ea1b8", fontSize: "13px" }}>
                      Loading records...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                    <td colSpan={4} style={{ padding: "26px 22px", color: "#8ea1b8", fontSize: "13px" }}>
                      No records for {activeTab}.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#ffffff" : colors.soft, borderTop: `1px solid ${colors.line}` }}>
                    <td style={{ padding: "14px 18px", color: colors.navy, fontWeight: 600, fontSize: "14px" }}>{r.crewName}</td>
                    <td style={{ padding: "14px 18px", color: colors.blue, fontSize: "14px", fontWeight: 500 }}>{r.email}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", color: colors.navy, fontWeight: 700, fontSize: "16px", letterSpacing: "0.04em" }}>
                          {showPassword[r.id] ? r.password : "********"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                          style={{
                            fontSize: "12px",
                            border: `1px solid ${colors.line}`,
                            borderRadius: "10px",
                            background: "#f8fafc",
                            padding: "5px 11px",
                            color: colors.slate,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {showPassword[r.id] ? "Hide" : "Show"}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => editRow(r)}
                          style={{ fontSize: "12px", padding: "7px 14px", borderRadius: "10px", background: "rgba(184,132,31,0.1)", color: colors.gold, border: "1px solid rgba(184,132,31,0.25)", cursor: "pointer", fontWeight: 700 }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(r.id)}
                          style={{ fontSize: "12px", padding: "7px 14px", borderRadius: "10px", background: "rgba(192,57,43,0.06)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer", fontWeight: 700 }}
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
