"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type RowData = { id: string; data: CrewForm };
type Column = {
  key: keyof CrewForm;
  label: string;
  type: "date" | "text" | "select";
  options?: string[];
  width?: number;
};
type SelectedCell = { row: number; col: number };
type EditingCell = { row: number; col: number; value: string; original: string };

// â”€â”€ expiry config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ExpiryRule = { key: keyof CrewForm; label: string; addMonths: number; warnDays: number };
const EXPIRY_RULES: ExpiryRule[] = [
  { key: "owwaRenewalDate", label: "OWWA Renewal", addMonths: 24, warnDays: 60 }, // notify 2 months before expiry
  { key: "oecNo", label: "OEC", addMonths: 2, warnDays: 14 }, // expires in 2 months, notify 2 weeks before expiry
];

// Days-before-expiry to show "expiring soon" warning (orange)

/** Returns the expiry date string (yyyy-mm-dd) given a start date and months to add */
function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Returns days until expiry (negative = already expired) */
function daysUntil(expiryStr: string): number {
  if (!expiryStr) return Infinity;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryStr);
  return Math.round((exp.getTime() - now.getTime()) / 86_400_000);
}

type AlertDocument = {
  field: keyof CrewForm;
  fieldLabel: string;
  startDate: string;
  expiryDate: string;
  daysLeft: number;
  warnDays: number;
};

type AlertItem = {
  crewName: string;
  rowIndex: number;
  daysLeft: number; // earliest/most urgent among this crew's documents
  documents: AlertDocument[];
};

type RowAlertStatus = "EXPIRED" | "EXPIRING" | "NOT_YET";

function getRowUrgencyMeta(data: CrewForm): { status: RowAlertStatus; daysOverdue: number; daysLeft: number } {
  const docs: Array<{ daysLeft: number; warnDays: number }> = [];

  for (const rule of EXPIRY_RULES) {
    const startDate = data[rule.key] as string;
    if (!startDate) continue;
    const expiryDate = addMonths(startDate, rule.addMonths);
    if (!expiryDate) continue;
    docs.push({ daysLeft: daysUntil(expiryDate), warnDays: rule.warnDays });
  }

  if (!docs.length) return { status: "NOT_YET", daysOverdue: 0, daysLeft: Number.POSITIVE_INFINITY };

  const expired = docs.filter((d) => d.daysLeft < 0);
  if (expired.length) {
    return {
      status: "EXPIRED",
      daysOverdue: Math.max(...expired.map((d) => Math.abs(d.daysLeft))),
      daysLeft: Math.min(...expired.map((d) => d.daysLeft)),
    };
  }

  const expiring = docs.filter((d) => d.daysLeft <= d.warnDays);
  if (expiring.length) {
    return {
      status: "EXPIRING",
      daysOverdue: 0,
      daysLeft: Math.min(...expiring.map((d) => d.daysLeft)),
    };
  }

  return {
    status: "NOT_YET",
    daysOverdue: 0,
    daysLeft: Math.min(...docs.map((d) => d.daysLeft)),
  };
}

function compareRowsByUrgency(a: RowData, b: RowData): number {
  const statusRank: Record<RowAlertStatus, number> = {
    EXPIRED: 0,
    EXPIRING: 1,
    NOT_YET: 2,
  };

  const aMeta = getRowUrgencyMeta(a.data);
  const bMeta = getRowUrgencyMeta(b.data);

  const rankDiff = statusRank[aMeta.status] - statusRank[bMeta.status];
  if (rankDiff !== 0) return rankDiff;

  if (aMeta.status === "EXPIRED") {
    const overdueDiff = bMeta.daysOverdue - aMeta.daysOverdue;
    if (overdueDiff !== 0) return overdueDiff;
  } else {
    const daysLeftDiff = aMeta.daysLeft - bMeta.daysLeft;
    if (daysLeftDiff !== 0) return daysLeftDiff;
  }

  return (a.data.crewName || "").localeCompare(b.data.crewName || "");
}

function sortRowsByUrgency(rows: RowData[]): RowData[] {
  return [...rows].sort(compareRowsByUrgency);
}

function compareAlertUrgency(a: AlertItem, b: AlertItem): number {
  const aExpired = a.daysLeft < 0;
  const bExpired = b.daysLeft < 0;

  // 1) EXPIRED first, then EXPIRING.
  if (aExpired !== bExpired) return aExpired ? -1 : 1;

  if (aExpired && bExpired) {
    // 2A) EXPIRED: most overdue first.
    const aDaysOverdue = Math.abs(a.daysLeft);
    const bDaysOverdue = Math.abs(b.daysLeft);
    const overdueDiff = bDaysOverdue - aDaysOverdue;
    if (overdueDiff !== 0) return overdueDiff;
  } else {
    // 2B) EXPIRING: closest to expiry first.
    const daysLeftDiff = a.daysLeft - b.daysLeft;
    if (daysLeftDiff !== 0) return daysLeftDiff;
  }

  return a.crewName.localeCompare(b.crewName);
}

const STATUS_OPTIONS = ["DIS-EMBARKATION", "EMBARKATION"];

const COLUMNS: Column[] = [
  { key: "owwaRenewalDate", label: "OWWA Renewal", type: "date", width: 148 },
  { key: "crewName", label: "Name of Crew", type: "text", width: 200 },
  { key: "birthdate", label: "Birthdate", type: "date", width: 118 },
  { key: "eRegNo", label: "E-Reg No.", type: "text", width: 160 },
  { key: "dateProcessed", label: "Date Processed", type: "date", width: 138 },
  { key: "dateDeployed", label: "Date Deployed", type: "date", width: 138 },
  { key: "statusTransaction", label: "Status", type: "select", width: 175, options: STATUS_OPTIONS },
  { key: "oecNo", label: "OEC Date", type: "date", width: 128 },
  { key: "rpfNo", label: "RPF No.", type: "text", width: 96 },
];

const EMPTY_FORM: CrewForm = {
  owwaRenewalDate: "", crewName: "", birthdate: "", eRegNo: "",
  dateProcessed: "", dateDeployed: "", statusTransaction: "", oecNo: "", rpfNo: "",
};

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function normalizeDate(v: string): string {
  const raw = v.trim();
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
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}
function displayDate(v: string) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}
function fromApiRow(row: any): RowData {
  const d = (v: string | null) => v ? new Date(v).toISOString().slice(0, 10) : "";
  return {
    id: row.id, data: {
      owwaRenewalDate: d(row.owwaRenewalDate), crewName: row.crewName ?? "",
      birthdate: d(row.birthdate), eRegNo: row.eRegNo ?? "",
      dateProcessed: d(row.dateProcessed), dateDeployed: d(row.dateDeployed),
      statusTransaction: row.statusTransaction ?? "", oecNo: normalizeDate(row.oecNo ?? ""), rpfNo: row.rpfNo ?? "",
    }
  };
}
function toApi(form: CrewForm) {
  return {
    owwaRenewalDate: form.owwaRenewalDate || null, crewName: form.crewName,
    birthdate: form.birthdate || null, eRegNo: form.eRegNo || null,
    dateProcessed: form.dateProcessed || null, dateDeployed: form.dateDeployed || null,
    statusTransaction: form.statusTransaction || null, oecNo: form.oecNo || null, rpfNo: form.rpfNo || null,
  };
}

// â”€â”€ design tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const navy = "#0f1f3d";
const accent = "#2563eb";
const accentL = "#dbeafe";
const green = "#16a34a";
const greenL = "#dcfce7";
const red = "#dc2626";
const redL = "#fee2e2";
const orange = "#d97706";
const orangeL = "#fef3c7";
const border = "#e2e8f0";
const muted = "#94a3b8";
const textC = "#1e293b";
const rowOdd = "#f8fafc";
const rowHov = "#f1f5f9";
const font = `'DM Sans', 'Segoe UI', system-ui, sans-serif`;
const ROW_H = 38;

// â”€â”€ sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Badge({ v }: { v: string }) {
  const emb = v === "EMBARKATION";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      background: emb ? greenL : accentL, color: emb ? green : accent,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: emb ? green : accent, flexShrink: 0 }} />
      {v}
    </span>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function AlertPanel({ alerts, onDismiss }: { alerts: AlertItem[]; onDismiss: () => void }) {
  const expired = alerts.filter(a => a.daysLeft < 0);
  const expiring = alerts.filter(a => a.daysLeft >= 0);

  if (alerts.length === 0) return null;

  return (
    <div style={{
      marginBottom: 16,
      border: `1px solid ${expired.length ? "#fca5a5" : "#fcd34d"}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(220,38,38,.08)",
    }}>
      {/* Panel header */}
      <div style={{
        background: expired.length ? "#fff1f2" : "#fffbeb",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${expired.length ? "#fca5a5" : "#fcd34d"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: expired.length ? red : orange }}>
            <BellIcon />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: expired.length ? red : orange }}>
            {expired.length > 0
              ? `${expired.length} Expired Â· ${expiring.length} Expiring Soon`
              : `${expiring.length} Expiring Soon`}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "1px 7px",
            borderRadius: 999, background: expired.length ? redL : orangeL,
            color: expired.length ? red : orange,
          }}>
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        </div>

      </div>

      {/* Alert rows */}
      <div style={{ background: "#fff", maxHeight: 220, overflowY: "auto" }}>
        {/* Expired section */}
        {expired.length > 0 && (
          <>
            <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: red, background: "#fff5f5" }}>
              Expired
            </div>
            {expired.map((a, i) => <AlertRow key={i} a={a} />)}
          </>
        )}
        {/* Expiring soon section */}
        {expiring.length > 0 && (
          <>
            <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: orange, background: "#fffdf0" }}>
              Expiring Soon
            </div>
            {expiring.map((a, i) => <AlertRow key={i} a={a} />)}
          </>
        )}
      </div>
    </div>
  );
}

function AlertRow({ a }: { a: AlertItem }) {
  const isExpired = a.daysLeft < 0;
  const color = isExpired ? red : orange;
  const bg = isExpired ? "#fff5f5" : "#fffdf0";
  const docs = [...a.documents].sort((x, y) => x.daysLeft - y.daysLeft);
  const earliest = docs[0];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
      padding: "8px 16px", borderBottom: `1px solid ${border}`,
      background: bg, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {/* Colored dot */}
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        {/* Crew name */}
        <span style={{ fontSize: 13, fontWeight: 600, color: textC, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {a.crewName || <em style={{ color: muted }}>Unnamed crew</em>}
        </span>
        {/* Document badges */}
        {docs.map((d) => (
          <span
            key={d.fieldLabel}
            style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
              background: color + "22", color, flexShrink: 0,
            }}
          >
            {d.fieldLabel}
          </span>
        ))}
        {/* Dates */}
        <span style={{ fontSize: 12, color: muted, whiteSpace: "nowrap", flexShrink: 0 }}>
          Earliest expiry {displayDate(earliest?.expiryDate ?? "")}
          {docs.length > 1 ? ` · ${docs.length} documents` : ""}
        </span>
      </div>
      {/* Days left pill */}
      <span style={{
        fontSize: 12, fontWeight: 700, padding: "3px 10px",
        borderRadius: 999, background: color + "18", color,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {isExpired
          ? `Expired ${Math.abs(a.daysLeft)} day${Math.abs(a.daysLeft) !== 1 ? "s" : ""} ago`
          : `${a.daysLeft} day${a.daysLeft !== 1 ? "s" : ""} left`}
      </span>
    </div>
  );
}

// â”€â”€ main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CrewDocumentsPage() {
  const [rows, setRows] = useState<RowData[]>([]);
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [deletingRow, setDeletingRow] = useState(false);
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  const creatingRef = useRef(false);
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const pendingRef = useRef<Map<string, CrewForm>>(new Map());
  const rollbackRef = useRef<Map<string, CrewForm>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setRowsOrdered(next: RowData[] | ((prev: RowData[]) => RowData[])) {
    setRows((prev) => {
      const resolved = typeof next === "function" ? (next as (prevRows: RowData[]) => RowData[])(prev) : next;
      return sortRowsByUrgency(resolved);
    });
  }

  // Render only existing rows; keep 1 empty visual row when list is empty.
  const visual = useMemo(() => Math.max(rows.length, 1), [rows.length]);
  const ck = (r: number, c: number) => `${r}:${c}`;
  const rAt = (r: number) => r < rows.length ? rows[r].data : EMPTY_FORM;

  // â”€â”€ compute alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const alerts = useMemo<AlertItem[]>(() => {
    const documentsByRow = new Map<number, AlertDocument[]>();

    rows.forEach((row, rowIndex) => {
      EXPIRY_RULES.forEach(rule => {
        const startDate = row.data[rule.key] as string;
        if (!startDate) return;
        const expiryDate = addMonths(startDate, rule.addMonths);
        if (!expiryDate) return;
        const days = daysUntil(expiryDate);

        if (days <= rule.warnDays) {
          const doc: AlertDocument = {
            field: rule.key,
            fieldLabel: rule.label,
            startDate,
            expiryDate,
            daysLeft: days,
            warnDays: rule.warnDays,
          };
          const existing = documentsByRow.get(rowIndex) ?? [];
          existing.push(doc);
          documentsByRow.set(rowIndex, existing);
        }
      });
    });

    const result: AlertItem[] = Array.from(documentsByRow.entries()).map(([rowIndex, documents]) => {
      const sortedDocs = documents.sort((a, b) => a.daysLeft - b.daysLeft);
      return {
        crewName: rows[rowIndex]?.data.crewName || "",
        rowIndex,
        daysLeft: sortedDocs[0]?.daysLeft ?? Infinity,
        documents: sortedDocs,
      };
    });

    // Sort using strict urgency rules.
    return result.sort(compareAlertUrgency);
  }, [rows]);

  // Reset dismissed state when new alerts appear
  useEffect(() => { setAlertsDismissed(false); }, [alerts.length]);

  // â”€â”€ per-cell expiry status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function getCellExpiry(rowIndex: number, colKey: keyof CrewForm): "expired" | "warn" | null {
    const rule = EXPIRY_RULES.find(r => r.key === colKey);
    if (!rule || rowIndex >= rows.length) return null;
    const startDate = rows[rowIndex].data[colKey] as string;
    if (!startDate) return null;
    const expiry = addMonths(startDate, rule.addMonths);
    if (!expiry) return null;
    const days = daysUntil(expiry);
    if (days < 0) return "expired";
    if (days <= rule.warnDays) return "warn";
    return null;
  }

  function move(from: SelectedCell, dir: "up" | "down" | "left" | "right"): SelectedCell {
    let { row: r, col: c } = from;
    if (dir === "up") r = Math.max(0, r - 1);
    if (dir === "down") r = Math.min(visual - 1, r + 1);
    if (dir === "left") c = Math.max(0, c - 1);
    if (dir === "right") c = Math.min(COLUMNS.length - 1, c + 1);
    return { row: r, col: c };
  }
  function focusCell(cell: SelectedCell) {
    setSelected(cell);
    requestAnimationFrame(() => cellRefs.current[ck(cell.row, cell.col)]?.focus());
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/crew-documents", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setRowsOrdered((data.rows ?? []).map(fromApiRow));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function queueSave(id: string, updated: CrewForm, previous: CrewForm) {
    if (!rollbackRef.current.has(id)) rollbackRef.current.set(id, previous);
    pendingRef.current.set(id, updated);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const updates = Array.from(pendingRef.current.entries()).map(([rid, d]) => ({ id: rid, data: toApi(d) }));
      const snap = new Map(rollbackRef.current);
      pendingRef.current.clear(); rollbackRef.current.clear();
      if (!updates.length) return;
      try {
        const res = await fetch("/api/crew-documents/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates }) });
        if (!res.ok) throw new Error("Save failed");
      } catch {
        setRowsOrdered(prev => prev.map(r => { const o = snap.get(r.id); return o ? { ...r, data: o } : r; }));
      }
    }, 300);
  }

  async function createRow(base: CrewForm): Promise<RowData | null> {
    try {
      const res = await fetch("/api/crew-documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toApi(base)) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create");
      return fromApiRow(data.row);
    } catch (e: any) { setError(e.message); return null; }
  }

  async function addBlankRow() {
    if (addingRow) return;
    setAddingRow(true); setError(null);
    try {
      const created = await createRow(EMPTY_FORM);
      if (!created) return;
      setRows(prev => {
        const ordered = sortRowsByUrgency([...prev, created]);
        const row = ordered.findIndex((r) => r.id === created.id);
        requestAnimationFrame(() => focusCell({ row: row >= 0 ? row : 0, col: 0 }));
        return ordered;
      });
    } finally { setAddingRow(false); }
  }

  async function deleteSelectedRow() {
    if (!selected || selected.row >= rows.length || deletingRow) return;
    if (!window.confirm("Delete selected row?")) return;
    const idx = selected.row, id = rows[idx].id, prev = rows;
    setDeletingRow(true); setError(null);
    setRowsOrdered(r => r.filter((_, i) => i !== idx)); setSelected(null); setEditing(null);
    try {
      const res = await fetch(`/api/crew-documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (e: any) { setRowsOrdered(prev); setError(e.message); }
    finally { setDeletingRow(false); }
  }

  async function commitEdit(dir?: "up" | "down" | "left" | "right", liveRows?: RowData[]) {
    if (!editing) return;
    const { row, col, value, original } = editing;
    const column = COLUMNS[col];
    const norm = column.type === "date" ? normalizeDate(value) : value;
    const changed = norm !== original;
    setEditing(null);
    const src = liveRows ?? rows;
    const next = selected ? move(selected, dir ?? "down") : null;
    if (changed && row < src.length) {
      const id = src[row].id, prevRow = src[row].data;
      const upd = { ...prevRow, [column.key]: norm };
      setRowsOrdered(p => p.map((r, i) => i === row ? { ...r, data: upd } : r));
      queueSave(id, upd, prevRow);
    }
    if (next) focusCell(next);
  }

  async function startEdit(row: number, col: number, seed?: string) {
    const column = COLUMNS[col];
    if (row >= rows.length) {
      if (creatingRef.current) return;
      creatingRef.current = true; setError(null);
      try {
        const created = await createRow(EMPTY_FORM);
        if (!created) return;
        setRows(prev => {
          const ordered = sortRowsByUrgency([...prev, created]);
          const newRowIndex = ordered.findIndex((r) => r.id === created.id);
          const cur = created.data[column.key] ?? "";
          setSelected({ row: newRowIndex, col });
          setEditing({ row: newRowIndex, col, value: seed ?? cur, original: cur });
          return ordered;
        });
      } finally { creatingRef.current = false; }
      return;
    }
    const cur = rAt(row)[column.key] ?? "";
    setSelected({ row, col });
    setEditing({ row, col, value: seed ?? cur, original: cur });
  }

  async function applyPaste(start: SelectedCell, text: string) {
    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.length > 0);
    if (!lines.length) return;
    const matrix = lines.map(l => l.split("\t"));
    const before = rows.map(r => ({ ...r, data: { ...r.data } }));
    const updated = rows.map(r => ({ ...r, data: { ...r.data } }));
    const updates = new Map<string, CrewForm>();
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const tr = start.row + r, tc = start.col + c;
        if (tc >= COLUMNS.length || tr >= updated.length) continue;
        const col = COLUMNS[tc];
        let val = matrix[r][c] ?? "";
        if (col.type === "date") val = normalizeDate(val);
        if (col.type === "select" && val && !STATUS_OPTIONS.includes(val)) continue;
        updated[tr].data = { ...updated[tr].data, [col.key]: val };
        updates.set(updated[tr].id, updated[tr].data);
      }
    }
    setRowsOrdered(updated);
    try {
      const res = await fetch("/api/crew-documents/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates: Array.from(updates.entries()).map(([id, data]) => ({ id, data: toApi(data) })) }) });
      if (!res.ok) throw new Error("Paste failed");
    } catch { setRowsOrdered(before); setError("Paste failed. Changes rolled back."); }
  }

  const canDelete = !!selected && selected.row < rows.length && !deletingRow;
  const totalW = 40 + COLUMNS.reduce((s, c) => s + (c.width ?? 140), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cp { font-family: ${font}; background: #eef2f7; min-height: 100vh; padding: 28px 32px; }

        .cp-header { margin-bottom: 22px; }
        .cp-eyebrow { font-size:10.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:${accent}; margin-bottom:4px; }
        .cp-title   { font-size:28px; font-weight:700; color:${navy}; line-height:1.15; }
        .cp-sub     { font-size:13px; color:${muted}; margin-top:4px; }

        .cp-stats { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
        .cp-stat  { background:#fff; border:1px solid ${border}; border-radius:12px; padding:10px 18px; box-shadow:0 1px 4px rgba(15,31,61,.06); min-width:110px; }
        .cp-stat-lbl { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${muted}; margin-bottom:3px; }
        .cp-stat-val { font-size:22px; font-weight:700; line-height:1; }

        .cp-toolbar { display:flex; align-items:center; gap:8px; margin-bottom:12px; }

        .cp-btn { font-family:${font}; font-size:13px; font-weight:600; padding:7px 16px; border-radius:9px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all .15s; white-space:nowrap; line-height:1.4; }
        .cp-btn-add { background:${accent}; color:#fff; box-shadow:0 1px 5px rgba(37,99,235,.3); }
        .cp-btn-add:hover:not(:disabled) { background:#1d4ed8; }
        .cp-btn-del { background:${redL}; color:${red}; }
        .cp-btn-del:hover:not(:disabled) { background:#fca5a5; }
        .cp-btn-add:disabled,.cp-btn-del:disabled { opacity:.45; cursor:not-allowed; }

        .cp-error { font-size:12px; color:${red}; background:${redL}; border:1px solid #fca5a5; border-radius:8px; padding:7px 14px; margin-bottom:12px; }

        .cp-card   { background:#fff; border-radius:16px; border:1px solid ${border}; box-shadow:0 2px 16px rgba(15,31,61,.08); overflow:hidden; }
        .cp-scroll { overflow-x:auto; overflow-y:auto; max-height:62vh; }

        .cp-table { border-collapse:collapse; table-layout:fixed; font-family:${font}; }

        .cp-table thead th { position:sticky; top:0; z-index:3; background:${navy}; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:rgba(255,255,255,.6); padding:0 12px; height:42px; text-align:left; white-space:nowrap; border-right:1px solid rgba(255,255,255,.07); user-select:none; }
        .cp-table thead th:last-child { border-right:none; }
        .cp-table thead th.num-head   { background:#0b1729; border-right:1px solid rgba(255,255,255,.07); }

        .cp-table td.num { font-size:11px; color:${muted}; font-weight:500; text-align:right; padding:0 10px !important; background:#f8fafc !important; border-right:1px solid ${border}; user-select:none; pointer-events:none; }

        .cp-table td { font-size:13px; color:${textC}; padding:0 12px; height:${ROW_H}px; border-bottom:1px solid ${border}; border-right:1px solid ${border}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:default; user-select:none; transition:background .1s; vertical-align:middle; }
        .cp-table td:last-child { border-right:none; }
        .cp-table td:focus { outline:none; }

        .cp-table tbody tr:nth-child(even) td { background:${rowOdd}; }
        .cp-table tbody tr.real:hover td     { background:${rowHov}; }
        .cp-table tbody tr.real:hover td.num { background:#f1f5f9 !important; }

        .cp-table td.sel  { box-shadow:inset 0 0 0 2px ${accent}; background:#fff !important; z-index:1; }
        .cp-table td.edit { background:#fff !important; box-shadow:inset 0 0 0 2.5px ${accent}; z-index:2; }

        /* expiry cell states */
        .cp-table td.cell-expired { background:#fff1f2 !important; }
        .cp-table td.cell-warn    { background:#fffbeb !important; }
        .cp-table tbody tr.real:hover td.cell-expired { background:#ffe4e6 !important; }
        .cp-table tbody tr.real:hover td.cell-warn    { background:#fef9c3 !important; }
        .cp-table td.cell-expired.sel, .cp-table td.cell-expired.edit { background:#fff1f2 !important; }
        .cp-table td.cell-warn.sel,    .cp-table td.cell-warn.edit    { background:#fffbeb !important; }

        .ci,.cs { width:100%; border:none; outline:none; background:transparent; font-family:${font}; font-size:13px; color:${textC}; padding:0; caret-color:${accent}; }
        .cs { cursor:pointer; }

        .cp-footer { padding:8px 16px; border-top:1px solid ${border}; background:#f8fafc; display:flex; align-items:center; justify-content:space-between; }
        .cp-footer-txt { font-size:12px; color:${muted}; }

        /* alert panel scrollbar */
        .alert-scroll::-webkit-scrollbar { width:4px; }
        .alert-scroll::-webkit-scrollbar-track { background:transparent; }
        .alert-scroll::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:4px; }
      `}</style>

      <div className="cp">
        {/* Header */}
        <div className="cp-header">
          <p className="cp-eyebrow">Fleet Management</p>
          <h1 className="cp-title">Crew Documents</h1>
          <p className="cp-sub">Track crew records, deployment status, and compliance documents.</p>
        </div>

        {/* Stats */}
        <div className="cp-stats">
          <div className="cp-stat">
            <div className="cp-stat-lbl">Total Crew</div>
            <div className="cp-stat-val" style={{ color: navy }}>{rows.length}</div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-lbl">Embarkation</div>
            <div className="cp-stat-val" style={{ color: green }}>
              {rows.filter(r => r.data.statusTransaction === "EMBARKATION").length}
            </div>
          </div>
          <div className="cp-stat">
            <div className="cp-stat-lbl">Dis-Embarkation</div>
            <div className="cp-stat-val" style={{ color: accent }}>
              {rows.filter(r => r.data.statusTransaction === "DIS-EMBARKATION").length}
            </div>
          </div>
          {/* Alert stat */}
          {alerts.length > 0 && (
            <div className="cp-stat" style={{ borderColor: alerts.some(a => a.daysLeft < 0) ? "#fca5a5" : "#fcd34d", cursor: "pointer" }} onClick={() => setAlertsDismissed(false)}>
              <div className="cp-stat-lbl" style={{ color: alerts.some(a => a.daysLeft < 0) ? red : orange }}>Alerts</div>
              <div className="cp-stat-val" style={{ color: alerts.some(a => a.daysLeft < 0) ? red : orange }}>
                {alerts.length}
              </div>
            </div>
          )}
        </div>

        {/* Alert panel */}
        {!alertsDismissed && (
          <AlertPanel alerts={alerts} onDismiss={() => setAlertsDismissed(true)} />
        )}

        {/* Toolbar */}
        <div className="cp-toolbar">
          <button type="button" className="cp-btn cp-btn-add" onClick={addBlankRow} disabled={addingRow}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {addingRow ? "Addingâ€¦" : "Add Row"}
          </button>
          <button type="button" className="cp-btn cp-btn-del" onClick={deleteSelectedRow} disabled={!canDelete}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M2 2l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {deletingRow ? "Deletingâ€¦" : "Delete Row"}
          </button>
          {loading && <span style={{ fontSize: 12, color: muted, marginLeft: 4 }}>Loadingâ€¦</span>}
        </div>

        {error && <div className="cp-error">{error}</div>}

        {/* Table card */}
        <div className="cp-card">
          <div className="cp-scroll">
            <table className="cp-table" style={{ minWidth: totalW, width: totalW }}>
              <colgroup>
                <col style={{ width: 40 }} />
                {COLUMNS.map(c => <col key={c.key} style={{ width: c.width ?? 140 }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th className="num-head" style={{ width: 40, textAlign: "right", paddingRight: 10 }}>#</th>
                  {COLUMNS.map(c => {
                    const hasRule = EXPIRY_RULES.some(r => r.key === c.key);
                    return (
                      <th key={c.key}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {c.label}
                          {hasRule && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999,
                              background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)",
                              letterSpacing: ".06em",
                            }}>
                              {c.key === "owwaRenewalDate" ? "2 YR" : "2 MO"}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: visual }).map((_, r) => {
                  const real = r < rows.length;
                  const data = real ? rows[r].data : EMPTY_FORM;
                  return (
                    <tr key={real ? rows[r].id : `blank-${r}`} className={real ? "real" : ""}>
                      <td className="num">{real ? r + 1 : ""}</td>
                      {COLUMNS.map((col, cIdx) => {
                        const isSel = selected?.row === r && selected?.col === cIdx;
                        const isEdit = editing?.row === r && editing?.col === cIdx;
                        const val = data[col.key] ?? "";
                        const expStatus = real ? getCellExpiry(r, col.key) : null;
                        const expClass = expStatus === "expired" ? "cell-expired" : expStatus === "warn" ? "cell-warn" : "";

                        return (
                          <td
                            key={`${r}-${cIdx}`}
                            ref={el => { cellRefs.current[ck(r, cIdx)] = el; }}
                            tabIndex={0}
                            className={`${isSel ? "sel" : ""} ${isEdit ? "edit" : ""} ${expClass}`}
                            onClick={() => {
                              if (selected?.row === r && selected?.col === cIdx) startEdit(r, cIdx);
                              else setSelected({ row: r, col: cIdx });
                            }}
                            onDoubleClick={() => startEdit(r, cIdx)}
                            onFocus={() => { if (!editing) setSelected({ row: r, col: cIdx }); }}
                            onPaste={e => {
                              e.preventDefault();
                              const t = selected ?? { row: r, col: cIdx };
                              if (t.row < rows.length) applyPaste(t, e.clipboardData.getData("text/plain"));
                            }}
                            onKeyDown={e => {
                              if (isEdit) return;
                              if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(r, cIdx); return; }
                              if (e.key === "Tab") { e.preventDefault(); focusCell(move({ row: r, col: cIdx }, e.shiftKey ? "left" : "right")); return; }
                              if (e.key.startsWith("Arrow")) { e.preventDefault(); focusCell(move({ row: r, col: cIdx }, e.key.replace("Arrow", "").toLowerCase() as any)); return; }
                              if (e.key === "Backspace" || e.key === "Delete") {
                                e.preventDefault();
                                if (r < rows.length) { const id = rows[r].id, prev = rows[r].data, upd = { ...prev, [col.key]: "" }; setRowsOrdered(p => p.map((x, i) => i === r ? { ...x, data: upd } : x)); queueSave(id, upd, prev); }
                                return;
                              }
                              if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); startEdit(r, cIdx, e.key); }
                            }}
                          >
                            {isEdit ? (
                              col.type === "select" ? (
                                <select className="cs" autoFocus value={editing.value}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (r < rows.length) { const id = rows[r].id, prev = rows[r].data, upd = { ...prev, [col.key]: v }; setRowsOrdered(p => p.map((x, i) => i === r ? { ...x, data: upd } : x)); queueSave(id, upd, prev); }
                                    setEditing(null); requestAnimationFrame(() => focusCell({ row: r, col: cIdx }));
                                  }}
                                  onBlur={() => commitEdit()}
                                  onKeyDown={e => {
                                    if (e.key === "Escape") { e.preventDefault(); setEditing(null); focusCell({ row: r, col: cIdx }); }
                                    if (e.key === "Enter") { e.preventDefault(); commitEdit("down"); }
                                    if (e.key === "Tab") { e.preventDefault(); commitEdit(e.shiftKey ? "left" : "right"); }
                                  }}
                                >
                                  <option value=""></option>
                                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input className="ci" autoFocus
                                  type={col.type === "date" ? "date" : "text"}
                                  value={editing.value}
                                  onChange={e => setEditing(p => p ? { ...p, value: e.target.value } : p)}
                                  onBlur={() => commitEdit()}
                                  onKeyDown={e => {
                                    if (e.key === "Escape") { e.preventDefault(); setEditing(null); focusCell({ row: r, col: cIdx }); return; }
                                    if (e.key === "Enter") { e.preventDefault(); commitEdit("down"); return; }
                                    if (e.key === "Tab") { e.preventDefault(); commitEdit(e.shiftKey ? "left" : "right"); return; }
                                    if (e.key === "ArrowUp") { e.preventDefault(); commitEdit("up"); return; }
                                    if (e.key === "ArrowDown") { e.preventDefault(); commitEdit("down"); return; }
                                    if (e.key === "ArrowLeft" && (e.target as HTMLInputElement).selectionStart === 0) { e.preventDefault(); commitEdit("left"); return; }
                                    if (e.key === "ArrowRight") { const t = e.target as HTMLInputElement; if (t.selectionStart === t.value.length) { e.preventDefault(); commitEdit("right"); } return; }
                                  }}
                                />
                              )
                            ) : (
                              col.key === "statusTransaction" && val ? <Badge v={val} /> :
                                col.type === "date" ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: val ? textC : muted, fontVariantNumeric: "tabular-nums" }}>
                                    {displayDate(val)}
                                    {expStatus && (
                                      <span style={{
                                        fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999,
                                        background: expStatus === "expired" ? redL : orangeL,
                                        color: expStatus === "expired" ? red : orange,
                                        flexShrink: 0,
                                      }}>
                                        {expStatus === "expired" ? "EXPIRED" : "EXPIRING"}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span style={{ color: val ? textC : muted }}>{val}</span>
                                )
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

          {/* Footer */}
          <div className="cp-footer">
            <span className="cp-footer-txt">
              {rows.length} record{rows.length !== 1 ? "s" : ""}&nbsp;
              {rows.length > 0 && "Â· Click to select Â· Double-click or type to edit"}
            </span>
            {loading && <span style={{ fontSize: 11, color: muted }}>Syncingâ€¦</span>}
          </div>
        </div>
      </div>
    </>
  );
}




//klklkl
