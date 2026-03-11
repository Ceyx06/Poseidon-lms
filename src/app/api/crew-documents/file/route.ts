import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "res.cloudinary.com";

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(req: NextRequest) {
  const fileUrl = req.nextUrl.searchParams.get("url");
  const fileName = req.nextUrl.searchParams.get("name") ?? "document.pdf";

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

  try {
    const upstream = await fetch(parsed.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
    });
    if (!upstream.ok) {
      // Some Cloudinary resources reject server-side fetch (401/403) but still open in browser.
      // Fallback to direct browser redirect instead of hard failing.
      return NextResponse.redirect(parsed.toString(), { status: 307 });
    }

    const contentType = upstream.headers.get("content-type") || "application/pdf";
    const ext = fileName.toLowerCase().endsWith(".pdf") ? "" : ".pdf";
    const safeName = safeFileName(fileName + ext);

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stream file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
