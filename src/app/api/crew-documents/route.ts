import { NextRequest, NextResponse } from "next/server";
import { createCrewDocument, listCrewDocuments } from "@/lib/crew-documents";

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  try {
    const rows = await listCrewDocuments();
    return NextResponse.json({ rows, records: rows });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const row = await createCrewDocument({
      crewName: String(payload?.crewName ?? "").trim(),
      owwaStartDate: asDate(payload?.owwaStartDate),
      birthdate: asDate(payload?.birthdate),
      eRegNo: payload?.eRegNo ? String(payload.eRegNo) : null,
      dateProcessed: asDate(payload?.dateProcessed),
      dateDeployed: asDate(payload?.dateDeployed),
      statusTransaction: payload?.statusTransaction ? String(payload.statusTransaction) : null,
      oecNo: payload?.oecNo ? String(payload.oecNo) : null,
      rpfNo: payload?.rpfNo ? String(payload.rpfNo) : null,
      position: payload?.position ? String(payload.position) : null,
      vessel: payload?.vessel ? String(payload.vessel) : null,
      principal: payload?.principal ? String(payload.principal) : null,
      owwaRenewalDate: asDate(payload?.owwaRenewalDate),
    });
    return NextResponse.json({ row, record: row });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
