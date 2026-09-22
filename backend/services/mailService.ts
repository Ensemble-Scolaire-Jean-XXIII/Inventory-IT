import fs from "fs";
import path from "path";
import { transporter, isMailConfigured } from "../config/mail";

const generateHtmlEmail = (title: string, content: string) => {
  const formattedContent = content
    ? content.replace(/\r\n/g, "\n").replace(/\n/g, "<br>")
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #0f172a;">
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1e293b; padding: 30px; border-top: 4px solid #e84e1b; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);">
        <h2 style="color: #f8fafc; border-bottom: 2px solid #334155; padding-bottom: 10px; font-weight: 600; margin-top: 0;">${title}</h2>
        <div style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #cbd5e1;">
          ${formattedContent}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155;">
          <p style="margin-top: 12px; font-size: 11px; color: #64748b; text-align: center; font-style: italic;">Merci de ne pas répondre à cet email : cette adresse est dédiée à l'envoi automatique et n'est pas surveillée.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  htmlContent?: string,
): Promise<boolean> => {
  if (!isMailConfigured || !transporter) {
    console.warn(
      `[mail] SMTP non configuré — email « ${subject} » non envoyé à ${to}.`,
    );
    return false;
  }

  try {
    const finalHtml = generateHtmlEmail(subject, htmlContent || text);
    const signaturePath = path.join(process.cwd(), "public", "signature.png");
    const attachments = fs.existsSync(signaturePath)
      ? [
          {
            filename: "signature.png",
            path: signaturePath,
            cid: "signature",
            contentDisposition: "inline" as const,
          },
        ]
      : [];

    await transporter.sendMail({
      from: `"Ensemble Scolaire Jean 23 | NO REPLY" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: finalHtml,
      ...(attachments.length ? { attachments } : {}),
    });
    return true;
  } catch (error) {
    console.error("[mail] Erreur d'envoi:", error);
    throw new Error("Impossible d'envoyer l'email");
  }
};