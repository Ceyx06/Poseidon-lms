"use client";

import { useEffect, useMemo, useState } from "react";

interface CrewDocumentRecord {
  id: string;
  crewName: string;
  crewKey: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  publicId?: string;
}

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

function getFileIconColor(fileName: string): { color: string; bg: string } {
  if (/\.pdf$/i.test(fileName)) return { color: "#c0392b", bg: "#fdecea" };
  if (/\.(doc|docx)$/i.test(fileName)) return { color: "#1a6bbf", bg: "#eaf1ff" };
  if (/\.(xls|xlsx)$/i.test(fileName)) return { color: "#1a7a4a", bg: "#edfff5" };
  if (/\.(ppt|pptx)$/i.test(fileName)) return { color: "#c9972a", bg: "#fdfbea" };
  if (/\.(jpg|jpeg|png|webp)$/i.test(fileName)) return { color: "#7c3aed", bg: "#f5f3ff" };
  return { color: "#5a6f86", bg: "#f0f4f8" };
}

function getOpenFileUrl(file: CrewDocumentRecord): string {
  if (/\.(jpg|jpeg|png|webp)$/i.test(file.fileName)) return file.fileUrl;
  if (/\.pdf$/i.test(file.fileName)) return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.fileName)) return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
  return file.fileUrl;
}

function toMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    try { return JSON.stringify(err); } catch { return "Unknown error"; }
  }
  return "Unknown error";
}

// ── Folder SVG Icon ───────────────────────────────────────────────
function FolderIcon({ color = "#b8841f", size = 56 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14C4 11.8 5.8 10 8 10H22L28 16H48C50.2 16 52 17.8 52 20V44C52 46.2 50.2 48 48 48H8C5.8 48 4 46.2 4 44V14Z" fill={color} fillOpacity="0.22" />
      <path d="M4 20C4 17.8 5.8 16 8 16H48C50.2 16 52 17.8 52 20V44C52 46.2 50.2 48 48 48H8C5.8 48 4 46.2 4 44V20Z" fill={color} fillOpacity="0.88" />
      <path d="M4 14C4 11.8 5.8 10 8 10H22L27 16H4V14Z" fill={color} />
    </svg>
  );
}

// ── Gmail Modal ───────────────────────────────────────────────────
function GmailModal({ selectedFiles, onClose }: { selectedFiles: CrewDocumentRecord[]; onClose: () => void }) {
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

  function addRecipient() {
    const email = recipientInput.trim().replace(/,$/, "");
    if (!email) return;
    if (!isValidEmail(email)) { setError("Invalid email address."); return; }
    if (recipients.includes(email)) { setError("Already added."); return; }
    setRecipients((p) => [...p, email]);
    setRecipientInput("");
    setError("");
  }

  async function handleSend() {
    const lastEmail = recipientInput.trim().replace(/,$/, "");
    const all = lastEmail && isValidEmail(lastEmail) ? [...recipients, lastEmail] : recipients;
    if (all.length === 0) { setError("Please add at least one recipient."); return; }
    setError(""); setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: all, message, files: selectedFiles.map((f) => ({ fileName: f.fileName, fileUrl: f.fileUrl, crewName: f.crewName, fileSize: f.fileSize })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(toMessage(data));
      setSent(true);
    } catch (err) { setError(toMessage(err)); }
    finally { setSending(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1001, background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-cinzel)", color: "#1a7a4a", margin: "0 0 8px" }}>Email Sent!</h3>
            <p style={{ color: "#6a85a0", fontSize: 13 }}>{selectedFiles.length} file(s) sent to {recipients.length} recipient(s)</p>
            <button onClick={onClose} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#1a7a4a,#27ae60)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 16, color: "#102a43" }}>Send via Gmail</h3>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid #d0dce8", background: "#f8fafc", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
            <div style={{ marginBottom: 14, background: "#f5f8fc", borderRadius: 10, padding: 10, border: "1px solid #e3ebf4", maxHeight: 130, overflowY: "auto" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontFamily: "var(--font-cinzel)", textTransform: "uppercase", color: "#6a85a0", fontWeight: 700 }}>{selectedFiles.length} file(s) to send</p>
              {selectedFiles.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #edf2f7" }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#1d4ed8", background: "#eaf1ff", borderRadius: 4, padding: "2px 6px" }}>{getFileIcon(f.fileName)}</span>
                  <span style={{ fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
                  <span style={{ fontSize: 11, color: "#6a85a0" }}>{f.crewName}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Recipients * <span style={{ fontSize: 10, color: "#1a6bbf", textTransform: "none", fontFamily: "var(--font-dm)", letterSpacing: 0 }}>(Enter or comma to add)</span>
              </label>
              {recipients.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {recipients.map((email) => (
                    <span key={email} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eaf1ff", border: "1px solid #cfe0ff", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#1d4ed8" }}>
                      {email}
                      <button onClick={() => setRecipients((p) => p.filter((r) => r !== email))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6a85a0", fontSize: 13, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <input type="email" value={recipientInput} onChange={(e) => { setRecipientInput(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipient(); } }} onBlur={addRecipient} placeholder="email@example.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Message (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a message..." rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, boxSizing: "border-box", resize: "vertical", outline: "none" }} />
            </div>
            {error && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#c0392b" }}>{error}</p>}
            <button onClick={handleSend} disabled={sending} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: sending ? "#e0e8f0" : "linear-gradient(135deg,#EA4335,#ff6b5b)", color: sending ? "#9aa8b6" : "#fff", border: "none", cursor: sending ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 13 }}>
              {sending ? "Sending..." : `Send to ${recipients.length || 1} Recipient${recipients.length > 1 ? "s" : ""} · ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Folder Side Panel ─────────────────────────────────────────────
function FolderPanel({
  folder, onClose, checkedIds, toggleCheck, toggleFolderCheck,
  deletingIds, handleDelete, setCheckedIds, setShowGmail,
  folderSelectedFiles, setFolderSelectedFiles, folderUploading, handleFolderUpload,
}: {
  folder: { crewName: string; crewKey: string; files: CrewDocumentRecord[] };
  onClose: () => void;
  checkedIds: Set<string>;
  toggleCheck: (id: string) => void;
  toggleFolderCheck: (files: CrewDocumentRecord[]) => void;
  deletingIds: Record<string, boolean>;
  handleDelete: (r: CrewDocumentRecord) => void;
  setCheckedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setShowGmail: (v: boolean) => void;
  folderSelectedFiles: Record<string, File[]>;
  setFolderSelectedFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
  folderUploading: Record<string, boolean>;
  handleFolderUpload: (name: string, key: string) => void;
}) {
  const allChecked = folder.files.length > 0 && folder.files.every((f) => checkedIds.has(f.id));
  const someChecked = folder.files.some((f) => checkedIds.has(f.id));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,25,45,0.52)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(800px, 96vw)", background: "#fff", boxShadow: "-10px 0 50px rgba(10,25,45,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Panel header */}
        <div style={{ background: "linear-gradient(135deg,#0f2742,#1a3a5c)", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <FolderIcon color="#e8b84b" size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Crew Folder</p>
            <h2 style={{ margin: "2px 0 0", fontFamily: "var(--font-cinzel)", fontSize: 19, color: "#fff", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {folder.crewName}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ background: "rgba(232,184,75,0.18)", border: "1px solid rgba(232,184,75,0.32)", borderRadius: 999, padding: "4px 12px", fontSize: 12, color: "#e8b84b", fontWeight: 700 }}>
              {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
            </span>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #e8eef5", background: "#f8fbff", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <input
            id={`folder-file-${folder.crewKey}`}
            type="file" multiple accept={ACCEPTED_UPLOAD_TYPES}
            onChange={(e) => setFolderSelectedFiles((prev) => ({ ...prev, [folder.crewKey]: Array.from(e.target.files ?? []) }))}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #c8d6e5", fontSize: 12, color: "#102a43", background: "#fff", cursor: "pointer" }}
          />
          {(folderSelectedFiles[folder.crewKey]?.length ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#1a6bbf", fontWeight: 700 }}>{folderSelectedFiles[folder.crewKey].length} ready</span>
          )}
          <button type="button" onClick={() => handleFolderUpload(folder.crewName, folder.crewKey)} disabled={folderUploading[folder.crewKey]}
            style={{ padding: "9px 14px", borderRadius: 8, background: folderUploading[folder.crewKey] ? "#e0e8f0" : "linear-gradient(135deg,#b8841f,#e8b84b)", color: folderUploading[folder.crewKey] ? "#a0b0c0" : "#fff", border: "none", cursor: folderUploading[folder.crewKey] ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11 }}>
            {folderUploading[folder.crewKey] ? "Uploading..." : "Upload to Folder"}
          </button>

          {someChecked && (
            <>
              <button onClick={() => setShowGmail(true)} style={{ padding: "9px 14px", borderRadius: 8, background: "linear-gradient(135deg,#EA4335,#ff6b5b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11 }}>
                ✉️ Gmail
              </button>
              <button onClick={() => setCheckedIds(new Set())} style={{ padding: "9px 10px", borderRadius: 8, background: "#fff", color: "#5a6f86", border: "1px solid #d0dce8", cursor: "pointer", fontSize: 11 }}>
                Clear
              </button>
            </>
          )}

          <button type="button" onClick={() => toggleFolderCheck(folder.files)}
            style={{ padding: "9px 12px", borderRadius: 8, background: allChecked ? "#edfff5" : "#f5f8fc", color: allChecked ? "#1a7a4a" : "#5a6f86", border: `1px solid ${allChecked ? "rgba(26,122,74,0.3)" : "#d0dce8"}`, cursor: "pointer", fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>
            {allChecked ? "✓ All Selected" : "Select All"}
          </button>
        </div>

        {/* Files */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {folder.files.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8fa5", border: "1px dashed #d4e0ec", borderRadius: 12, background: "#f9fcff" }}>
              <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>📄</div>
              <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#17324d" }}>No files yet</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>Upload files using the toolbar above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {folder.files.map((file, index) => {
                const { color, bg } = getFileIconColor(file.fileName);
                const isChecked = checkedIds.has(file.id);
                return (
                  <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${isChecked ? "#bfdbfe" : "#e8eef5"}`, background: isChecked ? "#f0f7ff" : index % 2 === 0 ? "#fff" : "#fbfdff" }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(file.id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1a6bbf", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontFamily: "var(--font-cinzel)", fontWeight: 700, color, background: bg, borderRadius: 6, padding: "3px 8px", flexShrink: 0 }}>
                      {getFileIcon(file.fileName)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#102a43", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#7a8fa5" }}>{file.fileSize} · {file.uploadedAt}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <a href={getOpenFileUrl(file)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1d4ed8", textDecoration: "none", padding: "5px 10px", borderRadius: 6, background: "#eaf1ff", border: "1px solid #cfe0ff", fontWeight: 700 }}>Open</a>
                      <button type="button" onClick={() => { setCheckedIds(new Set([file.id])); setShowGmail(true); }} style={{ fontSize: 11, color: "#EA4335", padding: "5px 10px", borderRadius: 6, background: "#fff1f0", border: "1px solid #ffc5c2", fontWeight: 700, cursor: "pointer" }}>Gmail</button>
                      <button type="button" onClick={() => handleDelete(file)} disabled={deletingIds[file.id]} style={{ fontSize: 11, color: deletingIds[file.id] ? "#9ca7b5" : "#c0392b", padding: "5px 10px", borderRadius: 6, background: deletingIds[file.id] ? "#f0f4f8" : "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", fontWeight: 700, cursor: deletingIds[file.id] ? "not-allowed" : "pointer" }}>
                        {deletingIds[file.id] ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function CrewDocumentsPage() {
  const [crewName, setCrewName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<CrewDocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [openFolderKey, setOpenFolderKey] = useState<string | null>(null);
  const [folderSelectedFiles, setFolderSelectedFiles] = useState<Record<string, File[]>>({});
  const [folderUploading, setFolderUploading] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showGmail, setShowGmail] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    async function load() {
      try {
        setLoadError("");
        const res = await fetch("/api/coordinator-files", { cache: "no-store", signal: controller.signal });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(toMessage(data) || `Request failed (${res.status})`);
        if (!mounted) return;
        if (Array.isArray(data)) setRecords(data);
      } catch (err) {
        if (!mounted) return;
        setRecords([]);
        setLoadError(err instanceof Error && err.name === "AbortError" ? "Loading took too long." : toMessage(err));
      } finally {
        if (!mounted) return;
        clearTimeout(timeout);
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; controller.abort(); clearTimeout(timeout); };
  }, []);

  async function uploadSingleFile(file: File, name: string): Promise<CrewDocumentRecord> {
    const cleanName = name.trim();
    const crewKey = toCrewKey(cleanName);
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(toMessage(uploadData));
    const metaRes = await fetch("/api/coordinator-files", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crewName: cleanName, crewKey, fileName: file.name, fileUrl: uploadData.url, fileSize: formatFileSize(file.size), publicId: uploadData.publicId }),
    });
    const metaData = await metaRes.json();
    if (!metaRes.ok) throw new Error(toMessage(metaData));
    return metaData as CrewDocumentRecord;
  }

  async function handleUpload() {
    const cleanName = crewName.trim();
    if (!cleanName) { alert("Please enter the crew name."); return; }
    if (selectedFiles.length === 0) { alert("Please select at least one file."); return; }
    setUploading(true);
    setUploadProgress({ done: 0, total: selectedFiles.length });
    const newRecords: CrewDocumentRecord[] = [];
    const errors: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        const saved = await uploadSingleFile(selectedFiles[i], cleanName);
        newRecords.push(saved);
        setUploadProgress({ done: i + 1, total: selectedFiles.length });
      } catch (err) { errors.push(`${selectedFiles[i].name}: ${toMessage(err)}`); }
    }
    setRecords((prev) => [...newRecords, ...prev]);
    setCrewName(""); setSelectedFiles([]); setUploadProgress(null);
    const input = document.getElementById("crewDocumentFile") as HTMLInputElement | null;
    if (input) input.value = "";
    if (errors.length > 0) alert(`Some files failed:\n${errors.join("\n")}`);
    setUploading(false);
  }

  async function handleFolderUpload(folderName: string, folderKey: string) {
    const files = folderSelectedFiles[folderKey] ?? [];
    if (files.length === 0) { alert("Please select at least one file."); return; }
    setFolderUploading((prev) => ({ ...prev, [folderKey]: true }));
    const newRecords: CrewDocumentRecord[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try { newRecords.push(await uploadSingleFile(file, folderName)); }
      catch (err) { errors.push(`${file.name}: ${toMessage(err)}`); }
    }
    setRecords((prev) => [...newRecords, ...prev]);
    setFolderSelectedFiles((prev) => ({ ...prev, [folderKey]: [] }));
    const input = document.getElementById(`folder-file-${folderKey}`) as HTMLInputElement | null;
    if (input) input.value = "";
    if (errors.length > 0) alert(`Some files failed:\n${errors.join("\n")}`);
    setFolderUploading((prev) => ({ ...prev, [folderKey]: false }));
  }

  async function handleDelete(record: CrewDocumentRecord) {
    if (!confirm(`Delete "${record.fileName}"?`)) return;
    setDeletingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const res = await fetch("/api/coordinator-files", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, publicId: record.publicId }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(toMessage(data)); }
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setCheckedIds((prev) => { const n = new Set(prev); n.delete(record.id); return n; });
    } catch (err) { alert(toMessage(err)); }
    finally { setDeletingIds((prev) => ({ ...prev, [record.id]: false })); }
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleFolderCheck(files: CrewDocumentRecord[]) {
    const allChecked = files.every((f) => checkedIds.has(f.id));
    setCheckedIds((prev) => {
      const n = new Set(prev);
      if (allChecked) files.forEach((f) => n.delete(f.id));
      else files.forEach((f) => n.add(f.id));
      return n;
    });
  }

  const selectedDocuments = useMemo(() => records.filter((r) => checkedIds.has(r.id)), [records, checkedIds]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.crewName.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q));
  }, [records, search]);

  const folders = useMemo(() => {
    const map = new Map<string, { crewName: string; crewKey: string; files: CrewDocumentRecord[] }>();
    for (const rec of filteredRecords) {
      const ex = map.get(rec.crewKey);
      if (ex) ex.files.push(rec);
      else map.set(rec.crewKey, { crewName: rec.crewName, crewKey: rec.crewKey, files: [rec] });
    }
    return Array.from(map.values()).sort((a, b) => a.crewName.localeCompare(b.crewName));
  }, [filteredRecords]);

  const openFolder = useMemo(() => folders.find((f) => f.crewKey === openFolderKey) ?? null, [folders, openFolderKey]);

  const FOLDER_COLORS = ["#b8841f", "#1a6bbf", "#1a7a4a", "#7c3aed", "#c0392b", "#0e7490", "#be185d", "#0369a1"];

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 10 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e8eef5", borderTop: "3px solid #b8841f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, color: "#6a85a0", fontSize: 14 }}>Loading documents...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div style={{ fontFamily: "var(--font-dm)", background: "linear-gradient(180deg,#f6f9fc 0%,#fff 55%,#f8fafc 100%)", minHeight: "100vh", padding: 22 }}>
      <style>{`
        .folder-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .folder-card:hover { transform: translateY(-5px) !important; box-shadow: 0 16px 36px rgba(15,39,66,0.16) !important; }
        .folder-card:active { transform: translateY(-2px) !important; }
      `}</style>

      {showGmail && selectedDocuments.length > 0 && (
        <GmailModal selectedFiles={selectedDocuments} onClose={() => setShowGmail(false)} />
      )}

      {openFolder && (
        <FolderPanel
          folder={openFolder} onClose={() => setOpenFolderKey(null)}
          checkedIds={checkedIds} toggleCheck={toggleCheck} toggleFolderCheck={toggleFolderCheck}
          deletingIds={deletingIds} handleDelete={handleDelete}
          setCheckedIds={setCheckedIds} setShowGmail={setShowGmail}
          folderSelectedFiles={folderSelectedFiles} setFolderSelectedFiles={setFolderSelectedFiles}
          folderUploading={folderUploading} handleFolderUpload={handleFolderUpload}
        />
      )}

      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7c93", fontWeight: 700 }}>Coordinator Workspace</p>
          <h1 style={{ margin: "6px 0 4px", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 28, color: "#0f2742" }}>Crew Documents</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#5a6f86" }}>Click any folder to view and manage its files.</p>
        </div>

        {loadError && (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 13 }}>
            Documents could not be loaded: {loadError}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Total Folders", value: new Set(records.map((r) => r.crewKey)).size, accent: "#1a6bbf", bg: "#eef4ff" },
            { label: "Total Files", value: records.length, accent: "#1a7a4a", bg: "#edfff5" },
            { label: "Filtered", value: folders.length, accent: "#c9972a", bg: "#fdfbea" },
          ].map((c) => (
            <div key={c.label} style={{ border: "1px solid #e8eef5", background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 6px 16px rgba(26,45,69,0.06)" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#6a7f95", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{c.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.1, color: c.accent, fontWeight: 700, fontFamily: "var(--font-cinzel)", background: c.bg, borderRadius: 8, display: "inline-block", padding: "4px 10px" }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Global selection bar */}
        {checkedIds.size > 0 && (
          <div style={{ background: "linear-gradient(135deg,#1a2d45,#0f2742)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", boxShadow: "0 4px 16px rgba(15,39,66,0.2)" }}>
            <p style={{ margin: 0, color: "#fff", fontSize: 13, fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>📎 {checkedIds.size} file{checkedIds.size > 1 ? "s" : ""} selected</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowGmail(true)} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg,#EA4335,#ff6b5b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12 }}>✉️ Send via Gmail</button>
              <button onClick={() => setCheckedIds(new Set())} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 12 }}>Clear</button>
            </div>
          </div>
        )}

        {/* New Folder Upload */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(201,151,42,0.25)", padding: 20, marginBottom: 20, boxShadow: "0 8px 18px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#102a43", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>New Folder Upload</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Crew Name *</label>
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Enter full crew name" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Document Files * <span style={{ fontSize: 10, color: "#1a6bbf", fontFamily: "var(--font-dm)", textTransform: "none", letterSpacing: 0 }}>(select multiple)</span>
              </label>
              <input id="crewDocumentFile" type="file" multiple accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", boxSizing: "border-box", cursor: "pointer" }} />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: 12, border: "1px solid #d4e3fb", borderRadius: 10, overflow: "hidden" }}>
              {selectedFiles.map((file, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: i % 2 === 0 ? "#f2f7ff" : "#eef4ff", borderBottom: i < selectedFiles.length - 1 ? "1px solid #dce8fb" : "none" }}>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#1d4ed8", background: "#dbeafe", borderRadius: 4, padding: "2px 6px" }}>{getFileIcon(file.name)}</span>
                  <p style={{ margin: 0, fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#5a6f86", whiteSpace: "nowrap" }}>{formatFileSize(file.size)}</p>
                </div>
              ))}
            </div>
          )}

          {uploadProgress && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#5a6f86" }}>Uploading {uploadProgress.done} of {uploadProgress.total}...</span>
                <span style={{ fontSize: 12, color: "#1a6bbf", fontWeight: 700 }}>{Math.round((uploadProgress.done / uploadProgress.total) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "#e8eef5", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#1a6bbf,#4d9de0)", width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading} style={{ padding: "10px 16px", borderRadius: 10, background: uploading ? "#e0e8f0" : "linear-gradient(135deg,#b8841f,#e8b84b)", color: uploading ? "#a0b0c0" : "#fff", border: "none", cursor: uploading ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12 }}>
            {uploading ? `Uploading ${uploadProgress?.done ?? 0}/${uploadProgress?.total ?? 0}...` : `Create Folder + Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ""}`}
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Search folders by crew name..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, color: "#102a43", background: "#fff", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(15,39,66,0.05)" }}
          />
        </div>

        {/* Folder grid */}
        {folders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "#7a8fa5", border: "1px dashed #d4e0ec", borderRadius: 14, background: "#f9fcff" }}>
            <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.35 }}>📁</div>
            <p style={{ fontSize: 15, fontFamily: "var(--font-cinzel)", color: "#17324d", margin: "0 0 6px" }}>No documents uploaded yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create a folder above to get started.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {folders.map((folder, idx) => {
              const color = FOLDER_COLORS[idx % FOLDER_COLORS.length];
              const someChecked = folder.files.some((f) => checkedIds.has(f.id));
              return (
                <div
                  key={folder.crewKey}
                  className="folder-card"
                  onClick={() => setOpenFolderKey(folder.crewKey)}
                  style={{
                    background: "#fff",
                    border: `1.5px solid ${someChecked ? "#93c5fd" : "#e2eaf4"}`,
                    borderRadius: 14,
                    padding: "20px 14px 16px",
                    boxShadow: someChecked
                      ? "0 0 0 3px rgba(147,197,253,0.35), 0 4px 14px rgba(15,39,66,0.08)"
                      : "0 4px 14px rgba(15,39,66,0.07)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    position: "relative",
                    userSelect: "none",
                  }}
                >
                  {someChecked && (
                    <div style={{ position: "absolute", top: 10, right: 10, width: 9, height: 9, borderRadius: 999, background: "#1a6bbf", boxShadow: "0 0 0 2px #fff" }} />
                  )}
                  <FolderIcon color={color} size={62} />
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#102a43", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {folder.crewName}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8a9ab5" }}>
                      {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}