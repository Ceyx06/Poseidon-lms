"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type CrewForm = {
  owwaRenewalDate: string;
  crewName: string;
  birthdate: string;
  eRegNo: string;
  dateProcessed: string;
  dateDeployed: string;
  statusTransaction: string;
  oecNo: string;
  rpfNo: string;
};

type RowData = {
  id: string;
  data: CrewForm;
};

type Column = {
  key: keyof CrewForm;
  label: string;
  type: "date" | "text" | "select";
  options?: string[];
  placeholder?: string;
};

type SelectedCell = { row: number; col: number };
type EditingCell = { row: number; col: number; value: string; original: string };

const STATUS_OPTIONS = ["DIS-EMBARKATION", "EMBARKATION"];

const COLUMNS: Column[] = [
  { key: "owwaRenewalDate", label: "Date of OWWA Renewal", type: "date", placeholder: "dd/mm/yyyy" },
  { key: "crewName", label: "Name of Crew", type: "text", placeholder: "NAME OF CREW" },
  { key: "birthdate", label: "Birthdate", type: "date", placeholder: "dd/mm/yyyy" },
  { key: "eRegNo", label: "E-REG No.", type: "text", placeholder: "##" },
  { key: "dateProcessed", label: "Date Processed", type: "date", placeholder: "dd/mm/yyyy" },
  { key: "dateDeployed", label: "Date Deployed", type: "date", placeholder: "dd/mm/yyyy" },
  { key: "statusTransaction", label: "Status/Transaction", type: "select", options: STATUS_OPTIONS },
  { key: "oecNo", label: "OEC No.", type: "text" },
  { key: "rpfNo", label: "RPF No.", type: "text" },
];

const EMPTY_FORM: CrewForm = {
  owwaRenewalDate: "",
  crewName: "",
  birthdate: "",
  eRegNo: "",
  dateProcessed: "",
  dateDeployed: "",
  statusTransaction: "",
  oecNo: "",
  rpfNo: "",
};

function anyValue(form: CrewForm) {
  return Object.values(form).some((v) => v.trim() !== "");
}

function normalizeDate(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const d1 = Number(slash[1]);
    const d2 = Number(slash[2]);
    const y = Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]);
    if (!Number.isNaN(d1) && !Number.isNaN(d2) && !Number.isNaN(y)) {
      // Prefer dd/mm/yyyy display style from user requirement.
      const day = String(d1).padStart(2, "0");
      const month = String(d2).padStart(2, "0");
      return `${y}-${month}-${day}`;
    }
  }

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function displayDate(value: string) {
  if (!value) return "dd/mm/yyyy";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return "dd/mm/yyyy";
  return `${d}/${m}/${y}`;
}

function fromApiRow(row: any): RowData {
  const dateToInput = (v: string | null) => {
    if (!v) return "";
    return new Date(v).toISOString().slice(0, 10);
  };
  return {
    id: row.id,
    data: {
      owwaRenewalDate: dateToInput(row.owwaRenewalDate),
      crewName: row.crewName ?? "",
      birthdate: dateToInput(row.birthdate),
      eRegNo: row.eRegNo ?? "",
      dateProcessed: dateToInput(row.dateProcessed),
      dateDeployed: dateToInput(row.dateDeployed),
      statusTransaction: row.statusTransaction ?? "",
      oecNo: row.oecNo ?? "",
      rpfNo: row.rpfNo ?? "",
    },
  };
}

function toApiPayload(form: CrewForm) {
  return {
    owwaRenewalDate: form.owwaRenewalDate || null,
    crewName: form.crewName,
    birthdate: form.birthdate || null,
    eRegNo: form.eRegNo || null,
    dateProcessed: form.dateProcessed || null,
    dateDeployed: form.dateDeployed || null,
    statusTransaction: form.statusTransaction || null,
    oecNo: form.oecNo || null,
    rpfNo: form.rpfNo || null,
  };
}

export default function CrewDocumentsPage() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCells, setErrorCells] = useState<Record<string, boolean>>({});
  const [addingRow, setAddingRow] = useState(false);
  const [deletingRow, setDeletingRow] = useState(false);
  const [deletingAllRows, setDeletingAllRows] = useState(false);

  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const pendingRef = useRef<Map<string, CrewForm>>(new Map());
  const rollbackRef = useRef<Map<string, CrewForm>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visualRowCount = useMemo(() => Math.max(rows.length, 20), [rows.length]);

  function cellKey(r: number, c: number) {
    return `${r}:${c}`;
  }

  function rowDataAt(row: number): CrewForm {
    if (row < rows.length) return rows[row].data;
    return EMPTY_FORM;
  }

  function moveCell(from: SelectedCell, dir: "up" | "down" | "left" | "right") {
    let r = from.row;
    let c = from.col;
    if (dir === "up") r = Math.max(0, r - 1);
    if (dir === "down") r = Math.min(visualRowCount - 1, r + 1);
    if (dir === "left") c = Math.max(0, c - 1);
    if (dir === "right") c = Math.min(COLUMNS.length - 1, c + 1);
    return { row: r, col: c };
  }

  function focusCell(cell: SelectedCell) {
    setSelected(cell);
    const el = cellRefs.current[cellKey(cell.row, cell.col)];
    if (el) el.focus();
  }

  async function loadRows() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crew-documents", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load records");
      setRows((data.rows ?? []).map(fromApiRow));
    } catch (e: any) {
      setError(e.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  function setCellError(row: number, col: number, hasError: boolean) {
    const key = cellKey(row, col);
    setErrorCells((prev) => {
      const next = { ...prev };
      if (hasError) next[key] = true;
      else delete next[key];
      return next;
    });
  }

  function queueRowSave(id: string, updated: CrewForm, previous: CrewForm) {
    if (!rollbackRef.current.has(id)) rollbackRef.current.set(id, previous);
    pendingRef.current.set(id, updated);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const updates = Array.from(pendingRef.current.entries()).map(([rowId, rowData]) => ({
        id: rowId,
        data: toApiPayload(rowData),
      }));
      const rollbackSnapshot = new Map(rollbackRef.current);
      pendingRef.current.clear();
      rollbackRef.current.clear();
      if (updates.length === 0) return;

      try {
        const res = await fetch("/api/crew-documents/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to save");
      } catch {
        setRows((prev) =>
          prev.map((r) => {
            const old = rollbackSnapshot.get(r.id);
            return old ? { ...r, data: old } : r;
          })
        );
      }
    }, 300);
  }

  async function createRowFromBottom(base: CrewForm) {
    const res = await fetch("/api/crew-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toApiPayload(base)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create row");
    const created = fromApiRow(data.row);
    setRows((prev) => [...prev, created]);
    return created;
  }

  async function addBlankRow() {
    if (addingRow) return;
    setAddingRow(true);
    setError(null);
    try {
      const res = await fetch("/api/crew-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiPayload(EMPTY_FORM)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add row");
      const created = fromApiRow(data.row);
      setRows((prev) => [...prev, created]);
      setTimeout(() => focusCell({ row: rows.length, col: 0 }), 0);
    } catch (e: any) {
      setError(e.message || "Failed to add row");
    } finally {
      setAddingRow(false);
    }
  }

  async function deleteAllRows() {
    if (rows.length === 0) return;
    if (deletingAllRows) return;
    if (!window.confirm("Delete ALL rows?")) return;

    const previousRows = rows;
    setDeletingAllRows(true);
    setError(null);
    setRows([]);
    setSelected(null);
    setEditing(null);

    try {
      await Promise.all(
        previousRows.map(async (r) => {
          const res = await fetch(`/api/crew-documents/${r.id}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to delete all rows");
          }
        })
      );
    } catch (e: any) {
      setRows(previousRows);
      setError(e.message || "Failed to delete all rows");
    } finally {
      setDeletingAllRows(false);
    }
  }

  async function deleteSelectedRow() {
    if (!selected) return;
    if (selected.row >= rows.length) return;
    if (deletingRow) return;
    if (!window.confirm("Delete selected row?")) return;

    const rowIndex = selected.row;
    const id = rows[rowIndex].id;
    const previousRows = rows;

    setDeletingRow(true);
    setError(null);
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
    setSelected(null);
    setEditing(null);

    try {
      const res = await fetch(`/api/crew-documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete row");
    } catch (e: any) {
      setRows(previousRows);
      setError(e.message || "Failed to delete row");
    } finally {
      setDeletingRow(false);
    }
  }

  async function commitEdit(move?: "up" | "down" | "left" | "right") {
    if (!editing) return;
    const { row, col, value, original } = editing;
    const column = COLUMNS[col];
    const normalized = column.type === "date" ? normalizeDate(value) : value;
    const changed = normalized !== original;
    setEditing(null);

    const next = selected ? moveCell(selected, move ?? "down") : null;

    if (!changed) {
      if (next) focusCell(next);
      return;
    }

    if (column.type === "select" && normalized && !STATUS_OPTIONS.includes(normalized)) {
      setCellError(row, col, true);
      if (next) focusCell(next);
      return;
    }

    if (row < rows.length) {
      const id = rows[row].id;
      const prevRow = rows[row].data;
      const updatedRow = { ...prevRow, [column.key]: normalized };
      setRows((prev) => prev.map((r, i) => (i === row ? { ...r, data: updatedRow } : r)));
      setCellError(row, col, false);
      queueRowSave(id, updatedRow, prevRow);
      if (next) focusCell(next);
      return;
    }
    if (next) focusCell(next);
  }

  function startEdit(row: number, col: number, seed?: string) {
    if (row >= rows.length) return;
    const current = rowDataAt(row)[COLUMNS[col].key] ?? "";
    setSelected({ row, col });
    setEditing({
      row,
      col,
      value: seed !== undefined ? seed : current,
      original: current,
    });
  }

  async function applyPaste(start: SelectedCell, text: string) {
    const rowsBlock = text.replace(/\r/g, "").split("\n").filter((r) => r.length > 0);
    if (rowsBlock.length === 0) return;

    const matrix = rowsBlock.map((r) => r.split("\t"));
    const existingBefore = rows.map((r) => ({ ...r, data: { ...r.data } }));
    const updatedRows = rows.map((r) => ({ ...r, data: { ...r.data } }));
    const updates = new Map<string, CrewForm>();

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const targetRow = start.row + r;
        const targetCol = start.col + c;
        if (targetCol >= COLUMNS.length) continue;
        const column = COLUMNS[targetCol];
        let value = matrix[r][c] ?? "";
        if (column.type === "date") value = normalizeDate(value);
        if (column.type === "select" && value && !STATUS_OPTIONS.includes(value)) continue;

        if (targetRow < updatedRows.length) {
          const rowModel = updatedRows[targetRow];
          rowModel.data = { ...rowModel.data, [column.key]: value };
          updates.set(rowModel.id, rowModel.data);
        }
      }
    }

    setRows(updatedRows);

    try {
      const res = await fetch("/api/crew-documents/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: Array.from(updates.entries()).map(([id, data]) => ({ id, data: toApiPayload(data) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to paste");
    } catch {
      setRows(existingBefore);
      setError("Paste failed. Changes were rolled back.");
    }
  }

  const cellBox: CSSProperties = {
    padding: "4px 6px",
    border: "1px solid #d9e1e6",
    height: "28px",
    background: "#f3f5f7",
    fontSize: "11px",
    color: "#4f5b66",
    fontFamily: "var(--font-dm)",
    verticalAlign: "middle",
    position: "relative",
  };

  const canDeleteSelectedRow = !!selected && selected.row < rows.length && !deletingRow;

  return (
    <div style={{ fontFamily: "var(--font-dm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: "22px", color: "#1a2d45", margin: 0 }}>
          Crew Documents
        </h1>
        <button
          type="button"
          onClick={addBlankRow}
          disabled={addingRow}
          style={{
            border: "1px solid #7caec2",
            background: "#e8f5fb",
            color: "#1a4c66",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          {addingRow ? "Adding..." : "+ Add Row"}
        </button>
        <button
          type="button"
          onClick={deleteSelectedRow}
          disabled={!canDeleteSelectedRow}
          style={{
            border: "1px solid #d8b0aa",
            background: canDeleteSelectedRow ? "#f9efee" : "#f3f3f3",
            color: canDeleteSelectedRow ? "#ad3c30" : "#9ea7ad",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "5px 10px",
            cursor: canDeleteSelectedRow ? "pointer" : "not-allowed",
          }}
        >
          {deletingRow ? "Deleting..." : "Delete Row"}
        </button>
        <button
          type="button"
          onClick={deleteAllRows}
          disabled={rows.length === 0 || deletingAllRows}
          style={{
            border: "1px solid #e2b9a7",
            background: rows.length > 0 && !deletingAllRows ? "#fbeee8" : "#f3f3f3",
            color: rows.length > 0 && !deletingAllRows ? "#a13a22" : "#9ea7ad",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "5px 10px",
            cursor: rows.length > 0 && !deletingAllRows ? "pointer" : "not-allowed",
          }}
        >
          {deletingAllRows ? "Deleting All..." : "Delete All Rows"}
        </button>
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
      <div style={{ overflowX: "auto", border: "1px solid #b7d4df" }}>
        <table style={{ width: "100%", minWidth: "1250px", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={{
                    background: "linear-gradient(180deg, #9ec9da 0%, #8bbdd1 100%)",
                    border: "1px solid #7caec2",
                    color: "#112635",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    padding: "6px 8px",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: visualRowCount }).map((_, r) => {
              const real = r < rows.length;
              const data = real ? rows[r].data : EMPTY_FORM;
              return (
                <tr key={real ? rows[r].id : `blank-${r}`} style={{ background: r % 2 === 0 ? "#eef1f4" : "#e9edef" }}>
                  {COLUMNS.map((col, cIdx) => {
                    const isSel = selected?.row === r && selected?.col === cIdx;
                    const isEdit = editing?.row === r && editing?.col === cIdx;
                    const value = data[col.key] ?? "";
                    const hasErr = !!errorCells[cellKey(r, cIdx)];
                    return (
                      <td
                        key={`${r}-${cIdx}`}
                        ref={(el) => {
                          cellRefs.current[cellKey(r, cIdx)] = el;
                        }}
                        tabIndex={0}
                        onClick={() => startEdit(r, cIdx)}
                        onFocus={() => setSelected({ row: r, col: cIdx })}
                        onPaste={(e) => {
                          e.preventDefault();
                          if (selected && selected.row < rows.length) {
                            applyPaste(selected, e.clipboardData.getData("text/plain"));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (r >= rows.length) return;
                          if (isEdit) return;
                          if (e.key === "Enter") {
                            e.preventDefault();
                            startEdit(r, cIdx);
                          } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            const dir = e.key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right";
                            focusCell(moveCell({ row: r, col: cIdx }, dir));
                          } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                            e.preventDefault();
                            startEdit(r, cIdx, e.key);
                          } else if (e.key === "Backspace" || e.key === "Delete") {
                            e.preventDefault();
                            startEdit(r, cIdx, "");
                          }
                        }}
                        style={{
                          ...cellBox,
                          outline: isSel ? "2px solid #4b9ed6" : "none",
                          borderColor: hasErr ? "#d9534f" : cellBox.borderColor,
                        }}
                      >
                        {isEdit ? (
                          col.type === "select" ? (
                            <select
                              autoFocus
                              value={editing.value}
                              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                              onBlur={() => commitEdit()}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  setEditing(null);
                                  focusCell({ row: r, col: cIdx });
                                  return;
                                }
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  commitEdit("down");
                                  return;
                                }
                                if (e.key === "Tab") {
                                  e.preventDefault();
                                  commitEdit(e.shiftKey ? "left" : "right");
                                  return;
                                }
                              }}
                              style={{
                                width: "100%",
                                border: "1px solid #ccd4da",
                                borderRadius: "999px",
                                background: "#dde1e6",
                                fontSize: "11px",
                                padding: "3px 8px",
                              }}
                            >
                              <option value=""></option>
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              autoFocus
                              type={col.type === "date" ? "date" : "text"}
                              value={editing.value}
                              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                              onBlur={() => commitEdit()}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  setEditing(null);
                                  focusCell({ row: r, col: cIdx });
                                  return;
                                }
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  commitEdit("down");
                                  return;
                                }
                                if (e.key === "Tab") {
                                  e.preventDefault();
                                  commitEdit(e.shiftKey ? "left" : "right");
                                  return;
                                }
                                if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  commitEdit("up");
                                  return;
                                }
                                if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  commitEdit("down");
                                  return;
                                }
                                if (e.key === "ArrowLeft") {
                                  if ((e.target as HTMLInputElement).selectionStart === 0) {
                                    e.preventDefault();
                                    commitEdit("left");
                                  }
                                  return;
                                }
                                if (e.key === "ArrowRight") {
                                  const t = e.target as HTMLInputElement;
                                  if (t.selectionStart === t.value.length) {
                                    e.preventDefault();
                                    commitEdit("right");
                                  }
                                  return;
                                }
                              }}
                              style={{
                                width: "100%",
                                border: "1px solid #ccd4da",
                                borderRadius: "3px",
                                background: "#fff",
                                fontSize: "11px",
                                padding: "3px 5px",
                              }}
                            />
                          )
                        ) : (
                          <span
                            style={{
                              color: value ? "#4f5b66" : "#95a2ad",
                              fontStyle: value ? "normal" : "italic",
                            }}
                          >
                            {col.type === "date" ? (value ? displayDate(value) : "dd/mm/yyyy") : value || (col.placeholder ?? "")}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {loading && <p style={{ fontSize: "12px", color: "#6a85a0", marginTop: "6px" }}>Loading...</p>}
    </div>
  );
}

//m