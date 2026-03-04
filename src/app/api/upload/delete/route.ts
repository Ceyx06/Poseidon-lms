import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const { publicId } = await req.json();
        if (!publicId) {
            return NextResponse.json({ error: "No publicId provided" }, { status: 400 });
        }

        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}