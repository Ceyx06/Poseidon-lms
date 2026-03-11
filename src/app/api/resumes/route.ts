export async function DELETE(req: NextRequest) {
    try {
        const { id, publicId } = await req.json();

        // Try Supabase delete first, then Cloudinary
        if (publicId) {
            try {
                const { createClient } = await import("@supabase/supabase-js");
                const supabase = createClient(
                    process.env.SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_KEY!
                );
                await supabase.storage.from("Poseidon-files").remove([publicId]);
            } catch {
                try {
                    const cloudinary = (await import("@/lib/cloudinary")).default;
                    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
                } catch {
                    // ignore
                }
            }
        }

        await prisma.resume.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}