"use client";

import { useEffect, useMemo, useState } from "react";

type EmploymentRecord = {
  id: string;
  crewName: string;
  vesselName: string;
  rank?: string;
  principal?: string;
  contractStart?: string | null;
  contractEnd?: string | null;
  certNumber?: string;
  issuedDate?: string | null;
  issuedBy?: string;
  remarks?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  publicId?: string;
  createdAt?: string;
};

const STORAGE_KEY_UI = "poseidon.coordinator.employment.ui";
const ACCEPTED_UPLOAD_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp";

function toCrewKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unnamed-crew";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileName: string): string {
  if (/\.pdf$/i.test(fileName)) return "PDF";
  if (/\.(doc|docx)$/i.test(fileName)) return "DOC";
  if (/\.(xls|xlsx)$/i.test(fileName)) return "XLS";
  if (/\.(ppt|pptx)$/i.test(fileName)) return "PPT";
  if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) return "IMG";
  return "FILE";
}

function getOpenFileUrl(file: EmploymentRecord): string {
  const isPdf = /\.pdf$/i.test(file.fileName);
  const isOffice = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.fileName);
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.fileName);
  if (isImage) return file.fileUrl;
  if (isPdf) return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
  if (isOffice) return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
  return file.fileUrl;
}

function mapApiRecord(r: any): EmploymentRecord {
  return {
    id: String(r.id),
    crewName: String(r.crew_name ?? r.crewName ?? ""),
    vesselName: String(r.vessel_name ?? r.vesselName ?? ""),
    rank: r.rank ?? r.position ?? undefined,
    principal: r.principal ?? undefined,
    contractStart: r.contract_start ?? r.contractStart ?? null,
    contractEnd: r.contract_end ?? r.contractEnd ?? null,
    certNumber: r.cert_number ?? r.certNumber ?? undefined,
    issuedDate: r.issued_date ?? r.issuedDate ?? null,
    issuedBy: r.issued_by ?? r.issuedBy ?? undefined,
    remarks: r.remarks ?? undefined,
    fileName: String(r.file_name ?? r.fileName ?? ""),
    fileUrl: String(r.file_url ?? r.fileUrl ?? ""),
    fileSize: String(r.file_size ?? r.fileSize ?? ""),
    publicId: typeof (r.public_id ?? r.publicId) === "string" ? String(r.public_id ?? r.publicId) : undefined,
    createdAt: String(r.created_at ?? r.createdAt ?? ""),
  };
}

function errorToMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function GmailModal({
  selectedFiles,
  onClose,
}: {
  selectedFiles: EmploymentRecord[];
  onClose: () => void;
}) {
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function addRecipient() {
    const email = recipientInput.trim().replace(/,$/, "");
    if (!email) return;
    if (!isValidEmail(email)) return setError("Invalid email address.");
    if (recipients.includes(email)) return setError("Already added.");
    setRecipients((prev) => [...prev, email]);
    setRecipientInput("");
    setError("");
  }

  async function handleSend() {
    const allRecipients = recipientInput.trim() && isValidEmail(recipientInput.trim())
      ? [...recipients, recipientInput.trim()]
      : recipients;

    if (allRecipients.length === 0) return setError("Please add at least one recipient.");

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: allRecipients,
          message,
          files: selectedFiles.map((f) => ({
            fileName: f.fileName,
            fileUrl: f.fileUrl,
            crewName: f.crewName,
            fileSize: f.fileSize || "",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send email.");
      onClose();
      alert("Email sent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1001, background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 16, color: "#102a43" }}>Send via Gmail</h3>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid #9fb6cf", background: "#fff", color: "#102a43", cursor: "pointer", fontSize: 18, fontWeight: 800 }}>
            x
          </button>
        </div>

        <div style={{ marginBottom: 12, background: "#f5f8fc", borderRadius: 10, padding: 10, border: "1px solid #e3ebf4", maxHeight: 130, overflowY: "auto" }}>
          {selectedFiles.map((f) => (
            <div key={f.id} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #edf2f7" }}>
              <span style={{ fontSize: 10, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#1d4ed8", background: "#eaf1ff", borderRadius: 4, padding: "2px 6px" }}>
                {getFileIcon(f.fileName)}
              </span>
              <span style={{ fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
            </div>
          ))}
        </div>

        <input
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          onBlur={addRecipient}
          placeholder="email@example.com"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", marginBottom: 10 }}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (optional)"
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", marginBottom: 10 }}
        />

        {error && <p style={{ margin: "0 0 10px", color: "#c0392b", fontSize: 12 }}>{error}</p>}

        <button
          onClick={handleSend}
          disabled={sending}
          style={{ width: "100%", padding: "12px", borderRadius: 10, background: sending ? "#e0e8f0" : "linear-gradient(135deg, #EA4335, #ff6b5b)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
          {sending ? "Sending..." : `Send ${selectedFiles.length} File(s)`}
        </button>
      </div>
    </div>
  );
}

export default function EmploymentPage() {
  const [crewName, setCrewName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<EmploymentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [folderSelectedFiles, setFolderSelectedFiles] = useState<Record<string, File[]>>({});
  const [folderUploading, setFolderUploading] = useState<Record<string, boolean>>({});

  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showGmail, setShowGmail] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/employment", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setRecords((data?.records ?? []).map(mapApiRecord));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_UI);
      const parsed = raw ? (JSON.parse(raw) as { openFolders?: Record<string, boolean> }) : {};
      if (parsed.openFolders) setOpenFolders(parsed.openFolders);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_UI, JSON.stringify({ openFolders }));
  }, [openFolders]);

  async function uploadSingleFile(file: File, name: string): Promise<EmploymentRecord> {
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(typeof uploadData?.error === "string" ? uploadData.error : errorToMessage(uploadData));
    }

    const metaRes = await fetch("/api/employment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crewName: name.trim(),
        vesselName: name.trim(),
        rank: "",
        principal: "",
        contractStart: null,
        contractEnd: null,
        certNumber: "",
        issuedDate: null,
        issuedBy: "",
        remarks: "",
        fileName: file.name,
        fileUrl: uploadData.url,
        fileSize: formatFileSize(file.size),
        publicId: uploadData.publicId,
      }),
    });

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      throw new Error(typeof metaData?.error === "string" ? metaData.error : errorToMessage(metaData));
    }

    // TODO: update records list after successful upload
    return mapApiRecord(metaData.record);
  }

  // Minimal UI to keep this file compiling.
  // The full folder-based UI exists in the other branch/versions of this file.
  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>Employment Certificates</h1>
      <p style={{ color: "#6a85a0" }}>UI is temporarily simplified due to merge conflict.</p>

      <div style={{ marginTop: 16 }}>
        <input
          value={crewName}
          onChange={(e) => setCrewName(e.target.value)}
          placeholder="Crew name"
          style={{ width: 320, padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5" }}
        />
        <input
          type="file"
          multiple
          accept={ACCEPTED_UPLOAD_TYPES}
          onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
          style={{ display: "block", marginTop: 12 }}
        />
        <button
          onClick={async () => {
            if (!crewName.trim()) return alert("Please enter the crew name.");
            if (!selectedFiles.length) return alert("Please select at least one file.");
            setUploading(true);
            try {
              const uploaded: EmploymentRecord[] = [];
              for (const f of selectedFiles) {
                uploaded.push(await uploadSingleFile(f, crewName));
              }
              setRecords((prev) => [...uploaded, ...prev]);
              setCrewName("");
              setSelectedFiles([]);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setUploading(false);
            }
          }}
          disabled={uploading}
          style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, background: uploading ? "#e0e8f0" : "#b8841f", color: "#fff", border: "none", cursor: uploading ? "not-allowed" : "pointer" }}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d0dce8" }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <ul>
          {records
            .filter((r) => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return r.crewName.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q);
            })
            .map((r) => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#1a6bbf" }}>
                  {r.fileName}
                </a>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}


