import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("resumes")
            .select("*")
            .order("uploaded_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ resumes: data ?? [] });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { crewName, fileName, fileUrl, fileSize, publicId } = await req.json();

        const { data, error } = await supabase
            .from("resumes")
            .insert({
                crew_name: crewName,
                file_name: fileName,
                file_url: fileUrl,
                file_size: fileSize,
                public_id: publicId,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ resume: data });
    } catch (error) {
        console.error("Save error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { id, publicId } = await req.json();

        if (publicId) {
            await supabase.storage
                .from("Poseidon-files")
                .remove([publicId]);
        }

        const { error } = await supabase
            .from("resumes")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
