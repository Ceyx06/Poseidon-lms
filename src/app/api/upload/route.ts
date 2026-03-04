import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json(
                { error: "Cloudinary environment variables are missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const lowerName = file.name.toLowerCase();
        const isDocument = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(lowerName);
        const resourceType: "image" | "raw" = isDocument ? "raw" : "image";

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "poseidon-ims",
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const upload = result as { secure_url: string; public_id: string; bytes: number; original_filename: string; resource_type?: string };

        return NextResponse.json({
            url: upload.secure_url,
            publicId: upload.public_id,
            size: upload.bytes,
            name: file.name,
            resourceType: upload.resource_type ?? resourceType,
        });

    } catch (error) {
        console.error("Upload error:", error);
        const message =
            typeof error === "object" && error && "message" in error && typeof (error as { message: unknown }).message === "string"
                ? (error as { message: string }).message
                : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
