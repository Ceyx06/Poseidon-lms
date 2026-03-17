import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    return createClient(url, key);
}

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("Resume")
            .select("*")
            .order("createdAt", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ resumes: data ?? [] });
    } catch (error) {
        console.error("Fetch error:", String(error));
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { crewName, fileName, fileUrl, fileSize, publicId } = await req.json();

        const { data, error } = await supabase
            .from("Resume")
            .insert({
                crewName,
                fileName,
                fileUrl,
                fileSize,
                publicId,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ resume: data });
    } catch (error) {
        console.error("Save error:", String(error));
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { id, publicId } = await req.json();

        if (publicId) {
            try {
                await supabase.storage
                    .from("Poseidon-files")
                    .remove([publicId]);
            } catch { /* ignore */ }
        }

        const { error } = await supabase
            .from("Resume")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", String(error));
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}