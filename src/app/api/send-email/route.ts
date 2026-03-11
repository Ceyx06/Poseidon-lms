import { NextRequest, NextResponse } from "next/server";

type EmailPayload = {
    to: string;
    fileName: string;
    fileUrl: string;
    crewName?: string;
    fileSize?: string;
    uploadedAt?: string;
};

export async function POST(req: NextRequest) {
    try {
        const { to, fileName, fileUrl, crewName, fileSize, uploadedAt }: EmailPayload = await req.json();

        if (!to || !fileUrl || !fileName) {
            return NextResponse.json(
                { error: "Missing required fields: to, fileUrl, fileName" },
                { status: 400 }
            );
        }

        const summary = {
            to,
            fileName,
            fileUrl,
            crewName: crewName ?? "Not provided",
            fileSize: fileSize ?? "Not provided",
            uploadedAt: uploadedAt ?? "Not provided",
        };

        // In this sandboxed environment we cannot send real email,
        // so we log the payload to keep behavior transparent.
        console.info("Email payload (mock send):", summary);

        return NextResponse.json({
            success: true,
            message: "Email sending is mocked in this environment.",
            details: summary,
        });
    } catch (error) {
        console.error("Send email error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to send email." },
            { status: 500 }
        );
    }
}
