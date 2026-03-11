import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return new NextResponse("Missing url", { status: 400 });

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
        headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
            "Access-Control-Allow-Origin": "*",
        },
    });
}