"use client";

import { useMemo, useRef, useState } from "react";

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
};

type FolderNode = {
  id: string;
  name: string;
  folders: FolderNode[];
  files: FileItem[];
};

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

export default function PanstarContractPage() {
  const [activeRoot, setActiveRoot] = useState<RootFolder | null>(null);
  const [tree, setTree] = useState<FolderNode | null>(null);
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Track which folder id we're uploading INTO (null = current node)
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

  // Are we inside a subfolder (not the vessel root)?
  const isInsideSubfolder = pathIds.length > 0;

  function openRootFolder(root: RootFolder) {
    setActiveRoot(root);
    setTree(createFolderNode(root.name));
    setPathIds([]);
    setNewFolderName("");
  }

  function backToRootList() {
    setActiveRoot(null);
    setTree(null);
    setPathIds([]);
    setNewFolderName("");
  }

  function createSubFolder() {
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

    const path = [...pathIds];
    setTree((prev) =>
      prev
        ? updateNode(prev, path, (target) => ({
          ...target,
          folders: [createFolderNode(name), ...target.folders],
        }))
        : prev,
    );
    setNewFolderName("");
  }

  function openSubFolder(folderId: string) {
    setPathIds((prev) => [...prev, folderId]);
  }

  function goBackOneLevel() {
    setPathIds((prev) => prev.slice(0, -1));
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!tree || !e.target.files?.length) return;

    const incoming: FileItem[] = Array.from(e.target.files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      uploadedAt: new Date().toLocaleString("en-PH"),
      sizeLabel: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    }));

    // Use override path if set (row-level upload), else current folder path
    const path = uploadTargetRef.current ?? [...pathIds];
    uploadTargetRef.current = null;

    setTree((prev) =>
      prev
        ? updateNode(prev, path, (target) => ({
          ...target,
          files: [...incoming, ...target.files],
        }))
        : prev,
    );

    e.target.value = "";
  }

  function deleteFolder(folderId: string) {
    if (!tree || !currentNode) return;
    const folderToDelete = currentNode.folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;
    const path = [...pathIds];
    // Soft delete: remove from tree but save for restore
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
      ...prev.slice(0, 4), // keep last 5
    ]);
  }

  function restoreFolder(index: number) {
    const entry = deletedFolders[index];
    if (!entry || !tree) return;
    setTree((prev) =>
      prev
        ? updateNode(prev, entry.parentPathIds, (target) => ({
          ...target,
          folders: [entry.folder, ...target.folders],
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

  if (activeRoot && tree && currentNode) {
    return (
      <div style={{ fontFamily: "var(--font-dm)" }}>
        {/* Header */}
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
              PANSTAR Contract Details
            </h1>
            {/* Breadcrumb */}
            <p style={{ fontSize: "13px", color: "#6a85a0" }}>
              {breadcrumb.join(" / ")}
            </p>
          </div>
          <button
            type="button"
            onClick={backToRootList}
            style={{
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #d8e0ea",
              background: "#fff",
              color: "#4d6580",
              cursor: "pointer",
            }}
          >
            Back to Vessels
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #d7e1ec",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {!isInsideSubfolder ? (
              /* ROOT: show folder name input + Create Folder only */
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
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#fff",
                    background: activeRoot.color,
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 14px",
                    cursor: "pointer",
                  }}
                >
                  Create Folder
                </button>
              </>
            ) : (
              /* INSIDE SUBFOLDER: show Upload File + Back only */
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
                  ↑ Upload File
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
                  ← Back
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

        {/* Content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
          {/* Folders — only at root level */}
          {!isInsideSubfolder && <div
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
              FOLDERS
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
                  {/* Clickable folder name area */}
                  <button
                    type="button"
                    onClick={() => openSubFolder(folder.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#1a2d45",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📁</span>
                    <span style={{ fontWeight: 600, fontSize: "13px" }}>{folder.name}</span>
                    <span style={{ color: "#8ea1b8", fontSize: "12px", marginLeft: "auto" }}>
                      {folder.folders.length} folders, {folder.files.length} files
                    </span>
                  </button>
                  {/* Upload directly into this folder without navigating into it */}
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
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#1a6bbf",
                      background: "#eef4ff",
                      border: "1px solid #c5d9f5",
                      borderRadius: "6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ↑ Upload
                  </button>
                  {/* Delete folder */}
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
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#c0392b",
                      background: "#fff0ee",
                      border: "1px solid #f5c5c0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              ))
            )}
          </div>}

          {/* Files — only visible when inside a subfolder */}
          {isInsideSubfolder && <div
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    borderTop: "1px solid #e6edf5",
                  }}
                >
                  <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>📄</span>
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
                        {file.sizeLabel} · {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "12px",
                      color: "#1a6bbf",
                      textDecoration: "none",
                      border: "1px solid #d8e0ea",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open
                  </a>
                </div>
              ))
            )}
          </div>}
        </div>

        {/* Recently Deleted */}
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🗑 RECENTLY DELETED
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
                  <span style={{ fontSize: "16px" }}>📁</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#7a5c10" }}>
                      {entry.folder.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#b09040" }}>
                      {entry.folder.folders.length} folders · {entry.folder.files.length} files · deleted {Math.round((Date.now() - entry.deletedAt) / 1000)}s ago
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
                    ↩ Restore
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

  // Root vessel list
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
          PANSTAR Contract Details
        </h1>
        <p style={{ fontSize: "13px", color: "#6a85a0" }}>
          Select a vessel folder to manage crew contract documents
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
              background: folder.bg,
              border: `1.5px solid ${folder.border}`,
              borderRadius: "18px",
              padding: "32px 20px",
              cursor: "pointer",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: `${folder.color}18`,
                border: `1.5px solid ${folder.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              📁
            </div>

            <div>
              <p
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontWeight: "bold",
                  fontSize: "13px",
                  color: folder.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}
              >
                {folder.name}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#a0b0c0",
                  marginTop: "4px",
                  marginBottom: 0,
                }}
              >
                Click to open
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}