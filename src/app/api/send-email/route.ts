// app/api/send-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const { to, fileName, fileUrl, crewName, fileSize, uploadedAt } = await req.json();

        if (!to || !fileUrl || !fileName) {
            return NextResponse.json({ error: "Missing required fields: to, fileUrl, fileName" }, { status: 400 });
        }

        // Fetch the file from Cloudinary as a buffer
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
            return NextResponse.json({ error: "Failed to fetch file from storage." }, { status: 500 });
        }
        const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

        // Detect MIME type
        const isPdf = /\.pdf$/i.test(fileName);
        const mimeType = isPdf ? "application/pdf" : "application/octet-stream";

        // Create Nodemailer transporter using Gmail SMTP + App Password
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Poseidon IMS Coordinator" <${process.env.GMAIL_USER}>`,
            to,
            subject: `Crew Document: ${fileName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e8f0; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #0f2742, #1a4a7a); border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px;">📄 Crew Document</h2>
            <p style="color: #a8c8f0; margin: 6px 0 0; font-size: 13px;">Poseidon IMS — Coordinator Workspace</p>
          </div>
          <p style="color: #1a2d45; font-size: 14px; margin: 0 0 16px;">Hello,</p>
          <p style="color: #1a2d45; font-size: 14px; margin: 0 0 20px;">Please find the crew document attached to this email.</p>
          <table style="width: 100%; border-collapse: collapse; background: #f8fbff; border-radius: 10px; overflow: hidden; border: 1px solid #e0e8f0;">
            <tr>
              <td style="padding: 10px 16px; font-size: 12px; color: #6a7f95; font-weight: bold; border-bottom: 1px solid #e8eef5; width: 120px;">FILE</td>
              <td style="padding: 10px 16px; font-size: 13px; color: #1a2d45; border-bottom: 1px solid #e8eef5;">${fileName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; font-size: 12px; color: #6a7f95; font-weight: bold; border-bottom: 1px solid #e8eef5;">CREW</td>
              <td style="padding: 10px 16px; font-size: 13px; color: #1a2d45; border-bottom: 1px solid #e8eef5;">${crewName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; font-size: 12px; color: #6a7f95; font-weight: bold; border-bottom: 1px solid #e8eef5;">SIZE</td>
              <td style="padding: 10px 16px; font-size: 13px; color: #1a2d45; border-bottom: 1px solid #e8eef5;">${fileSize}</td>
            </tr>
            <tr>
              <td style="padding: 10px 16px; font-size: 12px; color: #6a7f95; font-weight: bold;">UPLOADED</td>
              <td style="padding: 10px 16px; font-size: 13px; color: #1a2d45;">${uploadedAt}</td>
            </tr>
          </table>
          <p style="color: #7a8fa5; font-size: 12px; margin: 24px 0 0; border-top: 1px solid #e8eef5; padding-top: 16px;">
            This email was sent from Poseidon IMS Coordinator Workspace.
          </p>
        </div>
      `,
            attachments: [
                {
                    filename: fileName,
                    content: fileBuffer,
                    contentType: mimeType,
                },
            ],
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send email error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send email." }, { status: 500 });
    }
}