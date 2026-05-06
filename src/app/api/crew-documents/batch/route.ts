import { NextRequest, NextResponse } from "next/server";
import { updateCrewDocument } from "@/lib/crew-documents";

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const { updates } = await req.json();
    await Promise.all(
      (updates ?? []).map(({ id, data }: { id: string; data: any }) =>
        updateCrewDocument(String(id), {
          crewName: String(data?.crewName ?? "").trim(),
          owwaStartDate: asDate(data?.owwaStartDate),
          birthdate: asDate(data?.birthdate),
          eRegNo: data?.eRegNo ? String(data.eRegNo) : null,
          dateProcessed: asDate(data?.dateProcessed),
          dateDeployed: asDate(data?.dateDeployed),
          statusTransaction: data?.statusTransaction ? String(data.statusTransaction) : null,
          oecNo: data?.oecNo ? String(data.oecNo) : null,
          rpfNo: data?.rpfNo ? String(data.rpfNo) : null,
          position: data?.position ? String(data.position) : null,
          vessel: data?.vessel ? String(data.vessel) : null,
          principal: data?.principal ? String(data.principal) : null,
          owwaRenewalDate: asDate(data?.owwaRenewalDate),
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
