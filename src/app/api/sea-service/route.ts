import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error(`Missing Supabase env vars: URL=${url}, KEY=${key ? "set" : "missing"}`);
    return createClient(url, key);
}

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("sea_service_files")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ records: data });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { crewName, fileName, fileUrl, publicId } = await req.json();

        const { data, error } = await supabase
            .from("sea_service_files")
            .insert({
                crew_name: crewName,
                file_name: fileName,
                file_url: fileUrl,
                public_id: publicId,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ record: data });
    } catch (error) {
        console.error("Save error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { id, publicId } = await req.json();

        if (publicId) {
            try {
                await supabase.storage.from("Poseidon-files").remove([publicId]);
            } catch { /* ignore */ }
        }

        const { error } = await supabase
            .from("sea_service_files")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}