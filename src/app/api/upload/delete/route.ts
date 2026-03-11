import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        if (!body) return NextResponse.json({ error: "Empty body" }, { status: 400 });

        const { publicId } = JSON.parse(body);
        if (!publicId) return NextResponse.json({ error: "Missing publicId" }, { status: 400 });

        const { error } = await supabase.storage
            .from("Poseidon-files")
            .remove([publicId]);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}