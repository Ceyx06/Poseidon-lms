import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const record = await prisma.coordinatorFile.findUnique({
            where: { id },
        });

        if (record?.publicId) {
            try {
                const { createClient } = await import("@supabase/supabase-js");
                const supabase = createClient(
                    process.env.SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_KEY!
                );
                await supabase.storage
                    .from("Poseidon-files")
                    .remove([record.publicId]);
            } catch {
                // ignore storage delete errors
            }
        }

        await prisma.coordinatorFile.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}