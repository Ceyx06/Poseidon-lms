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

const STORAGE_KEY_UI = "poseidon.coordinator.crewDocuments.ui";
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

function getCloudinaryRawUrl(file: CrewDocumentRecord): string {
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(file.fileName)) {
    return file.fileUrl.replace("/image/upload/", "/raw/upload/");
  }
  return file.fileUrl;
}

function getOpenFileUrl(file: CrewDocumentRecord): string {
  const isPdf = /\.pdf$/i.test(file.fileName);
  const isOffice = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.fileName);
  const rawUrl = getCloudinaryRawUrl(file);

  if (isPdf) return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
  if (isOffice) return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(rawUrl)}`;
  return file.fileUrl;
}

function ShareModal({ file, onClose }: { file: CrewDocumentRecord; onClose: () => void }) {
  const [showEmail, setShowEmail] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    navigator.clipboard.writeText(getCloudinaryRawUrl(file));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleSendEmail() {
    const email = recipient.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailError("");
    setSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          fileName: file.fileName,
          fileUrl: getCloudinaryRawUrl(file),
          crewName: file.crewName,
          fileSize: file.fileSize,
          uploadedAt: file.uploadedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send email.");
      alert(`Email sent to ${email}`);
      onClose();
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1001, background: "#fff", borderRadius: 16, padding: 22, width: "100%", maxWidth: 420, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 16, color: "#102a43" }}>Share Document</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid #d0dce8", background: "#f8fafc", cursor: "pointer" }}>x</button>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#7a8fa5" }}>{file.fileName}</p>
        <div style={{ display: "grid", gap: 10 }}>
          <button onClick={() => setShowEmail((prev) => !prev)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ffc5c2", background: "#fff1f0", color: "#EA4335", cursor: "pointer", fontWeight: 700 }}>
            Send via Gmail
          </button>
          {showEmail && (
            <div style={{ border: "1px solid #e8eef5", borderRadius: 10, padding: 10, background: "#f8fbff" }}>
              <input
                type="email"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setEmailError("");
                }}
                placeholder="Recipient email"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #c8d6e5", fontSize: 13, boxSizing: "border-box" }}
              />
              {emailError && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#c0392b" }}>{emailError}</p>}
              <button onClick={handleSendEmail} disabled={sending} style={{ marginTop: 8, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: sending ? "#e0e8f0" : "linear-gradient(135deg, #EA4335, #ff6b5b)", color: sending ? "#9aa8b6" : "#fff", cursor: sending ? "not-allowed" : "pointer", fontWeight: 700 }}>
                {sending ? "Sending..." : "Send Email"}
              </button>
            </div>
          )}
          <button onClick={handleCopyLink} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${copied ? "#b2f0c5" : "#c2d9ff"}`, background: copied ? "#edfff5" : "#eef4ff", color: copied ? "#1a7a4a" : "#1a6bbf", cursor: "pointer", fontWeight: 700 }}>
            {copied ? "Link Copied" : "Copy Direct Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CrewDocumentsPage() {
  const [crewName, setCrewName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [records, setRecords] = useState<CrewDocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [folderSelectedFiles, setFolderSelectedFiles] = useState<Record<string, File | null>>({});
  const [folderUploading, setFolderUploading] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [shareFile, setShareFile] = useState<CrewDocumentRecord | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/coordinator-files");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRecords(data);
        }
      } catch {
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
    } catch {
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_UI, JSON.stringify({ openFolders }));
  }, [openFolders]);

  async function uploadFile(file: File): Promise<{ fileName: string; fileUrl: string; fileSize: string; publicId?: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data?.url) throw new Error(data?.error || `Upload failed (HTTP ${res.status}).`);
    return {
      fileName: file.name,
      fileUrl: data.url as string,
      fileSize: formatFileSize(file.size),
      publicId: typeof data.publicId === "string" ? data.publicId : undefined,
    };
  }

  async function saveRecord(name: string, upload: { fileName: string; fileUrl: string; fileSize: string; publicId?: string }) {
    const res = await fetch("/api/coordinator-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crewName: name, crewKey: toCrewKey(name), ...upload }),
    });

    if (!res.ok) {
      let message = "Failed to save record.";
      try {
        const data = await res.json();
        if (data?.error) message = String(data.error);
      } catch {
      }
      throw new Error(message);
    }

    const saved = (await res.json()) as CrewDocumentRecord;
    setRecords((prev) => [saved, ...prev]);
  }

  async function handleDelete(record: CrewDocumentRecord) {
    if (!window.confirm(`Delete "${record.fileName}" from ${record.crewName}?`)) return;
    setDeletingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      if (record.publicId) {
        await fetch("/api/upload/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: record.publicId }),
        });
      }
      await fetch(`/api/coordinator-files/${record.id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  }

  async function handleUpload() {
    const cleanName = crewName.trim();
    if (!cleanName) {
      alert("Please enter the crew name.");
      return;
    }
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadFile(selectedFile);
      await saveRecord(cleanName, uploaded);
      setCrewName("");
      setSelectedFile(null);
      const input = document.getElementById("crewDocumentFile") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFolderUpload(folderName: string, folderKey: string) {
    const file = folderSelectedFiles[folderKey];
    if (!file) {
      alert("Please select a file.");
      return;
    }
    setFolderUploading((prev) => ({ ...prev, [folderKey]: true }));
    try {
      const uploaded = await uploadFile(file);
      await saveRecord(folderName, uploaded);
      setFolderSelectedFiles((prev) => ({ ...prev, [folderKey]: null }));
      const input = document.getElementById(`folder-file-${folderKey}`) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setFolderUploading((prev) => ({ ...prev, [folderKey]: false }));
    }
  }

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => r.crewName.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q));
  }, [records, search]);

  const folders = useMemo(() => {
    const map = new Map<string, { crewName: string; crewKey: string; files: CrewDocumentRecord[] }>();
    for (const rec of filteredRecords) {
      const existing = map.get(rec.crewKey);
      if (existing) existing.files.push(rec);
      else map.set(rec.crewKey, { crewName: rec.crewName, crewKey: rec.crewKey, files: [rec] });
    }
    return Array.from(map.values()).sort((a, b) => a.crewName.localeCompare(b.crewName, undefined, { sensitivity: "base" }));
  }, [filteredRecords]);

  const totalFolders = useMemo(() => new Set(records.map((r) => r.crewKey)).size, [records]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 10 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e8eef5", borderTop: "3px solid #1a6bbf", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ margin: 0, color: "#6a85a0", fontSize: 14 }}>Loading documents...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-dm)", background: "linear-gradient(180deg, #f6f9fc 0%, #ffffff 55%, #f8fafc 100%)", minHeight: "100vh", padding: 22 }}>
      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}

      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7c93", fontWeight: 700 }}>Coordinator Workspace</p>
          <h1 style={{ margin: "6px 0 4px", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 28, color: "#0f2742" }}>Crew Documents</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#5a6f86" }}>Organize crew records by folder and upload files directly inside each folder.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Total Folders", value: totalFolders, accent: "#1a6bbf", bg: "#eef4ff" },
            { label: "Total Files", value: records.length, accent: "#1a7a4a", bg: "#edfff5" },
            { label: "Filtered", value: folders.length, accent: "#c9972a", bg: "#fdfbea" },
          ].map((card) => (
            <div key={card.label} style={{ border: "1px solid #e8eef5", background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 6px 16px rgba(26,45,69,0.06)" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#6a7f95", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{card.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 28, lineHeight: 1.1, color: card.accent, fontWeight: 700, fontFamily: "var(--font-cinzel)", background: card.bg, borderRadius: 8, display: "inline-block", padding: "4px 10px" }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(201,151,42,0.25)", padding: 20, marginBottom: 16, boxShadow: "0 8px 18px rgba(201,151,42,0.08)" }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#102a43", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>New Folder Upload</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Crew Name *</label>
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Enter full crew name" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Document File *</label>
              <input id="crewDocumentFile" type="file" accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", boxSizing: "border-box", cursor: "pointer" }} />
            </div>
          </div>
          {selectedFile && (
            <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 10, background: "#f2f7ff", border: "1px solid #d4e3fb", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#1d4ed8" }}>{getFileIcon(selectedFile.name)}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#102a43", fontWeight: 600 }}>{selectedFile.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#5a6f86" }}>{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
          )}
          <button onClick={handleUpload} disabled={uploading} style={{ padding: "10px 16px", borderRadius: 10, background: uploading ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)", color: uploading ? "#a0b0c0" : "#fff", border: "none", cursor: uploading ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12 }}>
            {uploading ? "Uploading..." : "Create Folder + Upload"}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d9e3ef", padding: 20, boxShadow: "0 8px 18px rgba(15,39,66,0.06)" }}>
          <div style={{ marginBottom: 14 }}>
            <input placeholder="Search by crew name or file name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, color: "#102a43", background: "#f8fbff", outline: "none", boxSizing: "border-box" }} />
          </div>

          {folders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8fa5", border: "1px dashed #d4e0ec", borderRadius: 12, background: "#f9fcff" }}>
              <p style={{ fontSize: 15, fontFamily: "var(--font-cinzel)", color: "#17324d", margin: "0 0 6px" }}>No documents uploaded yet</p>
              <p style={{ fontSize: 13, margin: 0 }}>Upload a file above to create your first crew folder.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {folders.map((folder) => {
                const isOpen = !!openFolders[folder.crewKey];
                return (
                  <div key={folder.crewKey} style={{ border: "1px solid #dbe5f0", borderRadius: 12, background: "#fcfdff" }}>
                    <button type="button" onClick={() => setOpenFolders((prev) => ({ ...prev, [folder.crewKey]: !prev[folder.crewKey] }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "transparent", border: "none", cursor: "pointer", padding: 14, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(26,107,191,0.12)", color: "#1a6bbf", fontSize: 12, fontWeight: 700, border: "1px solid rgba(26,107,191,0.22)" }}>
                          {isOpen ? "-" : "+"}
                        </span>
                        <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 15, color: "#102a43", fontWeight: 700 }}>{folder.crewName}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "#1a6bbf", fontWeight: 700, background: "#eaf1ff", borderRadius: 999, padding: "4px 10px" }}>{folder.files.length} file(s)</p>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 14px 14px" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          <input id={`folder-file-${folder.crewKey}`} type="file" accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setFolderSelectedFiles((prev) => ({ ...prev, [folder.crewKey]: e.target.files?.[0] ?? null }))} style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #c8d6e5", fontSize: 12, color: "#102a43", background: "#fff", cursor: "pointer" }} />
                          <button type="button" onClick={() => handleFolderUpload(folder.crewName, folder.crewKey)} disabled={folderUploading[folder.crewKey]} style={{ padding: "9px 12px", borderRadius: 8, background: folderUploading[folder.crewKey] ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)", color: folderUploading[folder.crewKey] ? "#a0b0c0" : "#fff", border: "none", cursor: folderUploading[folder.crewKey] ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11 }}>
                            {folderUploading[folder.crewKey] ? "Uploading..." : "Upload to Folder"}
                          </button>
                        </div>

                        <div style={{ overflowX: "auto", border: "1px solid #e3ebf4", borderRadius: 10, background: "#fff" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f5f8fc" }}>
                                {["Type", "File Name", "Size", "Uploaded", "Actions"].map((h) => (
                                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6c7e91", borderBottom: "1px solid #e3ebf4", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {folder.files.map((file, index) => (
                                <tr key={file.id} style={{ borderTop: "1px solid #f0f4f8", background: index % 2 === 0 ? "#ffffff" : "#fbfdff" }}>
                                  <td style={{ padding: "10px 12px", color: "#1d4ed8", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700 }}>{getFileIcon(file.fileName)}</td>
                                  <td style={{ padding: "10px 12px", color: "#102a43", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</td>
                                  <td style={{ padding: "10px 12px", color: "#52667f", whiteSpace: "nowrap" }}>{file.fileSize}</td>
                                  <td style={{ padding: "10px 12px", color: "#52667f", whiteSpace: "nowrap" }}>{file.uploadedAt}</td>
                                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <a href={getOpenFileUrl(file)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1d4ed8", textDecoration: "none", padding: "5px 10px", borderRadius: 6, background: "#eaf1ff", border: "1px solid #cfe0ff", fontWeight: 700 }}>
                                        Open
                                      </a>
                                      <button type="button" onClick={() => setShareFile(file)} style={{ fontSize: 11, color: "#1a7a4a", padding: "5px 10px", borderRadius: 6, background: "rgba(26,122,74,0.08)", border: "1px solid rgba(26,122,74,0.2)", fontWeight: 700, cursor: "pointer" }}>
                                        Share
                                      </button>
                                      <button type="button" onClick={() => handleDelete(file)} disabled={deletingIds[file.id]} style={{ fontSize: 11, color: deletingIds[file.id] ? "#9ca7b5" : "#c0392b", padding: "5px 10px", borderRadius: 6, background: deletingIds[file.id] ? "#f0f4f8" : "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", fontWeight: 700, cursor: deletingIds[file.id] ? "not-allowed" : "pointer" }}>
                                        {deletingIds[file.id] ? "Deleting..." : "Delete"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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
