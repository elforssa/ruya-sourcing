import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "RUYA Platform <onboarding@resend.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// During development/testing with Resend free tier, set DEV_EMAIL_TO to your
// Resend account email to receive all notifications regardless of recipient.
const resolveRecipient = (actual: string) =>
  process.env.DEV_EMAIL_TO ?? actual;

// ─── Shared styles ───────────────────────────────────────────────────────────

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RUYA</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2044 0%,#1a3a6e 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;border:2px solid #c9a84c;border-radius:8px;padding:6px 18px;">
                <span style="font-size:22px;font-weight:800;letter-spacing:3px;color:#c9a84c;">RUYA</span>
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:#8aa3cc;letter-spacing:1px;text-transform:uppercase;">Global Sourcing Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;border-top:1px solid #eaecf0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from RUYA Sourcing Platform.<br />
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const badge = (text: string, color = "#0f2044") =>
  `<span style="display:inline-block;background:${color};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:4px 12px;border-radius:20px;text-transform:uppercase;">${text}</span>`;

const btn = (text: string, href: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;background:#c9a84c;color:#0f2044;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">${text}</a>`;

const infoRow = (label: string, value: string) =>
  `<tr>
    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:140px;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;

// ─── 1. Agent picks up a request ─────────────────────────────────────────────

export async function sendNewRequestEmail(
  agentEmail: string,
  agentName: string,
  productName: string,
  requestId: string,
  clientName: string
) {
  console.log("[email] sendNewRequestEmail called", { agentEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${APP_URL}/agent/requests/${requestId}`;

  try {
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject: `New request assigned: ${productName}`,
    html: base(`
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${agentName} 👋</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">You have a new request</h2>
      ${badge("New Assignment", "#0f2044")}
      <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        A client has submitted a sourcing request and it's now in your queue. Review the details and submit your quotation.
      </p>
      <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
        <tbody>
          ${infoRow("Product", productName)}
          ${infoRow("Client", clientName)}
          ${infoRow("Request ID", `#${requestId.slice(-10).toUpperCase()}`)}
        </tbody>
      </table>
      ${btn("View Request →", link)}
    `),
  });
  console.log("[email] sendNewRequestEmail sent:", result);
  } catch (error) {
    console.error("[email] sendNewRequestEmail error:", error);
  }
}

// ─── 2. Agent sends quotation → notify client ─────────────────────────────────

export async function sendQuotationReceivedEmail(
  clientEmail: string,
  clientName: string,
  productName: string,
  requestId: string,
  agentName: string
) {
  console.log("[email] sendQuotationReceivedEmail called", { clientEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${APP_URL}/client/requests/${requestId}`;

  try {
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(clientEmail),
    subject: `Your quotation is ready: ${productName}`,
    html: base(`
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${clientName} 👋</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">Your quotation is ready</h2>
      ${badge("Quotation Received", "#c9a84c")}
      <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        Great news! <strong>${agentName}</strong> has submitted a quotation for your sourcing request.
        Review the pricing, lead time, and supplier details, then accept, request a revision, or reject.
      </p>
      <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
        <tbody>
          ${infoRow("Product", productName)}
          ${infoRow("Agent", agentName)}
          ${infoRow("Request ID", `#${requestId.slice(-10).toUpperCase()}`)}
        </tbody>
      </table>
      ${btn("Review Quotation →", link)}
    `),
  });
  console.log("[email] sendQuotationReceivedEmail sent:", result);
  } catch (error) {
    console.error("[email] sendQuotationReceivedEmail error:", error);
  }
}

// ─── 3. Client accepts quotation → notify agent ───────────────────────────────

export async function sendQuotationAcceptedEmail(
  agentEmail: string,
  agentName: string,
  clientName: string,
  productName: string,
  requestId: string
) {
  console.log("[email] sendQuotationAcceptedEmail called", { agentEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${APP_URL}/agent/requests/${requestId}`;

  try {
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject: `Quotation accepted: ${productName}`,
    html: base(`
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${agentName} 👋</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">Quotation accepted!</h2>
      ${badge("Accepted", "#16a34a")}
      <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        <strong>${clientName}</strong> has accepted your quotation for <strong>${productName}</strong>.
        An order has been created automatically. Proceed with the sourcing process.
      </p>
      <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
        <tbody>
          ${infoRow("Product", productName)}
          ${infoRow("Client", clientName)}
          ${infoRow("Request ID", `#${requestId.slice(-10).toUpperCase()}`)}
          ${infoRow("Next step", "Process the order")}
        </tbody>
      </table>
      ${btn("View Request →", link)}
    `),
  });
  console.log("[email] sendQuotationAcceptedEmail sent:", result);
  } catch (error) {
    console.error("[email] sendQuotationAcceptedEmail error:", error);
  }
}

// ─── 4. Client requests revision → notify agent ───────────────────────────────

export async function sendRevisionRequestedEmail(
  agentEmail: string,
  agentName: string,
  clientName: string,
  productName: string,
  requestId: string,
  revisionNote: string
) {
  console.log("[email] sendRevisionRequestedEmail called", { agentEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${APP_URL}/agent/requests/${requestId}`;

  try {
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject: `Revision requested: ${productName}`,
    html: base(`
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${agentName} 👋</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">Revision requested</h2>
      ${badge("Revision Requested", "#d97706")}
      <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        <strong>${clientName}</strong> has requested a revision on your quotation for <strong>${productName}</strong>.
        Please review their feedback and submit an updated quotation.
      </p>
      <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
        <tbody>
          ${infoRow("Product", productName)}
          ${infoRow("Client", clientName)}
          ${infoRow("Request ID", `#${requestId.slice(-10).toUpperCase()}`)}
        </tbody>
      </table>
      ${revisionNote ? `
        <div style="margin:20px 0;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">Client's feedback</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${revisionNote.replace(/\[Revision requested\]\s*/i, "")}</p>
        </div>
      ` : ""}
      ${btn("Submit Revised Quotation →", link)}
    `),
  });
  console.log("[email] sendRevisionRequestedEmail sent:", result);
  } catch (error) {
    console.error("[email] sendRevisionRequestedEmail error:", error);
  }
}
