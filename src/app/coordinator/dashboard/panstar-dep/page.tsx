"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RootFolder = {
  name: string;
  color: string;
  bg: string;
  border: string;
};

type FileItem = {
  id: string;
  name: string;
  uploadedAt: string;
  sizeLabel: string;
  url: string;
  mimeType: string;
  publicId?: string;
};

type FolderNode = {
  id: string;
  name: string;
  folders: FolderNode[];
  files: FileItem[];
};

const STORAGE_KEY = "panstar-dep-state-v1";

const rootFolders: RootFolder[] = [
  {
    name: "GENIE",
    color: "#b8841f",
    bg: "linear-gradient(135deg, #fff8f0, #fef3e2)",
    border: "rgba(184,132,31,0.3)",
  },
  {
    name: "GENIE 2",
    color: "#1a6bbf",
    bg: "linear-gradient(135deg, #eef4ff, #ddeeff)",
    border: "rgba(26,107,191,0.3)",
  },
  {
    name: "PANSTAR MIRACLE",
    color: "#0f766e",
    bg: "linear-gradient(135deg, #effcf8, #def7ec)",
    border: "rgba(15,118,110,0.3)",
  },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createFolderNode(name: string): FolderNode {
  return { id: crypto.randomUUID(), name, folders: [], files: [] };
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
  const data = await res.json().catch(() => ({} as { error?: string; url?: string; size?: number; name?: string }));
  if (!res.ok) throw new Error(data?.error || `Upload failed (HTTP ${res.status})`);
  if (!data?.url) throw new Error("Upload failed: missing file URL from server.");
  return data as { url: string; size: number; name: string };
}

function updateNode(
  node: FolderNode,
  pathIds: string[],
  updater: (target: FolderNode) => FolderNode,
): FolderNode {
  if (pathIds.length === 0) return updater(node);
  const [head, ...rest] = pathIds;
  return {
    ...node,
    folders: node.folders.map((child) =>
      child.id === head ? updateNode(child, rest, updater) : child,
    ),
  };
}

function getNodeByPath(node: FolderNode, pathIds: string[]) {
  let current = node;
  for (const id of pathIds) {
    const found = current.folders.find((f) => f.id === id);
    if (!found) return node;
    current = found;
  }
  return current;
}

async function fetchPanstarState(section: "contracts" | "departures", vessel: string): Promise<FolderNode> {
  const res = await fetch(`/api/panstar?section=${encodeURIComponent(section)}&vessel=${encodeURIComponent(vessel)}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to load saved folders/files.");

  const root = createFolderNode(vessel);
  const folders = Array.isArray(data?.folders) ? data.folders : [];
  const files = Array.isArray(data?.files) ? data.files : [];

  root.folders = folders
    .map((f: any) => ({ id: String(f.id), name: String(f.folder_name ?? ""), folders: [], files: [] as FileItem[] }))
    .sort((a: FolderNode, b: FolderNode) => a.name.localeCompare(b.name));

  const folderMap = new Map(root.folders.map((f) => [f.id, f]));
  for (const r of files) {
    const parent = folderMap.get(String(r.folder_id));
    if (!parent) continue;
    parent.files.push({
      id: String(r.id),
      name: String(r.file_name ?? ""),
      uploadedAt: new Date(r.uploaded_at ?? Date.now()).toLocaleString("en-PH"),
      sizeLabel: String(r.file_size ?? ""),
      url: String(r.file_url ?? ""),
      mimeType: String(r.mime_type ?? "application/octet-stream"),
      publicId: String(r.public_id ?? ""),
    });
  }
  root.folders.forEach((f) => f.files.sort((a, b) => a.name.localeCompare(b.name)));
  return root;
}

export default function PanstarDeparturePage() {
  const [activeRoot, setActiveRoot] = useState<RootFolder | null>(null);
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string[] | null>(null);
  const [deletedFolders, setDeletedFolders] = useState<
    { folder: FolderNode; parentPathIds: string[]; deletedAt: number }[]
  >([]);

  const currentNode = useMemo(() => {
    if (!tree) return null;
    return getNodeByPath(tree, pathIds);
  }, [tree, pathIds]);

  const breadcrumb = useMemo(() => {
    if (!tree) return [];
    const parts = [tree.name];
    let current = tree;
    for (const id of pathIds) {
      const next = current.folders.find((f) => f.id === id);
      if (!next) break;
      parts.push(next.name);
      current = next;
    }
    return parts;
  }, [tree, pathIds]);

  const isInsideSubfolder = pathIds.length > 0;

  // Load saved state so folders persist across navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        activeRootName?: string;
        tree?: FolderNode | null;
        pathIds?: string[];
        deletedFolders?: { folder: FolderNode; parentPathIds: string[]; deletedAt: number }[];
      };
      const root = rootFolders.find((r) => r.name === parsed.activeRootName) ?? null;
      setActiveRoot(root);
      setTree(parsed.tree ?? null);
      setPathIds(parsed.pathIds ?? []);
      setDeletedFolders(parsed.deletedFolders ?? []);
    } catch (err) {
      console.error("Failed to restore panstar-dep state", err);
    }
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tree || !activeRoot) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload = {
      activeRootName: activeRoot.name,
      tree,
      pathIds,
      deletedFolders,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tree, activeRoot, pathIds, deletedFolders]);

  async function openRootFolder(root: RootFolder) {
    setActiveRoot(root);
    try {
      const loaded = await fetchPanstarState("departures", root.name);
      setTree(loaded);
    } catch (err) {
      console.error(err);
      setTree(createFolderNode(root.name));
      alert(err instanceof Error ? err.message : "Failed to load saved data.");
    }
    setPathIds([]);
    setNewFolderName("");
  }

  function backToRootList() {
    setActiveRoot(null);
    setTree(null);
    setPathIds([]);
    setNewFolderName("");
  }

  async function createSubFolder() {
    if (!tree || !currentNode) return;
    const name = newFolderName.trim();
    if (!name) return;

    const exists = currentNode.folders.some(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      alert("Folder name already exists in this location.");
      return;
    }

    if (pathIds.length > 0) {
      alert("Only one folder level is supported for PANSTAR.");
      return;
    }
    try {
      const res = await fetch("/api/panstar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "departures", vessel: tree.name, folderName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create folder.");
      const dbFolder = data?.folder;
      const node: FolderNode = { id: String(dbFolder.id), name: String(dbFolder.folder_name ?? name), folders: [], files: [] };
      setTree((prev) => (prev ? { ...prev, folders: [...prev.folders, node].sort((a, b) => a.name.localeCompare(b.name)) } : prev));
      setNewFolderName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create folder.");
    }
  }

  function openSubFolder(folderId: string) {
    setPathIds((prev) => [...prev, folderId]);
  }

  function goBackOneLevel() {
    setPathIds((prev) => prev.slice(0, -1));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!tree || !e.target.files?.length) return;

    try {
      const incoming: FileItem[] = await Promise.all(
        Array.from(e.target.files).map(async (file) => {
          const uploaded = await uploadFileToCloud(file);
          const path = uploadTargetRef.current ?? [...pathIds];
          const folderId = path[path.length - 1];
          if (!folderId) throw new Error("Please open a folder first before uploading files.");

          const saveRes = await fetch("/api/panstar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderId,
              section: "departures",
              vessel: tree.name,
              fileName: file.name,
              fileUrl: uploaded.url,
              fileSize: formatFileSize(uploaded.size ?? file.size),
              publicId: uploaded.publicId ?? null,
              mimeType: file.type || "application/octet-stream",
            }),
          });
          const saveData = await saveRes.json();
          if (!saveRes.ok) throw new Error(saveData?.error || "Failed to save file record.");
          const dbFile = saveData?.file;
          return {
            id: String(dbFile?.id ?? crypto.randomUUID()),
            name: file.name,
            uploadedAt: new Date().toLocaleString("en-PH"),
            sizeLabel: String(dbFile?.file_size ?? formatFileSize(uploaded.size ?? file.size)),
            url: uploaded.url,
            mimeType: file.type || "application/octet-stream",
            publicId: String(dbFile?.public_id ?? uploaded.publicId ?? ""),
          };
        }),
      );

      const path = uploadTargetRef.current ?? [...pathIds];
      uploadTargetRef.current = null;

      setTree((prev) =>
        prev
          ? updateNode(prev, path, (target) => ({
              ...target,
              files: [...target.files, ...incoming].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            }))
          : prev,
      );
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      e.target.value = "";
    }
  }

  async function deleteFolder(folderId: string) {
    if (!tree || !currentNode) return;
    const folderToDelete = currentNode.folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;
    const path = [...pathIds];

    try {
      const res = await fetch("/api/panstar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "folder", id: folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete folder.");
      setTree((prev) =>
        prev
          ? updateNode(prev, path, (target) => ({
              ...target,
              folders: target.folders.filter((f) => f.id !== folderId),
            }))
          : prev,
      );
      setDeletedFolders((prev) => [
        { folder: folderToDelete, parentPathIds: path, deletedAt: Date.now() },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete folder.");
    }
  }

  function restoreFolder(index: number) {
    const entry = deletedFolders[index];
    if (!entry || !tree) return;
    setTree((prev) =>
      prev
        ? updateNode(prev, entry.parentPathIds, (target) => ({
            ...target,
            folders: [...target.folders, entry.folder].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          }))
        : prev,
    );
    setDeletedFolders((prev) => prev.filter((_, i) => i !== index));
  }

  function clearDeletedFolder(index: number) {
    setDeletedFolders((prev) => prev.filter((_, i) => i !== index));
  }

  function uploadIntoFolder(folderPathIds: string[]) {
    uploadTargetRef.current = folderPathIds;
    fileInputRef.current?.click();
  }

  function openFile(file: FileItem) {
    if (!file.url) {
      alert("File URL is missing. Please re-upload this file.");
      return;
    }

    if (isOfficeDoc(file.name, file.mimeType)) {
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
      window.open(officeUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Open the storage URL directly to avoid blank previews caused by embed/frame restrictions.
    if (canPreview(file.mimeType)) {
      window.open(file.url, "_blank", "noopener,noreferrer");
    } else {
      alert(
        "This file type may not preview in-browser. It will open/download in a new tab.",
      );
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  }

  async function deleteFile(fileId: string) {
    if (!tree) return;
    const current = getNodeByPath(tree, pathIds);
    const target = current.files.find((f) => f.id === fileId);
    try {
      const res = await fetch("/api/panstar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "file", id: fileId, publicId: target?.publicId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete file.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file.");
      return;
    }
    const path = [...pathIds];
    setTree((prev) =>
      prev
        ? updateNode(prev, path, (target) => ({
            ...target,
            files: target.files.filter((f) => f.id !== fileId),
          }))
        : prev,
    );
  }

  if (activeRoot && tree && currentNode) {
    return (
      <div style={{ fontFamily: "var(--font-dm)" }}>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-cinzel)",
                fontWeight: "bold",
                fontSize: "22px",
                color: "#1a2d45",
                marginBottom: "4px",
              }}
            >
              PANSTAR departure details
            </h1>
            <p style={{ fontSize: "13px", color: "#6a85a0", margin: 0 }}>
              Vessels {" > "} {tree.name === "GENIE" ? "Genie" : tree.name === "GENIE 2" ? "Genie 2" : "Panstar Miracle"}
            </p>
          </div>
          <button
            type="button"
            onClick={backToRootList}
            style={{
              fontSize: "13px",
              padding: "12px 20px",
              borderRadius: "14px",
              border: "1px solid #d8e0ea",
              background: "#fff",
              color: "#1f2937",
              cursor: "pointer",
            }}
          >
             Back to vessels
          </button>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #d7e1ec",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {!isInsideSubfolder ? (
              <>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createSubFolder()}
                  placeholder="New folder name"
                  style={{
                    width: "220px",
                    maxWidth: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d8e0ea",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#1a2d45",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={createSubFolder}
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1f2937",
                    background: "#fff",
                    border: "1px solid #d8e0ea",
                    borderRadius: "12px",
                    padding: "10px 18px",
                    cursor: "pointer",
                  }}
                >
                   Create folder
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#fff",
                    background: "#1a6bbf",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 14px",
                    cursor: "pointer",
                  }}
                >
                   Upload File
                </button>
                <button
                  type="button"
                  onClick={goBackOneLevel}
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4d6580",
                    background: "#fff",
                    border: "1px solid #d8e0ea",
                    borderRadius: "8px",
                    padding: "9px 14px",
                    cursor: "pointer",
                  }}
                >
                   Back
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
          {!isInsideSubfolder && (
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
                  padding: "12px 14px",
                  borderBottom: "1px solid #e6edf5",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  color: "#5d728a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>FOLDERS</span>
                <span style={{ fontFamily: "inherit", fontSize: "13px", color: "#6b7280", letterSpacing: 0 }}>
                  {currentNode.folders.length} folders
                </span>
              </div>
              {currentNode.folders.length === 0 ? (
                <div style={{ padding: "14px", color: "#8ea1b8", fontSize: "13px" }}>
                  No subfolders yet.
                </div>
              ) : (
                currentNode.folders.map((folder) => (
                  <div
                    key={folder.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderTop: "1px solid #e6edf5",
                      background: "#fff",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#f5f8fc";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "#fff";
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openSubFolder(folder.id)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#1a2d45",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#dbe7f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                        
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>{folder.name}</span>
                        <span style={{ color: "#6b7280", fontSize: "12px" }}>
                          {folder.files.length} files
                        </span>
                      </div>
                      <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "20px", lineHeight: 1 }}>
                        
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadIntoFolder([...pathIds, folder.id]);
                      }}
                      title={`Upload files into "${folder.name}"`}
                      style={{
                        flexShrink: 0,
                        margin: "0 4px 0 10px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1f2937",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                       Upload
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder.id);
                      }}
                      title={`Delete "${folder.name}"`}
                      style={{
                        flexShrink: 0,
                        margin: "0 10px 0 0",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1f2937",
                        background: "#fff",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                       Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {isInsideSubfolder && (
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
                  padding: "12px 14px",
                  borderBottom: "1px solid #e6edf5",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  color: "#5d728a",
                }}
              >
                FILES
              </div>
              {currentNode.files.length === 0 ? (
                <div style={{ padding: "14px", color: "#8ea1b8", fontSize: "13px" }}>
                  No files in this folder yet. Use "Upload File" above.
                </div>
              ) : (
                currentNode.files.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      borderTop: "1px solid #e6edf5",
                    }}
                  >
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}></span>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            color: "#1a2d45",
                            fontWeight: 600,
                            fontSize: "13px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </p>
                        <p style={{ margin: 0, color: "#8ea1b8", fontSize: "12px" }}>
                          {file.sizeLabel}  {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => openFile(file)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#1a6bbf",
                          background: "#eef4ff",
                          border: "1px solid #c5d9f5",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFile(file.id)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#c0392b",
                          background: "#fff0ee",
                          border: "1px solid #f5c5c0",
                          borderRadius: "8px",
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
          )}
        </div>

        {deletedFolders.length > 0 && (
          <div
            style={{
              marginTop: "14px",
              background: "#fffbf0",
              border: "1px solid #f5e0a0",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid #f5e0a0",
                fontFamily: "var(--font-cinzel)",
                fontSize: "12px",
                letterSpacing: "0.06em",
                color: "#a07820",
              }}
            >
               RECENTLY DELETED
            </div>
            {deletedFolders.map((entry, i) => (
              <div
                key={entry.folder.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderTop: i > 0 ? "1px solid #f5e0a0" : undefined,
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#7a5c10" }}>
                      {entry.folder.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#b09040" }}>
                      {entry.folder.folders.length} folders  {entry.folder.files.length} files  deleted{" "}
                      {Math.round((Date.now() - entry.deletedAt) / 1000)}s ago
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => restoreFolder(i)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0f766e",
                      background: "#effcf8",
                      border: "1px solid #a7f0e0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                     Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => clearDeletedFolder(i)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#c0392b",
                      background: "#fff0ee",
                      border: "1px solid #f5c5c0",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-cinzel)",
            fontWeight: "bold",
            fontSize: "22px",
            color: "#1a2d45",
            marginBottom: "4px",
          }}
        >
          PANSTAR departure details
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Select a vessel folder to manage crew departure documents
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {rootFolders.map((folder) => (
          <button
            key={folder.name}
            type="button"
            onClick={() => openRootFolder(folder)}
            style={{
              background: "#ffffff",
              border: "1px solid #d7dde7",
              borderRadius: "14px",
              padding: "24px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
            }}
          >
            <div style={{ width: "66px", height: "66px", borderRadius: "16px", background: `${folder.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" }}></div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1f2937" }}>{folder.name === "GENIE" ? "Genie" : folder.name === "GENIE 2" ? "Genie 2" : "Panstar Miracle"}</p>
              <p style={{ margin: "4px 0 0", fontSize: "16px", color: "#4b5563" }}>Ferry vessel</p>
              <span style={{ marginTop: "12px", display: "inline-block", padding: "6px 12px", borderRadius: "12px", background: `${folder.color}20`, color: folder.color, fontWeight: 700, fontSize: "14px" }}>Panstar Line</span>
            </div>
            <div style={{ marginTop: "4px", borderTop: "1px solid #e5e7eb", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#374151", fontSize: "12px", fontWeight: 500 }}>
              <span>Open folder</span>
              <span style={{ fontSize: "16px" }}></span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}


