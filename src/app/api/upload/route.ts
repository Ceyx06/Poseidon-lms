import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error(`Missing Supabase env vars`);
    return createClient(url, key);
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        const supabase = getSupabase();

        const { error } = await supabase.storage
            .from("Poseidon-files")
            .upload(fileName, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });

        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from("Poseidon-files")
            .getPublicUrl(fileName);

        return NextResponse.json({
            url: publicData.publicUrl,
            publicId: fileName,
            size: file.size,
            name: file.name,
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}