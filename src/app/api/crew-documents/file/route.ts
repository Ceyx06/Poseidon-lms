import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "qzmjqruufeetteazmnhg.supabase.co";

export async function GET(req: NextRequest) {
  const fileUrl = req.nextUrl.searchParams.get("url");
  const fileName = req.nextUrl.searchParams.get("name") ?? "document";

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ error: "Unsupported file host." }, { status: 400 });
  }

  const ext = fileName.split(".").pop()?.toLowerCase();

  // Word docs — redirect to Google Docs viewer
  if (ext === "docx" || ext === "doc") {
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    return NextResponse.redirect(viewerUrl, { status: 307 });
  }

  // PDFs and images — stream directly
  try {
    const upstream = await fetch(fileUrl, { cache: "no-store" });

    if (!upstream.ok) {
      return NextResponse.redirect(fileUrl, { status: 307 });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stream file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
