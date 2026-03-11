"use client";

import { useEffect, useRef, useState } from "react";

type CertEntry = {
  id: string;
  name: string;
  sizeLabel: string;
  url: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
};

const STORAGE_KEY = "employment-certs-state-v1";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreview(mime: string) {
  return (
    mime.startsWith("application/pdf") ||
    mime.startsWith("image/") ||
    mime.startsWith("text/")
  );
}

function isOfficeDoc(fileName: string, mime: string) {
  const lower = fileName.toLowerCase();
  return (
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("powerpoint") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".ppt") ||
    lower.endsWith(".pptx")
  );
}

async function uploadFileToCloud(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()) as { url: string; size: number; name: string };
}

export default function EmploymentCertList() {
  const [certs, setCerts] = useState<CertEntry[]>([]);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CertEntry[];
      setCerts(parsed);
    } catch (err) {
      console.error("Failed to restore employment certs", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certs));
  }, [certs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    try {
      const incoming: CertEntry[] = await Promise.all(
        Array.from(e.target.files).map(async (file) => {
          const uploaded = await uploadFileToCloud(file);
          return {
            id: crypto.randomUUID(),
            name: file.name.replace(/\.[^.]+$/, ""),
            sizeLabel: formatFileSize(uploaded.size ?? file.size),
            url: uploaded.url,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            uploadedAt: new Date().toLocaleString("en-PH"),
          };
        }),
      );

      setCerts((prev) =>
        [...prev, ...incoming].sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      e.target.value = "";
    }
  }

  function deleteCert(id: string) {
    setCerts((prev) => prev.filter((c) => c.id !== id));
  }

  function openCert(cert: CertEntry) {
    if (canPreview(cert.mimeType)) {
      const win = window.open("", "_blank", "noopener,noreferrer");
      if (win) {
        win.document.write(`
          <html>
            <head><title>${cert.name}</title></head>
            <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#f5f5f5">
              ${
                cert.mimeType.startsWith("image/")
                  ? `<img src="${cert.url}" style="max-width:100%;max-height:100vh;object-fit:contain" />`
                  : `<embed src="${cert.url}" type="${cert.mimeType}" style="width:100vw;height:100vh;border:none;" />`
              }
            </body>
          </html>
        `);
        win.document.close();
      }
    } else if (isOfficeDoc(cert.fileName, cert.mimeType)) {
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(cert.url)}`;
      window.open(officeUrl, "_blank", "noopener,noreferrer");
    } else {
      alert(
        "Preview works for PDF, images, and text files. For other types, please download and open in your desktop app.",
      );
    }
  }

  const filtered = certs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.fileName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "22px",
            color: "#1a2d45",
            marginBottom: "4px",
          }}
        >
          Certificate of Employment
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Upload and manage employment certificates
        </p>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or file..."
          style={{
            width: "100%",
            padding: "9px 12px",
            border: "1px solid #d8e0ea",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#1a2d45",
            outline: "none",
            background: "#fff",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #d7e1ec",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid #e6edf5",
            background: "#f7fafd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
              background: "#1a6bbf",
              border: "none",
              borderRadius: "6px",
              padding: "6px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleUpload}
            style={{ display: "none" }}
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
            NAME
          </span>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px 14px",
              textAlign: "center",
              color: "#8ea1b8",
              fontSize: "13px",
            }}
          >
            {certs.length === 0
              ? "No certificates uploaded yet. Click Upload File to add one."
              : "No results match your search."}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id}
              title={c.fileName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 14px",
                borderTop: i === 0 ? "none" : "1px solid #e6edf5",
                background: "#fff",
                color: "#1a2d45",
                cursor: "default",
              }}
            >
              <span style={{ fontSize: "14px" }}>📄</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#8ea1b8" }}>
                  {c.sizeLabel} • {c.uploadedAt}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => openCert(c)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1a6bbf",
                    background: "#eef4ff",
                    border: "1px solid #c5d9f5",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => deleteCert(c.id)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#c0392b",
                    background: "#fff0ee",
                    border: "1px solid #f5c5c0",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
