import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get the record first to get publicId
        const { data: record } = await supabase
            .from("crew_documents")
            .select("public_id")
            .eq("id", id)
            .single();

        // Delete file from Supabase Storage
        if (record?.public_id) {
            await supabase.storage
                .from("Poseidon-files")
                .remove([record.public_id]);
        }

        // Delete from database
        const { error } = await supabase
            .from("crew_documents")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}