import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

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
                await cloudinary.uploader.destroy(record.publicId, { resource_type: "raw" });
            } catch {
                await cloudinary.uploader.destroy(record.publicId, { resource_type: "image" });
            }
        }

        await prisma.coordinatorFile.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}