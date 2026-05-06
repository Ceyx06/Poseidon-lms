import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    return createClient(url, key);
}

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { searchParams } = new URL(req.url);
        const section = searchParams.get("section");
        const vessel = searchParams.get("vessel");
        if (!section || !vessel) return NextResponse.json({ error: "Missing params" }, { status: 400 });

        const { data: folders, error: fErr } = await supabase
            .from("panstar_folders")
            .select("*")
            .eq("section", section)
            .eq("vessel", vessel)
            .order("created_at", { ascending: true });
        if (fErr) throw fErr;

        const { data: files, error: fileErr } = await supabase
            .from("panstar_files")
            .select("*")
            .eq("section", section)
            .eq("vessel", vessel)
            .order("uploaded_at", { ascending: true });
        if (fileErr) throw fileErr;

        return NextResponse.json({ folders: folders ?? [], files: files ?? [] });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { section, vessel, folderName } = await req.json();
        const { data, error } = await supabase
            .from("panstar_folders")
            .insert({ section, vessel, folder_name: folderName })
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ folder: data });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { folderId, section, vessel, fileName, fileUrl, fileSize, publicId, mimeType } = await req.json();
        const { data, error } = await supabase
            .from("panstar_files")
            .insert({ folder_id: folderId, section, vessel, file_name: fileName, file_url: fileUrl, file_size: fileSize, public_id: publicId, mime_type: mimeType })
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ file: data });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { type, id, publicId } = await req.json();
        if (publicId) {
            try { await supabase.storage.from("Poseidon-files").remove([publicId]); } catch { }
        }
        if (type === "folder") {
            const { error } = await supabase.from("panstar_folders").delete().eq("id", id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("panstar_files").delete().eq("id", id);
            if (error) throw error;
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}