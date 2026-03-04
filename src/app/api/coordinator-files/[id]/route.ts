// app/api/coordinator-files/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE — remove a file record from the database
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.coordinatorFile.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/coordinator-files/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
    }
}
