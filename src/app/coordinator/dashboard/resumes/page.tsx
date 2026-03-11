"use client";

import { useEffect, useRef, useState } from "react";

type ResumeEntry = {
  id: string;
  name: string;
  sizeLabel: string;
  url: string;
  fileName: string;
  mimeType: string;
};

const STORAGE_KEY = "resumes-state-v1";

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
  const data = await res.json();
  return data as { url: string; size: number; name: string };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ResumeTable() {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ResumeEntry[];
      setResumes(parsed);
    } catch (err) {
      console.error("Failed to restore resumes", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
  }, [resumes]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    try {
      const incoming: ResumeEntry[] = await Promise.all(
        Array.from(e.target.files).map(async (file) => {
          const uploaded = await uploadFileToCloud(file);
          return {
            id: crypto.randomUUID(),
            name: file.name.replace(/\.[^.]+$/, ""),
            sizeLabel: formatFileSize(uploaded.size ?? file.size),
            url: uploaded.url,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
          };
        }),
      );

      setResumes((prev) =>
        [...prev, ...incoming].sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      e.target.value = "";
    }
  }

  function deleteResume(id: string) {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = resumes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.fileName.toLowerCase().includes(search.toLowerCase()),
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
          Resume
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Upload and manage applicant resumes
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
            accept=".pdf,.doc,.docx"
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
            {resumes.length === 0
              ? "No resumes uploaded yet. Click Upload File to add one."
              : "No results match your search."}
          </div>
        ) : (
          filtered.map((r, i) => (
            <div
              key={r.id}
              title={r.fileName}
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
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.name}
              </span>
              <span style={{ fontSize: "11px", color: "#8ea1b8", marginLeft: "auto" }}>
                {r.sizeLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (canPreview(r.mimeType)) {
                    const win = window.open("", "_blank", "noopener,noreferrer");
                    if (win) {
                      win.document.write(`
                        <html>
                          <head><title>${r.name}</title></head>
                          <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#f5f5f5">
                            ${
                              r.mimeType.startsWith("image/")
                                ? `<img src="${r.url}" style="max-width:100%;max-height:100vh;object-fit:contain" />`
                                : `<embed src="${r.url}" type="${r.mimeType}" style="width:100vw;height:100vh;border:none;" />`
                            }
                          </body>
                        </html>
                      `);
                      win.document.close();
                    }
                  } else if (isOfficeDoc(r.fileName, r.mimeType)) {
                    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(r.url)}`;
                    window.open(officeUrl, "_blank", "noopener,noreferrer");
                  } else {
                    alert(
                      "Preview works for PDF, images, and text files. For other types, please download and open in your desktop app.",
                    );
                  }
                }}
                style={{
                  marginLeft: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#1a6bbf",
                  background: "#eef4ff",
                  border: "1px solid #c5d9f5",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Open
              </button>
              <button
                type="button"
                onClick={(e) => {
                  deleteResume(r.id);
                }}
                style={{
                  marginLeft: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#c0392b",
                  background: "#fff0ee",
                  border: "1px solid #f5c5c0",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}

        {resumes.length > 0 && (
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #e6edf5",
              background: "#f7fafd",
              fontSize: "11px",
              color: "#8ea1b8",
            }}
          >
            Showing {filtered.length} of {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
