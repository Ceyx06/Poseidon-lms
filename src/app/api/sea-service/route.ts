import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const records = await (prisma as any).seaServiceFile.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ records });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { crewName, fileName, fileUrl, publicId } = await req.json();
        const record = await (prisma as any).seaServiceFile.create({
            data: { crewName, fileName, fileUrl, publicId },
        });
        return NextResponse.json({ record });
    } catch (error) {
        console.error("Save error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id, publicId } = await req.json();

        if (publicId) {
            try {
                const { createClient } = await import("@supabase/supabase-js");
                const supabase = createClient(
                    process.env.SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_KEY!
                );
                await supabase.storage.from("Poseidon-files").remove([publicId]);
            } catch { /* ignore */ }
        }

        await (prisma as any).seaServiceFile.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}