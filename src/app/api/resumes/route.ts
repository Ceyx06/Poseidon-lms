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
            .from("resume")
            .select("*")
            .order("createdAt", { ascending: false });

        if (error) {
            console.error("Fetch error:", JSON.stringify(error));
            return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
        }
        return NextResponse.json({ resumes: data ?? [] });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { crewName, fileName, fileUrl, fileSize, publicId } = await req.json();

        const { data, error } = await supabase
            .from("resume")
            .insert({ crewName, fileName, fileUrl, fileSize, publicId })
            .select()
            .single();

        if (error) {
            console.error("Save error:", JSON.stringify(error));
            return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
        }
        return NextResponse.json({ resume: data });
    } catch (error) {
        console.error("Save error:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
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
            .from("resume")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Delete error:", JSON.stringify(error));
            return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}