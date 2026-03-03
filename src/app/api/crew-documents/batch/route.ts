import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCrewDocument, updateCrewDocument, type CrewDocumentPayload } from "@/lib/crew-documents";

type CrewDocumentInput = {
  crewName?: string;
  owwaStartDate?: string | null;
  birthdate?: string | null;
  eRegNo?: string | null;
  dateProcessed?: string | null;
  dateDeployed?: string | null;
  statusTransaction?: string | null;
  oecNo?: string | null;
  rpfNo?: string | null;
  position?: string | null;
  vessel?: string | null;
  principal?: string | null;
  owwaRenewalDate?: string | null;
};

type BatchRequest = {
  updates?: { id: string; data: CrewDocumentInput }[];
  creates?: CrewDocumentInput[];
};

function toNullable(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parsePayload(input: CrewDocumentInput): CrewDocumentPayload {
  return {
    crewName: (input.crewName ?? "").trim(),
    owwaStartDate: toDate(input.owwaStartDate),
    birthdate: toDate(input.birthdate),
    eRegNo: toNullable(input.eRegNo),
    dateProcessed: toDate(input.dateProcessed),
    dateDeployed: toDate(input.dateDeployed),
    statusTransaction: toNullable(input.statusTransaction),
    oecNo: toNullable(input.oecNo),
    rpfNo: toNullable(input.rpfNo),
    position: toNullable(input.position),
    vessel: toNullable(input.vessel),
    principal: toNullable(input.principal),
    owwaRenewalDate: toDate(input.owwaRenewalDate),
  };
}

function isAdmin(session: any) {
  return (session?.user as any)?.role === "ADMIN";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as BatchRequest;
  const updates = body.updates ?? [];
  const creates = body.creates ?? [];

  for (const item of updates) {
    await updateCrewDocument(item.id, parsePayload(item.data));
  }

  const createdRows = [];
  for (const item of creates) {
    const row = await createCrewDocument(parsePayload(item));
    createdRows.push(row);
  }

  return NextResponse.json({ success: true, createdRows });
}
