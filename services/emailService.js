import nodemailer from "nodemailer";

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

/**
 * Send an enquiry notification email via Nodemailer when SMTP is configured.
 * Silently no-ops if SMTP environment variables are not set so enquiry persistence never fails.
 */
export async function sendEnquiryEmail(enquiry) {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "SMTP not configured" };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const recipient = enquiry.recipient || process.env.CONTACT_EMAIL || "connect@trinexsystems.in";
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"Trinex Systems Portal" <${fromAddress}>`,
    to: recipient,
    replyTo: enquiry.email,
    subject: `Technical Enquiry from ${enquiry.name}${enquiry.company ? ` (${enquiry.company})` : ""}`,
    text: [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || "Not specified"}`,
      `Company: ${enquiry.company || "Not specified"}`,
      `Source: ${enquiry.source || "web-portal"}`,
      "",
      "Message:",
      enquiry.message,
    ].join("\n"),
  });

  return { sent: true, recipient };
}
