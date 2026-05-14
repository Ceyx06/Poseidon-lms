"use client";

import { useEffect, useMemo, useState } from "react";

type EmploymentRecord = {
  id: string;
  crewName: string;
  vesselName: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  publicId?: string;
  createdAt: string;
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
    fileName: String(r.file_name ?? r.fileName ?? ""),
    fileUrl: String(r.file_url ?? r.fileUrl ?? ""),
    fileSize: String(r.file_size ?? r.fileSize ?? ""),
    publicId: typeof (r.public_id ?? r.publicId) === "string" ? String(r.public_id ?? r.publicId) : "",
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

function GmailModal({ selectedFiles, onClose }: { selectedFiles: EmploymentRecord[]; onClose: () => void }) {
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
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid #9fb6cf", background: "#fff", color: "#102a43", cursor: "pointer", fontSize: 18, fontWeight: 800 }}>x</button>
        </div>

        <div style={{ marginBottom: 12, background: "#f5f8fc", borderRadius: 10, padding: 10, border: "1px solid #e3ebf4", maxHeight: 130, overflowY: "auto" }}>
          {selectedFiles.map((f) => (
            <div key={f.id} style={{ display: "flex", gap: 8, padding: "4px 0", borderBottom: "1px solid #edf2f7" }}>
              <span style={{ fontSize: 10, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#1d4ed8", background: "#eaf1ff", borderRadius: 4, padding: "2px 6px" }}>{getFileIcon(f.fileName)}</span>
              <span style={{ fontSize: 12, color: "#102a43", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
            </div>
          ))}
        </div>

        <input value={recipientInput} onChange={(e) => setRecipientInput(e.target.value)} onBlur={addRecipient} placeholder="email@example.com" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", marginBottom: 10 }} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (optional)" rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", marginBottom: 10 }} />
        {error && <p style={{ margin: "0 0 10px", color: "#c0392b", fontSize: 12 }}>{error}</p>}
        <button onClick={handleSend} disabled={sending} style={{ width: "100%", padding: "12px", borderRadius: 10, background: sending ? "#e0e8f0" : "linear-gradient(135deg, #EA4335, #ff6b5b)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
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
      throw new Error(
        typeof uploadData?.error === "string"
          ? uploadData.error
          : JSON.stringify(uploadData?.error ?? uploadData)
      );
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
      throw new Error(
        typeof metaData?.error === "string"
          ? metaData.error
          : JSON.stringify(metaData?.error ?? metaData)
      );
    }
    return mapApiRecord(metaData.record);
  }

  async function handleUpload() {
    const cleanName = crewName.trim();
    if (!cleanName) return alert("Please enter the crew name.");
    if (!selectedFiles.length) return alert("Please select at least one file.");

    setUploading(true);
    const newRecords: EmploymentRecord[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      try {
        newRecords.push(await uploadSingleFile(file, cleanName));
      } catch (err) {
        errors.push(`${file.name}: ${errorToMessage(err)}`);
      }
    }

    setRecords((prev) => [...newRecords, ...prev]);
    setCrewName("");
    setSelectedFiles([]);
    const input = document.getElementById("employmentFile") as HTMLInputElement | null;
    if (input) input.value = "";
    if (errors.length) alert(`Some files failed:\n${errors.join("\n")}`);
    setUploading(false);
  }

  async function handleFolderUpload(folderName: string, folderKey: string) {
    const files = folderSelectedFiles[folderKey] ?? [];
    if (!files.length) return alert("Please select at least one file.");

    setFolderUploading((prev) => ({ ...prev, [folderKey]: true }));
    const newRecords: EmploymentRecord[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        newRecords.push(await uploadSingleFile(file, folderName));
      } catch (err) {
        errors.push(`${file.name}: ${errorToMessage(err)}`);
      }
    }
    setRecords((prev) => [...newRecords, ...prev]);
    setFolderSelectedFiles((prev) => ({ ...prev, [folderKey]: [] }));
    const input = document.getElementById(`folder-file-${folderKey}`) as HTMLInputElement | null;
    if (input) input.value = "";
    if (errors.length) alert(`Some files failed:\n${errors.join("\n")}`);
    setFolderUploading((prev) => ({ ...prev, [folderKey]: false }));
  }

  async function handleDelete(record: EmploymentRecord) {
    if (!window.confirm(`Delete "${record.fileName}"?`)) return;
    setDeletingIds((prev) => ({ ...prev, [record.id]: true }));
    try {
      const res = await fetch("/api/employment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, publicId: record.publicId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setCheckedIds((prev) => { const n = new Set(prev); n.delete(record.id); return n; });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingIds((prev) => ({ ...prev, [record.id]: false }));
    }
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleFolderCheck(files: EmploymentRecord[]) {
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
    const map = new Map<string, { crewName: string; crewKey: string; files: EmploymentRecord[] }>();
    for (const rec of filteredRecords) {
      const key = toCrewKey(rec.crewName);
      const existing = map.get(key);
      if (existing) existing.files.push(rec);
      else map.set(key, { crewName: rec.crewName, crewKey: key, files: [rec] });
    }
    return Array.from(map.values()).sort((a, b) => a.crewName.localeCompare(b.crewName));
  }, [filteredRecords]);

  const totalFolders = useMemo(() => new Set(records.map((r) => toCrewKey(r.crewName))).size, [records]);

  return (
    <div style={{ fontFamily: "var(--font-dm)", background: "linear-gradient(180deg, #f6f9fc 0%, #ffffff 55%, #f8fafc 100%)", minHeight: "100vh", padding: 22 }}>
      {showGmail && selectedDocuments.length > 0 && <GmailModal selectedFiles={selectedDocuments} onClose={() => setShowGmail(false)} />}

      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7c93", fontWeight: 700 }}>Coordinator Workspace</p>
          <h1 style={{ margin: "6px 0 4px", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 28, color: "#0f2742" }}>Employment Certificates</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#5a6f86" }}>Organize employment files by crew folder and upload files directly inside each folder.</p>
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
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Enter full crew name" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontFamily: "var(--font-cinzel)", fontWeight: 700, color: "#5f6b7a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Document Files *</label>
              <input id="employmentFile" type="file" multiple accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #c8d6e5", fontSize: 13, color: "#102a43", background: "#f8fbff", boxSizing: "border-box", cursor: "pointer" }} />
            </div>
          </div>
          <button onClick={handleUpload} disabled={uploading} style={{ padding: "10px 16px", borderRadius: 10, background: uploading ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)", color: uploading ? "#a0b0c0" : "#fff", border: "none", cursor: uploading ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 12 }}>
            {uploading ? "Uploading..." : `Create Folder + Upload${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ""}`}
          </button>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #d9e3ef", padding: 20, boxShadow: "0 8px 18px rgba(15,39,66,0.06)" }}>
          <div style={{ marginBottom: 14 }}>
            <input placeholder="Search by crew name or file name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #d0dce8", fontSize: 13, color: "#102a43", background: "#f8fbff", boxSizing: "border-box" }} />
          </div>

          {loading ? (
            <p style={{ margin: 0, color: "#6a85a0", fontSize: 14 }}>Loading files...</p>
          ) : folders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#7a8fa5", border: "1px dashed #d4e0ec", borderRadius: 12, background: "#f9fcff" }}>
              <p style={{ fontSize: 15, fontFamily: "var(--font-cinzel)", color: "#17324d", margin: "0 0 6px" }}>No files uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {folders.map((folder) => {
                const isOpen = !!openFolders[folder.crewKey];
                const allChecked = folder.files.every((f) => checkedIds.has(f.id));
                const someChecked = folder.files.some((f) => checkedIds.has(f.id));
                const selectedInFolder = folder.files.filter((f) => checkedIds.has(f.id));
                const selectedFolderPreview = selectedInFolder.slice(0, 3).map((f) => f.fileName).join(", ");

                return (
                  <div key={folder.crewKey} style={{ border: "1px solid #dbe5f0", borderRadius: 12, background: "#fcfdff" }}>
                    <button type="button" onClick={() => setOpenFolders((prev) => ({ ...prev, [folder.crewKey]: !prev[folder.crewKey] }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "transparent", border: "none", cursor: "pointer", padding: 14, textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(26,107,191,0.12)", color: "#1a6bbf", fontSize: 12, fontWeight: 700, border: "1px solid rgba(26,107,191,0.22)" }}>{isOpen ? "-" : "+"}</span>
                        <p style={{ margin: 0, fontFamily: "var(--font-cinzel)", fontSize: 15, color: "#102a43", fontWeight: 700 }}>{folder.crewName}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {someChecked && <span style={{ fontSize: 11, color: "#1a6bbf", background: "#eaf1ff", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>{selectedInFolder.length} selected</span>}
                        <p style={{ margin: 0, fontSize: 12, color: "#1a6bbf", fontWeight: 700, background: "#eaf1ff", borderRadius: 999, padding: "4px 10px" }}>{folder.files.length} file(s)</p>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 14px 14px" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          <input id={`folder-file-${folder.crewKey}`} type="file" multiple accept={ACCEPTED_UPLOAD_TYPES} onChange={(e) => setFolderSelectedFiles((prev) => ({ ...prev, [folder.crewKey]: Array.from(e.target.files ?? []) }))} style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #c8d6e5", fontSize: 12, color: "#102a43", background: "#fff", cursor: "pointer" }} />
                          <button type="button" onClick={() => handleFolderUpload(folder.crewName, folder.crewKey)} disabled={folderUploading[folder.crewKey]} style={{ padding: "9px 12px", borderRadius: 8, background: folderUploading[folder.crewKey] ? "#e0e8f0" : "linear-gradient(135deg, #b8841f, #e8b84b)", color: folderUploading[folder.crewKey] ? "#a0b0c0" : "#fff", border: "none", cursor: folderUploading[folder.crewKey] ? "not-allowed" : "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11 }}>{folderUploading[folder.crewKey] ? "Uploading..." : "Upload to Folder"}</button>
                          <button type="button" onClick={() => toggleFolderCheck(folder.files)} style={{ padding: "9px 12px", borderRadius: 8, background: allChecked ? "#edfff5" : "#f5f8fc", color: allChecked ? "#1a7a4a" : "#5a6f86", border: `1px solid ${allChecked ? "rgba(26,122,74,0.3)" : "#d0dce8"}`, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{allChecked ? "All Selected" : "Select All"}</button>
                        </div>

                        <div style={{ overflowX: "auto", border: "1px solid #e3ebf4", borderRadius: 10, background: "#fff" }}>
                          {someChecked && (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderBottom: "1px solid #e8eef5", background: "#f8fbff" }}>
                              <div style={{ minWidth: 220, flex: 1 }}>
                                <p style={{ margin: 0, color: "#102a43", fontSize: 12, fontWeight: 700 }}>{selectedInFolder.length} selected in this folder</p>
                                <p style={{ margin: "2px 0 0", color: "#6a7f95", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFolderPreview}{selectedInFolder.length > 3 ? ` +${selectedInFolder.length - 3} more` : ""}</p>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setShowGmail(true)} style={{ padding: "7px 12px", borderRadius: 8, background: "linear-gradient(135deg, #EA4335, #ff6b5b)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: 11 }}>Send via Gmail</button>
                                <button onClick={() => setCheckedIds(new Set())} style={{ padding: "7px 12px", borderRadius: 8, background: "#fff", color: "#5a6f86", border: "1px solid #d0dce8", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Clear</button>
                              </div>
                            </div>
                          )}

                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f5f8fc" }}>
                                {["", "Type", "File Name", "Size", "Uploaded", "Actions"].map((h) => (
                                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontFamily: "var(--font-cinzel)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6c7e91", borderBottom: "1px solid #e3ebf4", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {folder.files.map((file, index) => (
                                <tr key={file.id} style={{ borderTop: "1px solid #f0f4f8", background: checkedIds.has(file.id) ? "#f0f7ff" : index % 2 === 0 ? "#ffffff" : "#fbfdff" }}>
                                  <td style={{ padding: "10px 12px" }}><input type="checkbox" checked={checkedIds.has(file.id)} onChange={() => toggleCheck(file.id)} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#1a6bbf" }} /></td>
                                  <td style={{ padding: "10px 12px", color: "#1d4ed8", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700 }}>{getFileIcon(file.fileName)}</td>
                                  <td style={{ padding: "10px 12px", color: "#102a43", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</td>
                                  <td style={{ padding: "10px 12px", color: "#52667f", whiteSpace: "nowrap" }}>{file.fileSize || "-"}</td>
                                  <td style={{ padding: "10px 12px", color: "#52667f", whiteSpace: "nowrap" }}>{file.createdAt ? new Date(file.createdAt).toLocaleString("en-PH") : "-"}</td>
                                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      <a href={getOpenFileUrl(file)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1d4ed8", textDecoration: "none", padding: "5px 10px", borderRadius: 6, background: "#eaf1ff", border: "1px solid #cfe0ff", fontWeight: 700 }}>Open</a>
                                      <button type="button" onClick={() => { setCheckedIds(new Set([file.id])); setShowGmail(true); }} style={{ fontSize: 11, color: "#EA4335", padding: "5px 10px", borderRadius: 6, background: "#fff1f0", border: "1px solid #ffc5c2", fontWeight: 700, cursor: "pointer" }}>Gmail</button>
                                      <button type="button" onClick={() => handleDelete(file)} disabled={deletingIds[file.id]} style={{ fontSize: 11, color: deletingIds[file.id] ? "#9ca7b5" : "#c0392b", padding: "5px 10px", borderRadius: 6, background: deletingIds[file.id] ? "#f0f4f8" : "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)", fontWeight: 700, cursor: deletingIds[file.id] ? "not-allowed" : "pointer" }}>{deletingIds[file.id] ? "Deleting..." : "Delete"}</button>
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
