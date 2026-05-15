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

// ── Folder SVG Icon ───────────────────────────────────────────────────────────
function FolderIcon({ color = "#b8841f", size = 56 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 14C4 11.8 5.8 10 8 10H22L28 16H48C50.2 16 52 17.8 52 20V44C52 46.2 50.2 48 48 48H8C5.8 48 4 46.2 4 44V14Z" fill={color} fillOpacity="0.22" />
      <path d="M4 20C4 17.8 5.8 16 8 16H48C50.2 16 52 17.8 52 20V44C52 46.2 50.2 48 48 48H8C5.8 48 4 46.2 4 44V20Z" fill={color} fillOpacity="0.88" />
      <path d="M4 14C4 11.8 5.8 10 8 10H22L27 16H4V14Z" fill={color} />
    </svg>
  );
}

// ── Gmail Modal ───────────────────────────────────────────────────────────────
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
      <div style={{ position: "relative", zIndex: 1001, background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, margin: "0 16px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#edfff5,#dcfce7)", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-cinzel)", color: "#1a7a4a", margin: "0 0 8px", fontSize: 18 }}>Email Sent!</h3>
            <p style={{ color: "#6a85a0", fontSize: 13, margin: "0 0 20px" }}>{selectedFiles.length} file(s) sent successfully</p>
            <button onClick={onClose} style={{ padding: "11px 28px", borderRadius: 10, background: "linear-gradient(135deg,#1a7a4a,#27ae60)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 13 }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontFamily: "var(--font-cinzel)", fontSize: 17, color: "#0f2742" }}>Send via Gmail</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#8a9bb0" }}>{selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} ready to send</p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid #e2eaf4", background: "#f8fafc", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#5a6f86" }}>✕</button>
            </div>

            {/* Files preview */}
            <div style={{ marginBottom: 16, background: "#f8fbff", borderRadius: 12, padding: "10px 12px", border: "1px solid #e3ebf4", maxHeight: 120, overflowY: "auto" }}>
              {selectedFiles.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #edf2f7" }}>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#1d4ed8", background: "#eaf1ff", borderRadius: 5, padding: "2px 7px", flexShrink: 0 }}>{getFileIcon(f.fileName)}</span>
                  <span style={{ fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
                  <span style={{ fontSize: 11, color: "#8a9bb0", flexShrink: 0 }}>{f.crewName}</span>
                </div>
              ))}
            </div>

            {/* Recipients */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Recipients <span style={{ fontSize: 10, color: "#1a6bbf", textTransform: "none", fontFamily: "var(--font-dm)", letterSpacing: 0, fontWeight: 400 }}>(Enter or comma to add)</span>
              </label>
              {recipients.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {recipients.map((email) => (
                    <span key={email} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eaf1ff", border: "1px solid #cfe0ff", borderRadius: 999, padding: "4px 12px", fontSize: 12, color: "#1d4ed8" }}>
                      {email}
                      <button onClick={() => setRecipients((p) => p.filter((r) => r !== email))} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9bb0", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <input type="email" value={recipientInput} onChange={(e) => { setRecipientInput(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipient(); } }} onBlur={addRecipient} placeholder="email@example.com" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, boxSizing: "border-box", outline: "none", background: "#f8fbff" }} />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Message (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a message..." rows={3} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, boxSizing: "border-box", resize: "vertical", outline: "none", background: "#f8fbff" }} />
            </div>

            {error && <p style={{ margin: "0 0 14px", fontSize: 12, color: "#c0392b", background: "#fff5f5", padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca" }}>{error}</p>}

            <button onClick={handleSend} disabled={sending} style={{ width: "100%", padding: "13px", borderRadius: 12, background: sending ? "#e8eef5" : "linear-gradient(135deg,#EA4335,#ff6b5b)", color: sending ? "#9aa8b6" : "#fff", border: "none", cursor: sending ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 13, letterSpacing: "0.02em" }}>
              {sending ? "Sending..." : `Send · ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Folder Side Panel ─────────────────────────────────────────────────────────
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
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,25,45,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(820px, 96vw)", background: "#f8fafc", boxShadow: "-12px 0 60px rgba(10,25,45,0.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Panel header */}
        <div style={{ background: "linear-gradient(135deg,#0f2742 0%,#1a3a5c 100%)", padding: "20px 28px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FolderIcon color="#e8b84b" size={34} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Crew Folder</p>
            <h2 style={{ margin: "3px 0 0", fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#fff", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {folder.crewName}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ background: "rgba(232,184,75,0.15)", border: "1px solid rgba(232,184,75,0.3)", borderRadius: 999, padding: "5px 14px", fontSize: 12, color: "#e8b84b", fontWeight: 700 }}>
              {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
            </span>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "14px 28px", borderBottom: "1px solid #e2eaf4", background: "#fff", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 9, border: "1px solid #d0dce8", background: "#f8fbff", cursor: "pointer", fontSize: 12, color: "#4a5568", fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#1a6bbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Choose Files
            <input
              id={`folder-file-${folder.crewKey}`}
              type="file" multiple accept={ACCEPTED_UPLOAD_TYPES}
              onChange={(e) => setFolderSelectedFiles((prev) => ({ ...prev, [folder.crewKey]: Array.from(e.target.files ?? []) }))}
              style={{ display: "none" }}
            />
          </label>

          {(folderSelectedFiles[folder.crewKey]?.length ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#1a6bbf", fontWeight: 700, background: "#eef4ff", border: "1px solid #bfdbfe", borderRadius: 999, padding: "4px 10px" }}>
              {folderSelectedFiles[folder.crewKey].length} file{folderSelectedFiles[folder.crewKey].length > 1 ? "s" : ""} ready
            </span>
          )}

          <button type="button" onClick={() => handleFolderUpload(folder.crewName, folder.crewKey)} disabled={folderUploading[folder.crewKey]}
            style={{ padding: "9px 16px", borderRadius: 9, background: folderUploading[folder.crewKey] ? "#e8eef5" : "linear-gradient(135deg,#b8841f,#e8b84b)", color: folderUploading[folder.crewKey] ? "#9aa8b6" : "#fff", border: "none", cursor: folderUploading[folder.crewKey] ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11, letterSpacing: "0.03em" }}>
            {folderUploading[folder.crewKey] ? "Uploading..." : "Upload to Folder"}
          </button>

          {someChecked && (
            <>
              <button onClick={() => setShowGmail(true)} style={{ padding: "9px 14px", borderRadius: 9, background: "linear-gradient(135deg,#EA4335,#ff6b5b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#fff" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="#fff" strokeWidth="2"/></svg>
                Gmail
              </button>
              <button onClick={() => setCheckedIds(new Set())} style={{ padding: "9px 12px", borderRadius: 9, background: "#f5f8fc", color: "#5a6f86", border: "1px solid #d0dce8", cursor: "pointer", fontSize: 11 }}>
                Clear
              </button>
            </>
          )}

          <button type="button" onClick={() => toggleFolderCheck(folder.files)}
            style={{ padding: "9px 14px", borderRadius: 9, background: allChecked ? "#edfff5" : "#f5f8fc", color: allChecked ? "#1a7a4a" : "#5a6f86", border: `1px solid ${allChecked ? "rgba(26,122,74,0.25)" : "#d0dce8"}`, cursor: "pointer", fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>
            {allChecked ? "✓ All Selected" : "Select All"}
          </button>
        </div>

        {/* Files list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {folder.files.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 20px", color: "#7a8fa5", border: "2px dashed #d4e0ec", borderRadius: 16, background: "#fff" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>📄</div>
              <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 15, color: "#17324d", fontWeight: 700 }}>No files yet</p>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>Upload files using the toolbar above.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {folder.files.map((file, index) => {
                const { color, bg } = getFileIconColor(file.fileName);
                const isChecked = checkedIds.has(file.id);
                return (
                  <div key={file.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, border: `1px solid ${isChecked ? "#bfdbfe" : "#e8eef5"}`, background: isChecked ? "#f0f7ff" : "#fff", boxShadow: "0 1px 4px rgba(15,39,66,0.04)", transition: "border-color 0.15s" }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(file.id)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1a6bbf", flexShrink: 0 }} />
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontFamily: "var(--font-cinzel)", fontWeight: 700, color }}>{getFileIcon(file.fileName)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#102a43", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8a9ab5" }}>{file.fileSize} · {file.uploadedAt}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <a href={getOpenFileUrl(file)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1d4ed8", textDecoration: "none", padding: "6px 11px", borderRadius: 7, background: "#eaf1ff", border: "1px solid #cfe0ff", fontWeight: 700 }}>Open</a>
                      <button type="button" onClick={() => { setCheckedIds(new Set([file.id])); setShowGmail(true); }} style={{ fontSize: 11, color: "#EA4335", padding: "6px 11px", borderRadius: 7, background: "#fff1f0", border: "1px solid #ffc5c2", fontWeight: 700, cursor: "pointer" }}>Gmail</button>
                      <button type="button" onClick={() => handleDelete(file)} disabled={deletingIds[file.id]} style={{ fontSize: 11, color: deletingIds[file.id] ? "#9ca7b5" : "#c0392b", padding: "6px 11px", borderRadius: 7, background: deletingIds[file.id] ? "#f0f4f8" : "#fff5f5", border: `1px solid ${deletingIds[file.id] ? "#e2eaf4" : "rgba(192,57,43,0.2)"}`, fontWeight: 700, cursor: deletingIds[file.id] ? "not-allowed" : "pointer" }}>
                        {deletingIds[file.id] ? "···" : "Delete"}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e8eef5", borderTop: "3px solid #b8841f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, color: "#6a85a0", fontSize: 14 }}>Loading documents...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div style={{ fontFamily: "var(--font-dm)", background: "linear-gradient(160deg,#f4f8fd 0%,#f8fafc 60%,#eef4ff 100%)", minHeight: "100vh", padding: "28px 32px" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .folder-card { transition: transform 0.18s ease, box-shadow 0.18s ease; animation: fadeUp 0.4s ease both; }
        .folder-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 40px rgba(15,39,66,0.14) !important; }
        .folder-card:active { transform: translateY(-2px) !important; }
        .upload-card { animation: fadeUp 0.4s ease 0.1s both; }
        .search-bar { animation: fadeUp 0.4s ease 0.15s both; }
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

      <div style={{ maxWidth: 1160, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a8fa5", fontWeight: 700 }}>Coordinator Workspace</p>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 28, color: "#0f2742" }}>Crew Documents</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#5a6f86" }}>Click any folder to view and manage its files.</p>
        </div>

        {loadError && (
          <div style={{ marginBottom: 18, padding: "13px 16px", borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span> {loadError}
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24, animation: "fadeUp 0.4s ease 0.05s both" }}>
          {[
            {
              label: "Total Folders", value: new Set(records.map((r) => r.crewKey)).size,
              accent: "#1a6bbf", bg: "linear-gradient(135deg,#eef4ff,#dbeafe)", border: "#bfdbfe",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="#1a6bbf" strokeWidth="1.8" fill="#1a6bbf" fillOpacity="0.12"/></svg>
            },
            {
              label: "Total Files", value: records.length,
              accent: "#1a7a4a", bg: "linear-gradient(135deg,#edfff5,#dcfce7)", border: "#bbf7d0",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="10" height="14" rx="2" fill="#1a7a4a" fillOpacity="0.15"/><rect x="8" y="6" width="10" height="14" rx="2" fill="#1a7a4a" fillOpacity="0.5" stroke="#1a7a4a" strokeWidth="1.5"/></svg>
            },
            {
              label: "Showing", value: folders.length,
              accent: "#b45309", bg: "linear-gradient(135deg,#fdfbea,#fef9c3)", border: "#fde68a",
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#b45309" strokeWidth="1.8" fill="#b45309" fillOpacity="0.1"/><path d="M16.5 16.5L21 21" stroke="#b45309" strokeWidth="2" strokeLinecap="round"/></svg>
            },
          ].map((c) => (
            <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: "18px 22px", boxShadow: "0 4px 16px rgba(15,39,66,0.06)", display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -12, top: -12, width: 72, height: 72, borderRadius: "50%", background: c.accent, opacity: 0.06 }} />
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${c.border}` }}>
                {c.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: c.accent, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, opacity: 0.8 }}>{c.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 32, lineHeight: 1.1, color: c.accent, fontWeight: 700, fontFamily: "var(--font-cinzel)" }}>{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Global selection bar ── */}
        {checkedIds.size > 0 && (
          <div style={{ background: "linear-gradient(135deg,#0f2742,#1a3a5c)", borderRadius: 14, padding: "13px 20px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", boxShadow: "0 6px 20px rgba(15,39,66,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📎</div>
              <p style={{ margin: 0, color: "#fff", fontSize: 13, fontFamily: "var(--font-cinzel)", fontWeight: 700 }}>{checkedIds.size} file{checkedIds.size > 1 ? "s" : ""} selected</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowGmail(true)} style={{ padding: "8px 18px", borderRadius: 9, background: "linear-gradient(135deg,#EA4335,#ff6b5b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12 }}>✉️ Send via Gmail</button>
              <button onClick={() => setCheckedIds(new Set())} style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 12 }}>Clear</button>
            </div>
          </div>
        )}

        {/* ── Upload card ── */}
        <div className="upload-card" style={{ background: "#fff", borderRadius: 18, border: "1px solid #e8c97a40", padding: "22px 24px", marginBottom: 22, boxShadow: "0 4px 24px rgba(184,132,31,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#fdfbea,#fef9c3)", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#b8841f" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#102a43", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>New Folder Upload</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>Crew Name *</label>
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Enter full crew name"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, color: "#102a43", background: "#f8fbff", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#b8841f"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#d0dce8"}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
                Files * <span style={{ fontSize: 10, color: "#1a6bbf", textTransform: "none", fontFamily: "var(--font-dm)", letterSpacing: 0, fontWeight: 400 }}>(select multiple)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "1px solid #d0dce8", background: "#f8fbff", cursor: "pointer", fontSize: 13, color: selectedFiles.length ? "#102a43" : "#8a9bb0", boxSizing: "border-box" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#1a6bbf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {selectedFiles.length > 0 ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected` : "Choose files…"}
                <input id="crewDocumentFile" type="file" multiple accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: 16, border: "1px solid #dbeafe", borderRadius: 10, overflow: "hidden" }}>
              {selectedFiles.map((file, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: i % 2 === 0 ? "#f8fbff" : "#f0f6ff", borderBottom: i < selectedFiles.length - 1 ? "1px solid #e2eaf4" : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: getFileIconColor(file.name).bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: getFileIconColor(file.name).color }}>{getFileIcon(file.name)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#8a9bb0", whiteSpace: "nowrap" }}>{formatFileSize(file.size)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {uploadProgress && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#5a6f86", fontWeight: 500 }}>Uploading {uploadProgress.done} of {uploadProgress.total}…</span>
                <span style={{ fontSize: 12, color: "#b8841f", fontWeight: 700 }}>{Math.round((uploadProgress.done / uploadProgress.total) * 100)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "#e8eef5", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#b8841f,#e8b84b)", width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={uploading} style={{ padding: "11px 20px", borderRadius: 11, background: uploading ? "#e8eef5" : "linear-gradient(135deg,#b8841f,#e8b84b)", color: uploading ? "#9aa8b6" : "#fff", border: "none", cursor: uploading ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12, letterSpacing: "0.03em", boxShadow: uploading ? "none" : "0 4px 14px rgba(184,132,31,0.3)" }}>
            {uploading ? `Uploading ${uploadProgress?.done ?? 0}/${uploadProgress?.total ?? 0}…` : `Create Folder + Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ""}`}
          </button>
        </div>

        {/* ── Search ── */}
        <div className="search-bar" style={{ marginBottom: 20, position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8a9bb0" strokeWidth="2"/><path d="M16.5 16.5L21 21" stroke="#8a9bb0" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <input
            placeholder="Search folders by crew name…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: 12, border: "1px solid #d8e4f0", fontSize: 13, color: "#102a43", background: "#fff", outline: "none", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(15,39,66,0.05)", transition: "border-color 0.15s, box-shadow 0.15s" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#b8841f"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,132,31,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#d8e4f0"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,39,66,0.05)"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "#e8eef5", border: "none", borderRadius: 999, width: 22, height: 22, cursor: "pointer", fontSize: 11, color: "#5a6f86", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          )}
        </div>

        {/* ── Folder grid ── */}
        {folders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px", color: "#7a8fa5", border: "2px dashed #d4e0ec", borderRadius: 18, background: "#fff" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#f0f4f8,#e8eef5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <FolderIcon color="#b0c0d4" size={44} />
            </div>
            <p style={{ fontSize: 16, fontFamily: "var(--font-cinzel)", color: "#17324d", margin: "0 0 8px", fontWeight: 700 }}>
              {search ? "No folders match your search." : "No documents uploaded yet"}
            </p>
            <p style={{ fontSize: 13, margin: 0, color: "#8a9bb0" }}>
              {search ? "Try a different search term." : "Create a folder above to get started."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(156px, 1fr))", gap: 14 }}>
            {folders.map((folder, idx) => {
              const color = FOLDER_COLORS[idx % FOLDER_COLORS.length];
              const someChecked = folder.files.some((f) => checkedIds.has(f.id));
              return (
                <div
                  key={folder.crewKey}
                  className="folder-card"
                  onClick={() => setOpenFolderKey(folder.crewKey)}
                  style={{
                    animationDelay: `${0.05 + idx * 0.03}s`,
                    background: "#fff",
                    border: `1.5px solid ${someChecked ? "#93c5fd" : "#e8eef5"}`,
                    borderRadius: 16,
                    padding: "22px 14px 18px",
                    boxShadow: someChecked
                      ? "0 0 0 3px rgba(147,197,253,0.3), 0 4px 16px rgba(15,39,66,0.08)"
                      : "0 2px 10px rgba(15,39,66,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    position: "relative",
                    userSelect: "none",
                  }}
                >
                  {/* Selection indicator */}
                  {someChecked && (
                    <div style={{ position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: 999, background: "#1a6bbf", boxShadow: "0 0 0 2px #fff, 0 0 0 3.5px #93c5fd" }} />
                  )}

                  {/* Folder count badge */}
                  <div style={{ position: "absolute", top: 10, left: 10, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 999, padding: "2px 8px", fontSize: 10, color, fontWeight: 700, fontFamily: "var(--font-cinzel)" }}>
                    {folder.files.length}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <FolderIcon color={color} size={64} />
                  </div>

                  <div style={{ textAlign: "center", width: "100%" }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#0f2742", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
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