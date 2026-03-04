"use client";

import { useMemo, useState } from "react";

interface SeaServiceFileRecord {
  id: string;
  crewName: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const ACCEPTED_UPLOAD_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp";

function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileName);
}

function isPdfFile(fileName: string): boolean {
  return /\.pdf$/i.test(fileName);
}

function isOfficeDoc(fileName: string): boolean {
  return /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(fileName);
}

function getPrintableUrl(fileUrl: string, fileName: string): string {
  if (isPdfFile(fileName) || isImageFile(fileName)) return fileUrl;
  if (isOfficeDoc(fileName) && (fileUrl.startsWith("http://") || fileUrl.startsWith("https://"))) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  }
  return fileUrl;
}

export default function SeaServicePage() {
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState<SeaServiceFileRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ crewName: "", fileName: "", fileUrl: "" });

  function resetForm() {
    setForm({ crewName: "", fileName: "", fileUrl: "" });
    setShowForm(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    }));
  }

  function handleSubmit() {
    if (!form.crewName.trim()) {
      alert("Please enter the crew name.");
      return;
    }
    if (!form.fileUrl) {
      alert("Please upload a file.");
      return;
    }

    setRecords((prev) => [
      {
        id: Date.now().toString(),
        crewName: form.crewName.trim(),
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        uploadedAt: new Date().toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);

    resetForm();
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this file record?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function handlePrintFile(fileUrl: string, fileName: string) {
    const printUrl = getPrintableUrl(fileUrl, fileName);
    const printWindow = window.open(printUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups, then try printing again.");
      return;
    }
    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
      }
    };
    printWindow.onload = doPrint;
    setTimeout(doPrint, 1200);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.crewName.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q));
  }, [records, search]);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1.5px solid #dce6f0",
    fontSize: "13px",
    color: "#1a2d45",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontFamily: "var(--font-cinzel)",
    fontWeight: "600" as const,
    color: "#8a6010",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    marginBottom: "6px",
  };

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "22px", color: "#1a2d45", marginBottom: "4px" }}>
            Sea Service Files
          </h1>
          <p style={{ fontSize: "13px", color: "#6a85a0", margin: 0 }}>
            Upload files and manage with open, print, and delete.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ crewName: "", fileName: "", fileUrl: "" });
            setShowForm(true);
          }}
          style={{ fontSize: "13px", padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold" }}
        >
          + Upload File
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1.5px solid rgba(201,151,42,0.25)", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: "bold", color: "#1a2d45", marginBottom: "20px" }}>
            Upload Sea Service File
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Crew Name *</label>
              <input
                value={form.crewName}
                onChange={(e) => setForm((prev) => ({ ...prev, crewName: e.target.value }))}
                placeholder="Enter crew name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>File *</label>
              <input type="file" accept={ACCEPTED_UPLOAD_TYPES} onChange={handleFileChange} style={inputStyle} />
            </div>
          </div>

          {form.fileName && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "10px", background: "#f2f7ff", border: "1px solid #d4e3fb" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#102a43", fontWeight: 600 }}>{form.fileName}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleSubmit}
              style={{ padding: "10px 24px", borderRadius: "10px", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: "bold", fontSize: "13px" }}
            >
              Save File
            </button>
            <button
              onClick={resetForm}
              style={{ padding: "10px 20px", borderRadius: "10px", background: "#f8fafc", color: "#6a85a0", border: "1px solid #e8eef5", cursor: "pointer", fontSize: "13px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e8eef5", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "16px" }}>
          <input
            placeholder="Search by crew name or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e8eef5", fontSize: "13px", color: "#1a2d45", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <p style={{ fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#1a2d45", marginBottom: "8px" }}>No Sea Service Files Yet</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Click "Upload File" to add the first file.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Crew Name", "File Name", "Uploaded", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0b0c0", borderBottom: "1px solid #e8eef5", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "#ffffff" : "#fafbfd" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 500, color: "#1a2d45", whiteSpace: "nowrap" }}>{r.crewName}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.fileName}</td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>{r.uploadedAt}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#1a6bbf", textDecoration: "none", padding: "4px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", border: "1px solid rgba(26,107,191,0.2)", whiteSpace: "nowrap" }}>
                          Open
                        </a>
                        <button onClick={() => handlePrintFile(r.fileUrl, r.fileName)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(13,138,122,0.08)", color: "#0d8a7a", border: "1px solid rgba(13,138,122,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                          Print
                        </button>
                        <button onClick={() => handleDelete(r.id)} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}>
                          Delete
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
    </div>
  );
}
