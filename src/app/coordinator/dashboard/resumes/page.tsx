"use client";

import React, { ChangeEvent, useState } from "react";

type Resume = {
  id: string;
  crewName: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
};

const iconForFile = (fileName: string): string => {
  const ext = fileName.toLowerCase();
  if (ext.endsWith(".pdf")) return "[PDF]";
  if (ext.endsWith(".doc") || ext.endsWith(".docx")) return "[DOC]";
  if (ext.match(/\.(jpg|jpeg|png)$/)) return "[IMG]";
  return "[FILE]";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ResumesPage() {
  const [records, setRecords] = useState<Resume[]>([]);
  const [crewName, setCrewName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  const handleUpload = () => {
    if (!crewName.trim()) {
      alert("Please enter the crew name.");
      return;
    }
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setTimeout(() => {
      const newRecord: Resume = {
        id: crypto.randomUUID(),
        crewName: crewName.trim(),
        fileName: selectedFile.name,
        fileUrl: URL.createObjectURL(selectedFile),
        fileSize: formatFileSize(selectedFile.size),
        uploadedAt: new Date().toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setRecords((prev) => [newRecord, ...prev]);
      setCrewName("");
      setSelectedFile(null);
      const input = document.getElementById("resumeFile") as HTMLInputElement | null;
      if (input) input.value = "";
      setUploading(false);
    }, 500);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this resume?")) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const filtered = records.filter((r) =>
    r.crewName.toLowerCase().includes(search.toLowerCase()) ||
    r.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
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
              onChange={handleFileChange}
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
            <span style={{ fontSize: "14px", fontWeight: 700 }}>
              {iconForFile(selectedFile.name)}
            </span>
            <div>
              <p style={{ fontSize: "13px", color: "#1a2d45", fontWeight: "500" }}>
                {selectedFile.name}
              </p>
              <p style={{ fontSize: "11px", color: "#6a85a0" }}>
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
            background: uploading ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)",
            color: uploading ? "#a0b0c0" : "#fff",
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      </div>

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
            value: records.filter((r) => r.fileName.toLowerCase().endsWith(".pdf")).length,
            color: "#c0392b",
            bg: "#fff5f5",
          },
          {
            label: "Image Files",
            value: records.filter((r) => r.fileName.match(/\.(jpg|jpeg|png)$/i)).length,
            color: "#1a6bbf",
            bg: "#eef4ff",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.color}25`,
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-cinzel)",
                fontWeight: "bold",
                fontSize: "26px",
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "11px", color: stat.color, marginTop: "2px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

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

        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid #e6edf5",
            background: "#f7fafd",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "10px",
              letterSpacing: "0.07em",
              color: "#5d728a",
              fontWeight: 700,
            }}
          >
            Name
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#a0b0c0" }}>
            <div style={{ fontSize: "22px", marginBottom: "12px" }}>No resumes yet</div>
            <p
              style={{
                fontSize: "14px",
                fontFamily: "var(--font-cinzel)",
                color: "#1a2d45",
                marginBottom: "8px",
              }}
            >
              Upload a resume to get started.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["File", "Crew Name", "File Name", "Size", "Uploaded", "Action"].map((heading) => (
                    <th
                      key={heading}
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
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, index) => (
                  <tr
                    key={record.id}
                    style={{
                      borderTop: "1px solid #f0f4f8",
                      background: index % 2 === 0 ? "#ffffff" : "#fafbfd",
                    }}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "14px" }}>
                      {iconForFile(record.fileName)}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: "500",
                        color: "#1a2d45",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record.crewName}
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
                      {record.fileName}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6a85a0", whiteSpace: "nowrap" }}>
                      {record.fileSize}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#a0b0c0", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {record.uploadedAt}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a
                          href={record.fileUrl}
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
                          View
                        </a>
                        <button
                          onClick={() => handleDelete(record.id)}
                          style={{
                            fontSize: "11px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(192,57,43,0.08)",
                            color: "#c0392b",
                            border: "1px solid rgba(192,57,43,0.2)",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
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
