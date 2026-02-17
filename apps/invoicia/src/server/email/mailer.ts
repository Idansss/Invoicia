import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/server/env";

const globalForMailer = globalThis as unknown as { transporter?: nodemailer.Transporter };

export const transporter =
  globalForMailer.transporter ??
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

if (process.env.NODE_ENV !== "production") globalForMailer.transporter = transporter;

export async function sendEmail(params: {
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}) {
  const html = await render(params.react);
  const text = await render(params.react, { plainText: true });
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: params.to,
      subject: params.subject,
      html,
      text,
      attachments: params.attachments,
    });
  } catch (err) {
    // Dev fallback: if SMTP isn't running (e.g., Docker not available), write the email to disk.
    // This keeps the MVP flow testable without a local SMTP sink.
    const safeTo = params.to.replaceAll(/[^a-zA-Z0-9@._-]+/g, "_");
    const ts = new Date().toISOString().replaceAll(":", "-");
    const outDir = path.join(env.STORAGE_DIR, "emails", `${ts}-${safeTo}`);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "subject.txt"), params.subject, "utf8");
    await fs.writeFile(path.join(outDir, "body.html"), html, "utf8");
    await fs.writeFile(path.join(outDir, "body.txt"), text, "utf8");
    await fs.writeFile(
      path.join(outDir, "meta.json"),
      JSON.stringify(
        {
          from: env.SMTP_FROM,
          to: params.to,
          subject: params.subject,
          error: err instanceof Error ? err.message : String(err),
        },
        null,
        2,
      ),
      "utf8",
    );
    for (const a of params.attachments ?? []) {
      await fs.writeFile(path.join(outDir, a.filename), a.content);
    }
  }
}
