import { createClient } from "@supabase/supabase-js";

export type CrewDocumentRecord = {
  id: string;
  crewName: string;
  owwaStartDate: Date | null;
  birthdate: Date | null;
  eRegNo: string | null;
  dateProcessed: Date | null;
  dateDeployed: Date | null;
  statusTransaction: string | null;
  oecNo: string | null;
  rpfNo: string | null;
  position: string | null;
  vessel: string | null;
  principal: string | null;
  owwaRenewalDate: Date | null;
  updatedAt: Date;
};

export type CrewDocumentPayload = {
  crewName: string;
  owwaStartDate: Date | null;
  birthdate: Date | null;
  eRegNo: string | null;
  dateProcessed: Date | null;
  dateDeployed: Date | null;
  statusTransaction: string | null;
  oecNo: string | null;
  rpfNo: string | null;
  position: string | null;
  vessel: string | null;
  principal: string | null;
  owwaRenewalDate: Date | null;
};

function getDelegate() {
  return null;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapRow(r: any): CrewDocumentRecord {
  return {
    id: String(r.id),
    crewName: String(r.crewName ?? ""),
    owwaStartDate: parseDate(r.owwaStartDate),
    birthdate: parseDate(r.birthdate),
    eRegNo: r.eRegNo ? String(r.eRegNo) : null,
    dateProcessed: parseDate(r.dateProcessed),
    dateDeployed: parseDate(r.dateDeployed),
    statusTransaction: r.statusTransaction ? String(r.statusTransaction) : null,
    oecNo: r.oecNo ? String(r.oecNo) : null,
    rpfNo: r.rpfNo ? String(r.rpfNo) : null,
    position: r.position ? String(r.position) : null,
    vessel: r.vessel ? String(r.vessel) : null,
    principal: r.principal ? String(r.principal) : null,
    owwaRenewalDate: parseDate(r.owwaRenewalDate),
    updatedAt: parseDate(r.updatedAt) ?? new Date(),
  };
}

export function computeCrewExpiryDate(record: Pick<CrewDocumentRecord, "owwaRenewalDate" | "dateProcessed" | "oecNo">): Date | null {
  function parseDateString(value: string | null): Date | null {
    if (!value) return null;
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      const year = Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]);
      const month = Number(slashMatch[1]) - 1;
      const day = Number(slashMatch[2]);
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const owwaExpiryDate = record.owwaRenewalDate
    ? new Date(
        record.owwaRenewalDate.getFullYear() + 2,
        record.owwaRenewalDate.getMonth(),
        record.owwaRenewalDate.getDate()
      )
    : null;
  const oecBaseDate = record.dateProcessed ?? parseDateString(record.oecNo ?? null);
  const oecExpiryDate = oecBaseDate
    ? new Date(oecBaseDate.getFullYear(), oecBaseDate.getMonth() + 2, oecBaseDate.getDate())
    : null;

  const candidates = [owwaExpiryDate, oecExpiryDate].filter((d): d is Date => Boolean(d));
  if (candidates.length === 0) return null;
  return candidates.reduce((earliest, current) => (current < earliest ? current : earliest));
}

export async function listCrewDocuments(): Promise<CrewDocumentRecord[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("OWWARecord")
    .select(
      "id, crewName, owwaStartDate, birthdate, eRegNo, dateProcessed, dateDeployed, statusTransaction, oecNo, rpfNo, position, vessel, principal, owwaRenewalDate, updatedAt, createdAt"
    )
    .order("createdAt", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createCrewDocument(data: CrewDocumentPayload): Promise<CrewDocumentRecord> {
  const supabase = getSupabase();
  const payload = {
    crewName: data.crewName,
    owwaStartDate: toIsoOrNull(data.owwaStartDate),
    birthdate: toIsoOrNull(data.birthdate),
    eRegNo: data.eRegNo,
    dateProcessed: toIsoOrNull(data.dateProcessed),
    dateDeployed: toIsoOrNull(data.dateDeployed),
    statusTransaction: data.statusTransaction,
    oecNo: data.oecNo,
    rpfNo: data.rpfNo,
    position: data.position,
    vessel: data.vessel,
    principal: data.principal,
    owwaRenewalDate: toIsoOrNull(data.owwaRenewalDate),
  };

  const { data: row, error } = await supabase
    .from("OWWARecord")
    .insert(payload)
    .select(
      "id, crewName, owwaStartDate, birthdate, eRegNo, dateProcessed, dateDeployed, statusTransaction, oecNo, rpfNo, position, vessel, principal, owwaRenewalDate, updatedAt"
    )
    .single();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("Insert failed");
  return mapRow(row);
}

export async function updateCrewDocument(id: string, data: CrewDocumentPayload): Promise<void> {
  const supabase = getSupabase();
  const payload = {
    crewName: data.crewName,
    owwaStartDate: toIsoOrNull(data.owwaStartDate),
    birthdate: toIsoOrNull(data.birthdate),
    eRegNo: data.eRegNo,
    dateProcessed: toIsoOrNull(data.dateProcessed),
    dateDeployed: toIsoOrNull(data.dateDeployed),
    statusTransaction: data.statusTransaction,
    oecNo: data.oecNo,
    rpfNo: data.rpfNo,
    position: data.position,
    vessel: data.vessel,
    principal: data.principal,
    owwaRenewalDate: toIsoOrNull(data.owwaRenewalDate),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("OWWARecord")
    .update(payload)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCrewDocument(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("OWWARecord")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
