"use client";

import { useMemo, useState } from "react";

interface EmploymentCertRecord {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
}

const ACCEPTED_UPLOAD_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

export default function EmploymentCertPage() {
  const [records, setRecords] = useState<EmploymentCertRecord[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function resetForm() {
    setName("");
    setSelectedFile(null);
    const input = document.getElementById("employmentCertFile") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  function handleUpload() {
    const cleanName = name.trim();
    if (!cleanName) {
      alert("Please enter the name.");
      return;
    }
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const newRecord: EmploymentCertRecord = {
      id: Date.now().toString(),
      name: cleanName,
      fileName: selectedFile.name,
      fileUrl: URL.createObjectURL(selectedFile),
    };

    setRecords((prev) => [newRecord, ...prev]);
    resetForm();
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this record?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q),
    );
  }, [records, search]);

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 4px", fontFamily: "var(--font-cinzel)", fontSize: "24px", color: "#102a43" }}>Employment Certificates</h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#6a85a0" }}>Upload certificates and manage by name and file.</p>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid rgba(201,151,42,0.25)", padding: "20px", marginBottom: "16px", boxShadow: "0 8px 18px rgba(201,151,42,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontFamily: "var(--font-cinzel)", fontSize: "14px", color: "#102a43", textTransform: "uppercase", letterSpacing: "0.08em" }}>Upload Certificate</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #c8d6e5", fontSize: "13px", background: "#f8fbff", boxSizing: "border-box" }}
          />
          <input
            id="employmentCertFile"
            type="file"
            accept={ACCEPTED_UPLOAD_TYPES}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #c8d6e5", fontSize: "13px", background: "#f8fbff", boxSizing: "border-box", cursor: "pointer" }}
          />
        </div>

        <button
          onClick={handleUpload}
          style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #b8841f, #e8b84b)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "12px" }}
        >
          Upload
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #d9e3ef", padding: "20px", boxShadow: "0 8px 18px rgba(15,39,66,0.06)" }}>
        <div style={{ marginBottom: "12px" }}>
          <input
            placeholder="Search by name or file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 12px", borderRadius: "10px", border: "1px solid #d0dce8", fontSize: "13px", background: "#f8fbff", boxSizing: "border-box" }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 20px", color: "#7a8fa5", border: "1px dashed #d4e0ec", borderRadius: "12px", background: "#f9fcff" }}>
            <p style={{ margin: 0, fontSize: "14px", fontFamily: "var(--font-cinzel)", color: "#17324d" }}>No certificates yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f5f8fc" }}>
                  {["Name", "File", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "10px", fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6c7e91", borderBottom: "1px solid #e3ebf4", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, index) => (
                  <tr key={record.id} style={{ borderTop: "1px solid #f0f4f8", background: index % 2 === 0 ? "#ffffff" : "#fbfdff" }}>
                    <td style={{ padding: "10px 12px", color: "#102a43", fontWeight: 600 }}>{record.name}</td>
                    <td style={{ padding: "10px 12px", color: "#52667f", whiteSpace: "nowrap" }}>
                      <a href={record.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#1a6bbf", textDecoration: "none" }}>
                        {record.fileName}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <a
                        href={record.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "11px", color: "#1a6bbf", padding: "5px 10px", borderRadius: "6px", background: "rgba(26,107,191,0.08)", border: "1px solid rgba(26,107,191,0.2)", fontWeight: 700, cursor: "pointer", textDecoration: "none", marginRight: "6px", display: "inline-block" }}
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        style={{ fontSize: "11px", color: "#c0392b", padding: "5px 10px", borderRadius: "6px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", fontWeight: 700, cursor: "pointer" }}
                      >
                        Delete
                      </button>
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
