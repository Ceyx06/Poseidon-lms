"use client";

import { useEffect, useMemo, useState } from "react";

interface EmploymentCert {
  id: string;
  crewName: string;
  rank: string;
  vesselName: string;
  principal: string;
  contractStart: string;
  contractEnd: string;
  certNumber: string;
  issuedDate: string;
  issuedBy: string;
  remarks: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  publicId: string;
  createdAt: string;
}

type EmploymentForm = Omit<EmploymentCert, "id" | "createdAt">;

const emptyForm: EmploymentForm = {
  crewName: "",
  rank: "",
  vesselName: "",
  principal: "",
  contractStart: "",
  contractEnd: "",
  certNumber: "",
  issuedDate: "",
  issuedBy: "",
  remarks: "",
  fileName: "",
  fileUrl: "",
  fileSize: "",
  publicId: "",
};

const ACCEPTED_UPLOAD_TYPES = ".pdf,.jpg,.jpeg,.png";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOpenFileUrl(file: Pick<EmploymentCert, "fileName" | "fileUrl">): string {
  if (!file.fileUrl) return "";
  if (/\.pdf$/i.test(file.fileName)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
  }
  return file.fileUrl;
}

export default function EmploymentCertPage() {
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState<EmploymentCert[]>([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EmploymentForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        setLoadError("");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const res = await fetch("/api/employment", {
          cache: "no-store",
          signal: controller.signal,
        });
        window.clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load employment certificates.");
        if (!cancelled) setRecords(Array.isArray(data.records) ? data.records : []);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load employment certificates.");
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setSelectedFile(null);
    const input = document.getElementById("empFileInput") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileUrl: "",
      fileSize: formatFileSize(file.size),
      publicId: "",
    }));
  }

  async function uploadSelectedFile(file: File) {
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: uploadForm,
    });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadData?.error || "File upload failed.");
    }

    return {
      fileName: file.name,
      fileUrl: uploadData.url as string,
      fileSize: formatFileSize(file.size),
      publicId: uploadData.publicId as string,
    };
  }

  async function handleSubmit() {
    if (!form.crewName.trim() || !form.vesselName.trim()) {
      alert("Please fill in Crew Name and Vessel Name.");
      return;
    }

    setSaving(true);
    try {
      const existing = editId ? records.find((r) => r.id === editId) : null;
      const fileFields = selectedFile ? await uploadSelectedFile(selectedFile) : {};
      const payload = {
        ...form,
        ...fileFields,
        crewName: form.crewName.trim(),
        vesselName: form.vesselName.trim(),
        id: editId,
        oldPublicId: selectedFile ? existing?.publicId : undefined,
      };

      const res = await fetch("/api/employment", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to save employment certificate.");

      setRecords((prev) => {
        if (editId) return prev.map((r) => (r.id === editId ? data.record : r));
        return [data.record, ...prev];
      });
      resetForm();
      setShowForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save employment certificate.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(r: EmploymentCert) {
    setForm({
      crewName: r.crewName,
      rank: r.rank,
      vesselName: r.vesselName,
      principal: r.principal,
      contractStart: r.contractStart,
      contractEnd: r.contractEnd,
      certNumber: r.certNumber,
      issuedDate: r.issuedDate,
      issuedBy: r.issuedBy,
      remarks: r.remarks,
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      fileSize: r.fileSize,
      publicId: r.publicId,
    });
    setSelectedFile(null);
    setEditId(r.id);
    setShowForm(true);
  }

  async function handleDelete(record: EmploymentCert) {
    if (!confirm(`Delete employment certificate for ${record.crewName}?`)) return;

    setDeletingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const res = await fetch("/api/employment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, publicId: record.publicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete employment certificate.");
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete employment certificate.");
    } finally {
      setDeletingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  }

  function getContractStatus(contractEnd: string) {
    if (!contractEnd) return null;
    const days = Math.ceil((new Date(contractEnd).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: "Expired", color: "#c0392b", bg: "rgba(192,57,43,0.08)" };
    if (days <= 30) return { label: "Critical", color: "#c0600a", bg: "rgba(192,96,10,0.08)" };
    if (days <= 60) return { label: "Expiring", color: "#9a7d0a", bg: "rgba(154,125,10,0.08)" };
    return { label: "Active", color: "#1a7a4a", bg: "rgba(26,122,74,0.08)" };
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      r.crewName.toLowerCase().includes(q) ||
      r.vesselName.toLowerCase().includes(q) ||
      r.principal.toLowerCase().includes(q) ||
      r.certNumber.toLowerCase().includes(q)
    );
  }, [records, search]);

  const stats = useMemo(() => ([
    { label: "Total Certs", value: records.length, color: "#8b5cf6", bg: "#f5f0ff" },
    { label: "Active", value: records.filter(r => getContractStatus(r.contractEnd)?.label === "Active").length, color: "#1a7a4a", bg: "#edfff5" },
    { label: "Expiring", value: records.filter(r => ["Critical", "Expiring"].includes(getContractStatus(r.contractEnd)?.label ?? "")).length, color: "#c0600a", bg: "#fff8f0" },
    { label: "Expired", value: records.filter(r => getContractStatus(r.contractEnd)?.label === "Expired").length, color: "#c0392b", bg: "#fff5f5" },
  ]), [records]);

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
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
            Certificate of Employment
          </h1>
          <p style={{ fontSize: "13px", color: "#6a85a0" }}>
            Manage crew employment certificates and contract records
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ fontSize: "13px", padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold" }}>
          + Add Certificate
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: "14px", padding: "16px" }}>
            <div style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "26px", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: s.color, marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(192,57,43,0.25)", background: "rgba(192,57,43,0.06)", color: "#9f2b22", borderRadius: "12px", padding: "12px 14px", fontSize: "13px" }}>
          {loadError}
        </div>
      )}

      {showForm && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid rgba(201,151,42,0.25)", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#1a2d45", marginBottom: "20px" }}>
            {editId ? "Edit Certificate" : "Add Employment Certificate"}
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
              <label style={labelStyle}>Principal / Company</label>
              <input value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} placeholder="e.g. JM Global Shipping" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contract Start</label>
              <input type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contract End</label>
              <input type="date" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Certificate Number</label>
              <input value={form.certNumber} onChange={(e) => setForm({ ...form, certNumber: e.target.value })} placeholder="e.g. COE-2024-0001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date Issued</label>
              <input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Issued By</label>
              <input value={form.issuedBy} onChange={(e) => setForm({ ...form, issuedBy: e.target.value })} placeholder="e.g. Poseidon IMS" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." rows={2} style={{ ...inputStyle, resize: "none" }} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Upload Certificate File (PDF / Image)</label>
            <div style={{ border: "2px dashed #dce6f0", borderRadius: "12px", padding: "20px", textAlign: "center", background: "#f8fafc", cursor: "pointer" }}
              onClick={() => document.getElementById("empFileInput")?.click()}>
              {form.fileName ? (
                <div>
                  <div style={{ fontSize: "12px", marginBottom: "4px", fontFamily: "var(--font-cinzel)", color: "#1a6bbf", fontWeight: 700 }}>FILE</div>
                  <p style={{ fontSize: "13px", color: "#1a6bbf", fontWeight: "500", margin: 0 }}>{form.fileName}</p>
                  <p style={{ fontSize: "11px", color: "#a0b0c0", margin: "4px 0 0" }}>{form.fileSize || "Click to change file"}</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "12px", marginBottom: "4px", fontFamily: "var(--font-cinzel)", color: "#6a85a0", fontWeight: 700 }}>UPLOAD</div>
                  <p style={{ fontSize: "13px", color: "#6a85a0", margin: 0 }}>Click to upload PDF or image</p>
                  <p style={{ fontSize: "11px", color: "#a0b0c0", margin: "4px 0 0" }}>Supports: PDF, JPG, PNG</p>
                </div>
              )}
            </div>
            <input id="empFileInput" type="file" accept={ACCEPTED_UPLOAD_TYPES} onChange={handleFileChange} style={{ display: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button disabled={saving} onClick={handleSubmit} style={{ padding: "10px 24px", borderRadius: "10px", background: saving ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)", color: saving ? "#a0b0c0" : "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "13px" }}>
              {saving ? "Saving..." : editId ? "Save Changes" : "Save Certificate"}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} disabled={saving} style={{ padding: "10px 20px", borderRadius: "10px", background: "#f8fafc", color: "#6a85a0", border: "1px solid #e8eef5", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "16px" }}>
          <input placeholder="Search by crew name, vessel, principal or cert number..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#6a85a0" }}>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>Loading Employment Certs</p>
            <p style={{ fontSize: "13px" }}>Fetching records from Supabase...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Employment Certs Yet</p>
            <p style={{ fontSize: "13px" }}>Click "+ Add Certificate" to add the first record.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Crew Name", "Rank", "Vessel", "Principal", "Cert No.", "Contract Start", "Contract End", "Status", "File", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const status = getContractStatus(r.contractEnd);
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "500", color: "#1a2d45", whiteSpace: "nowrap" }}>{r.crewName}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.rank || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.vesselName}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.principal || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0" }}>{r.certNumber || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.contractStart || "-"}</td>
                      <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.contractEnd || "-"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        {status ? (
                          <span style={{ fontSize: "10px", fontFamily: "var(--font-cinzel)", fontWeight: "bold", padding: "4px 10px", borderRadius: "8px", background: status.bg, color: status.color, whiteSpace: "nowrap" }}>
                            {status.label}
                          </span>
                        ) : <span style={{ color: "#a0b0c0" }}>-</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {r.fileUrl ? (
                          <a href={getOpenFileUrl(r)} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#1a6bbf", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", border: "1px solid rgba(26,107,191,0.2)", whiteSpace: "nowrap" }}>
                            View
                          </a>
                        ) : <span style={{ color: "#a0b0c0", fontSize: "12px" }}>No file</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleEdit(r)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", color: "#1a6bbf", border: "1px solid rgba(26,107,191,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>Edit</button>
                          <button disabled={deletingIds[r.id]} onClick={() => handleDelete(r)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: deletingIds[r.id] ? "#f0f4f8" : "rgba(192,57,43,0.08)", color: deletingIds[r.id] ? "#9ca7b5" : "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: deletingIds[r.id] ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                            {deletingIds[r.id] ? "Deleting..." : "Delete"}
                          </button>
                        </div>
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
