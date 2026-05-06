"use client";

import { useState, useEffect } from "react";

interface Resume {
  id: string;
  crew_name: string;
  file_name: string;
  file_url: string;
  file_size: string;
  public_id: string;
  uploaded_at: string;
}

function getFileIcon(fileName: string) {
  if (/\.pdf$/i.test(fileName)) return "📄";
  if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) return "🖼️";
  if (/\.(doc|docx)$/i.test(fileName)) return "📝";
  return "📎";
}

function getViewUrl(fileName: string, fileUrl: string): string {
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(fileName)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  }
  return fileUrl;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(val: string | null | undefined): string {
  if (!val) return "Unknown";
  const d = new Date(val);
  return isNaN(d.getTime())
    ? "Unknown"
    : d.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function ResumesPage() {
  const [records, setRecords] = useState<Resume[]>([]);
  const [crewName, setCrewName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    try {
      const res = await fetch("/api/resumes");
      const data = await res.json();
      if (data.resumes) {
        setRecords(
          data.resumes.map((r: any) => ({
            id: r.id,
            crew_name: r.crewName ?? "",
            file_name: r.fileName ?? "",
            file_url: r.fileUrl ?? "",
            file_size: r.fileSize ?? "",
            public_id: r.publicId ?? "",
            uploaded_at: formatDate(r.uploadedAt ?? r.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!crewName.trim()) {
      alert("Please enter the crew name.");
      return;
    }
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("crewName", crewName.trim());
      formData.append("file", selectedFile);

      const res = await fetch("/api/resumes", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      const r = data.resume;
      setRecords((prev) => [
        {
          id: r.id,
          crew_name: r.crewName ?? crewName.trim(),
          file_name: r.fileName ?? selectedFile.name,
          file_url: r.fileUrl ?? "",
          file_size: r.fileSize ?? "",
          public_id: r.publicId ?? "",
          uploaded_at: formatDate(r.uploadedAt ?? r.createdAt),
        },
        ...prev,
      ]);

      setCrewName("");
      setSelectedFile(null);
      const input = document.getElementById("resumeFile") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(record: Resume) {
    if (!confirm(`Delete "${record.file_name}"?`)) return;
    setDeletingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const res = await fetch("/api/resumes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, publicId: record.public_id }),
      });
      if (!res.ok) throw new Error("Delete failed.");
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      alert("Delete failed.");
    } finally {
      setDeletingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  }

  const filtered = records.filter(
    (r) =>
      (r.crew_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.file_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "22px",
            color: "#1a2d45",
            marginBottom: "4px",
          }}
        >
          Poseidon - JM Global Resumes
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Upload and manage applicant resumes
        </p>
      </div>

      {/* Upload Box */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1.5px solid rgba(201,151,42,0.25)",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 20px rgba(201,151,42,0.08)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "13px",
            fontWeight: "bold",
            color: "#1a2d45",
            marginBottom: "16px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Upload Resume
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontFamily: "var(--font-cinzel)",
                fontWeight: "600",
                color: "#8a6010",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "6px",
              }}
            >
              Crew Name *
            </label>
            <input
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
              placeholder="Full name of crew member"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1.5px solid #dce6f0",
                fontSize: "13px",
                color: "#1a2d45",
                background: "#f8fafc",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontFamily: "var(--font-cinzel)",
                fontWeight: "600",
                color: "#8a6010",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "6px",
              }}
            >
              Resume File *
            </label>
            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "9px 14px",
                borderRadius: "10px",
                border: "1.5px solid #dce6f0",
                fontSize: "13px",
                color: "#1a2d45",
                background: "#f8fafc",
                boxSizing: "border-box",
                cursor: "pointer",
              }}
            />
          </div>
        </div>

        {selectedFile && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(26,107,191,0.06)",
              border: "1px solid rgba(26,107,191,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "20px" }}>{getFileIcon(selectedFile.name)}</span>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#1a2d45", fontWeight: "500" }}>
                {selectedFile.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6a85a0" }}>
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: "10px 28px",
            borderRadius: "10px",
            background: uploading
              ? "#e0e8f0"
              : "linear-gradient(135deg, #b8841f, #e8b84b)",
            color: uploading ? "#a0b0c0" : "#fff",
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {uploading ? "⏳ Uploading..." : "Upload Resume"}
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Total Resumes", value: records.length, color: "#c9972a", bg: "#fdfbea" },
          {
            label: "PDF Files",
            value: records.filter((r) => /\.pdf$/i.test(r.file_name ?? "")).length,
            color: "#c0392b",
            bg: "#fff5f5",
          },
          {
            label: "Other Files",
            value: records.filter((r) => !/\.pdf$/i.test(r.file_name ?? "")).length,
            color: "#1a6bbf",
            bg: "#eef4ff",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              border: `1px solid ${s.color}25`,
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-cinzel)",
                fontWeight: "bold",
                fontSize: "26px",
                color: s.color,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: "11px", color: s.color, marginTop: "2px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Files List */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e8eef5",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <input
            placeholder="Search by crew name or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1.5px solid #e8eef5",
              fontSize: "13px",
              color: "#1a2d45",
              background: "#f8fafc",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            <p style={{ fontSize: "13px" }}>Loading resumes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👤</div>
            <p
              style={{
                fontSize: "14px",
                fontFamily: "var(--font-cinzel)",
                color: "#1a2d45",
                marginBottom: "6px",
              }}
            >
              No Resumes Uploaded Yet
            </p>
            <p style={{ fontSize: "13px" }}>
              Use the upload form above to add the first resume.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["File", "Crew Name", "File Name", "Size", "Uploaded", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: "10px",
                        fontFamily: "var(--font-cinzel)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#a0b0c0",
                        borderBottom: "1px solid #e8eef5",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderTop: "1px solid #f0f4f8",
                      background: i % 2 === 0 ? "#ffffff" : "#fafbfd",
                    }}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "20px" }}>
                      {getFileIcon(r.file_name ?? "")}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: "500",
                        color: "#1a2d45",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.crew_name}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#6a85a0",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.file_name}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>
                      {r.file_size}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#a0b0c0",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.uploaded_at}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a
                          href={getViewUrl(r.file_name ?? "", r.file_url ?? "")}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "11px",
                            color: "#1a6bbf",
                            textDecoration: "none",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(26,107,191,0.08)",
                            border: "1px solid rgba(26,107,191,0.2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          📎 View
                        </a>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingIds[r.id]}
                          style={{
                            fontSize: "11px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: deletingIds[r.id]
                              ? "#f0f4f8"
                              : "rgba(192,57,43,0.08)",
                            color: deletingIds[r.id] ? "#a0b0c0" : "#c0392b",
                            border: "1px solid rgba(192,57,43,0.2)",
                            cursor: deletingIds[r.id] ? "not-allowed" : "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {deletingIds[r.id] ? "Deleting..." : "🗑️ Delete"}
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