import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type FileItem = {
  fileName: string;
  fileUrl: string;
  crewName: string;
  fileSize: string;
};

type EmailPayload = {
  to: string | string[];   // ✅ supports multiple recipients
  message?: string;
  files: FileItem[];        // ✅ supports multiple files
};

function buildEmailHtml(files: FileItem[], message?: string): string {
  const fileRows = files
    .map(
      (f) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8eef5;">
          <strong style="color:#102a43;font-size:13px;">${f.fileName}</strong><br/>
          <span style="color:#6a85a0;font-size:11px;">${f.crewName} · ${f.fileSize}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8eef5;text-align:right;">
          <a href="${f.fileUrl}"
             style="background:#1a6bbf;color:#fff;padding:6px 14px;border-radius:6px;
                    text-decoration:none;font-size:12px;font-weight:700;">
            Open File
          </a>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f6f9fc;padding:24px;border-radius:12px;">
      <div style="background:#0f2742;padding:20px 24px;border-radius:10px 10px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:18px;">📄 Crew Documents</h2>
        <p style="color:#a0b8d0;margin:4px 0 0;font-size:13px;">Poseidon IMS – Crewing Coordinator</p>
      </div>

      <div style="background:#fff;padding:20px 24px;border:1px solid #dbe5f0;border-top:none;">
        ${message ? `<p style="color:#102a43;font-size:14px;margin:0 0 16px;">${message}</p>` : ""}

        <p style="color:#5a6f86;font-size:13px;margin:0 0 12px;">
          ${files.length} document${files.length > 1 ? "s have" : " has"} been shared with you:
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid #e3ebf4;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f5f8fc;">
              <th style="text-align:left;padding:10px 12px;font-size:11px;color:#6c7e91;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e3ebf4;">
                File
              </th>
              <th style="padding:10px 12px;border-bottom:1px solid #e3ebf4;"></th>
            </tr>
          </thead>
          <tbody>${fileRows}</tbody>
        </table>

        <p style="color:#9aa8b6;font-size:11px;margin:16px 0 0;">
          Sent via Poseidon IMS Crew Documents System
        </p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { to, message, files }: EmailPayload = await req.json();

    if (!to || !files || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: to, files" },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: "Gmail credentials not configured in environment variables." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // ✅ Support multiple recipients
    const recipients = Array.isArray(to) ? to.join(", ") : to;

    await transporter.sendMail({
      from: `"Poseidon IMS" <${gmailUser}>`,
      to: recipients,
      subject: `Crew Documents Shared (${files.length} file${files.length > 1 ? "s" : ""})`,
      html: buildEmailHtml(files, message),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email." },
      { status: 500 }
    );
  }
}