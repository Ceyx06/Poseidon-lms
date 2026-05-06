import { prisma } from "@/lib/prisma";

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
  return (prisma as any).oWWARecord;
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
  const delegate = getDelegate();
  if (delegate?.findMany) {
    return delegate.findMany({ orderBy: { createdAt: "asc" } });
  }

  try {
    return await prisma.$queryRawUnsafe<CrewDocumentRecord[]>(`
      SELECT
        "id",
        "crewName",
        "owwaStartDate",
        "birthdate",
        "eRegNo",
        "dateProcessed",
        "dateDeployed",
        "statusTransaction",
        "oecNo",
        "rpfNo",
        "position",
        "vessel",
        "principal",
        "owwaRenewalDate",
        "updatedAt"
      FROM "OWWARecord"
      ORDER BY "createdAt" ASC
    `);
  } catch {
    return [];
  }
}

export async function createCrewDocument(data: CrewDocumentPayload): Promise<CrewDocumentRecord> {
  const delegate = getDelegate();
  if (delegate?.create) {
    return delegate.create({ data });
  }

  const id = crypto.randomUUID();
  const rows = await prisma.$queryRaw<CrewDocumentRecord[]>`
    INSERT INTO "OWWARecord" (
      "id",
      "crewName",
      "owwaStartDate",
      "birthdate",
      "eRegNo",
      "dateProcessed",
      "dateDeployed",
      "statusTransaction",
      "oecNo",
      "rpfNo",
      "position",
      "vessel",
      "principal",
      "owwaRenewalDate",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${data.crewName},
      ${data.owwaStartDate},
      ${data.birthdate},
      ${data.eRegNo},
      ${data.dateProcessed},
      ${data.dateDeployed},
      ${data.statusTransaction},
      ${data.oecNo},
      ${data.rpfNo},
      ${data.position},
      ${data.vessel},
      ${data.principal},
      ${data.owwaRenewalDate},
      NOW(),
      NOW()
    )
    RETURNING
      "id",
      "crewName",
      "owwaStartDate",
      "birthdate",
      "eRegNo",
      "dateProcessed",
      "dateDeployed",
      "statusTransaction",
      "oecNo",
      "rpfNo",
      "position",
      "vessel",
      "principal",
      "owwaRenewalDate",
      "updatedAt"
  `;

  return rows[0];
}

export async function updateCrewDocument(id: string, data: CrewDocumentPayload): Promise<void> {
  const delegate = getDelegate();
  if (delegate?.update) {
    await delegate.update({ where: { id }, data });
    return;
  }

  await prisma.$executeRaw`
    UPDATE "OWWARecord"
    SET
      "crewName" = ${data.crewName},
      "owwaStartDate" = ${data.owwaStartDate},
      "birthdate" = ${data.birthdate},
      "eRegNo" = ${data.eRegNo},
      "dateProcessed" = ${data.dateProcessed},
      "dateDeployed" = ${data.dateDeployed},
      "statusTransaction" = ${data.statusTransaction},
      "oecNo" = ${data.oecNo},
      "rpfNo" = ${data.rpfNo},
      "position" = ${data.position},
      "vessel" = ${data.vessel},
      "principal" = ${data.principal},
      "owwaRenewalDate" = ${data.owwaRenewalDate},
      "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
}

export async function deleteCrewDocument(id: string): Promise<void> {
  const delegate = getDelegate();
  if (delegate?.delete) {
    await delegate.delete({ where: { id } });
    return;
  }

  await prisma.$executeRaw`DELETE FROM "OWWARecord" WHERE "id" = ${id}`;
}
