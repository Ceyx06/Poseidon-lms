import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { data: record, error: fetchError } = await supabase
            .from("crew_documents")
            .select("public_id")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;
        if (!record) return NextResponse.json({ error: "File not found" }, { status: 404 });

        if (record.public_id) {
            await supabase.storage.from("Poseidon-files").remove([record.public_id]);
        }

        const { error: deleteError } = await supabase
            .from("crew_documents")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
