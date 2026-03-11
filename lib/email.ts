import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM     = process.env.EMAIL_FROM ?? "Ruya Services <noreply@mail.ruya.services>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://ruya.services";
// During development/testing with Resend free tier, set DEV_EMAIL_TO to your
// Resend account email to receive all notifications regardless of recipient.
const resolveRecipient = (actual: string) =>
  process.env.DEV_EMAIL_TO ?? actual;

const logEmailAttempt = (name: string, actualTo: string, subject: string) => {
  const resolvedTo = resolveRecipient(actualTo);
  console.log(`[email] ${name} sending`, {
    from: FROM,
    to: resolvedTo,
    intendedTo: actualTo,
    recipientOverridden: resolvedTo !== actualTo,
    subject,
  });
};

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

// ─── Order status timeline helper ────────────────────────────────────────────

const ORDER_STAGES = [
  { key: "CONFIRMED",       label: "Confirmed"   },
  { key: "PAYMENT_PENDING", label: "Payment"     },
  { key: "PAID",            label: "Paid"        },
  { key: "IN_PRODUCTION",   label: "Production"  },
  { key: "SHIPPED",         label: "Shipped"     },
  { key: "DELIVERED",       label: "Delivered"   },
];

const orderTimeline = (currentStatus: string): string => {
  const currentIdx = ORDER_STAGES.findIndex((s) => s.key === currentStatus);
  const cells = ORDER_STAGES.map((stage, idx) => {
    const isDone    = idx < currentIdx;
    const isCurrent = idx === currentIdx;
    const bg        = isDone ? "#16a34a" : isCurrent ? "#c9a84c" : "#e5e7eb";
    const color     = isDone ? "#16a34a" : isCurrent ? "#b8860b" : "#9ca3af";
    const mark      = isDone ? "&#10003;" : isCurrent ? "&#9679;" : "";
    const fw        = isCurrent ? "700" : "400";
    return `
      <td align="center" style="width:${100 / ORDER_STAGES.length}%;padding:0 2px;vertical-align:top;">
        <div style="width:30px;height:30px;border-radius:50%;background:${bg};margin:0 auto;
                    text-align:center;line-height:30px;font-size:12px;color:#fff;font-weight:700;">${mark}</div>
        <p style="margin:5px 0 0;font-size:9px;color:${color};font-weight:${fw};
                  text-align:center;line-height:1.3;">${stage.label}</p>
      </td>`;
  }).join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>${cells}</tr>
    </table>`;
};

const STATUS_META: Record<string, { label: string; color: string; message: string }> = {
  CONFIRMED:       { label: "Confirmed",       color: "#0f2044", message: "Your order has been confirmed and is being processed." },
  PAYMENT_PENDING: { label: "Payment Pending", color: "#d97706", message: "Please arrange payment to proceed. Once received, we&rsquo;ll start immediately." },
  PAID:            { label: "Payment Confirmed", color: "#16a34a", message: "Payment confirmed &mdash; your order is now being processed." },
  IN_PRODUCTION:   { label: "In Production",  color: "#7c3aed", message: "Your products are now being manufactured. We&rsquo;ll notify you once shipped." },
  SHIPPED:         { label: "Shipped",         color: "#2563eb", message: "Your order is on its way! Track your shipment using the details below." },
  DELIVERED:       { label: "Delivered",       color: "#16a34a", message: "Your order has been delivered. Thank you for choosing RUYA!" },
};

// ─── 1. Agent picks up a request ─────────────────────────────────────────────

export async function sendNewRequestEmail(
  agentEmail: string,
  agentName: string,
  productName: string,
  requestId: string,
  clientName: string
) {
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${BASE_URL}/agent/requests/${requestId}`;
  const subject = `New request assigned: ${productName}`;

  try {
  logEmailAttempt("sendNewRequestEmail", agentEmail, subject);
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject,
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
  agentName: string,
  isRevision = false
) {
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${BASE_URL}/client/requests/${requestId}`;
  const subject = isRevision
    ? `Your revised quotation is ready: ${productName}`
    : `Your quotation is ready: ${productName}`;
  const heading = isRevision ? "Your revised quotation is ready" : "Your quotation is ready";
  const body = isRevision
    ? `<strong>${agentName}</strong> has submitted a revised quotation for your sourcing request based on your feedback. Review the updated pricing and details.`
    : `Great news! <strong>${agentName}</strong> has submitted a quotation for your sourcing request. Review the pricing, lead time, and supplier details, then accept, request a revision, or reject.`;

  try {
  logEmailAttempt("sendQuotationReceivedEmail", clientEmail, subject);
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(clientEmail),
    subject,
    html: base(`
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${clientName} 👋</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">${heading}</h2>
      ${badge(isRevision ? "Revised Quotation" : "Quotation Received", "#c9a84c")}
      <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">${body}</p>
      <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:8px;">
        <tbody>
          ${infoRow("Product", productName)}
          ${infoRow("Agent", agentName)}
          ${infoRow("Request ID", `#${requestId.slice(-10).toUpperCase()}`)}
        </tbody>
      </table>
      ${btn(isRevision ? "Review Revised Quotation →" : "Review Quotation →", link)}
    `),
  });
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
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${BASE_URL}/agent/requests/${requestId}`;
  const subject = `Quotation accepted: ${productName}`;

  try {
  logEmailAttempt("sendQuotationAcceptedEmail", agentEmail, subject);
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject,
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
  } catch (error) {
    console.error("[email] sendQuotationAcceptedEmail error:", error);
  }
}

// ─── 5. Order status update → notify client ──────────────────────────────────

export async function sendOrderStatusUpdateEmail(
  clientEmail: string,
  clientName: string,
  productName: string,
  newStatus: string,
  orderId: string,
  trackingNumber?: string | null
) {
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const meta   = STATUS_META[newStatus] ?? { label: newStatus.replace(/_/g, " "), color: "#0f2044", message: "Your order status has been updated." };
  const link   = `${BASE_URL}/client/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();
  const subject = `Order #${shortId} update: ${meta.label}`;

  const trackingBlock = (newStatus === "SHIPPED" || newStatus === "DELIVERED") && trackingNumber
    ? `<div style="margin:16px 0;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</p>
        <p style="margin:0;font-size:15px;font-family:monospace;font-weight:700;color:#1e40af;">${trackingNumber}</p>
      </div>`
    : "";

  try {
    logEmailAttempt("sendOrderStatusUpdateEmail", clientEmail, subject);
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(clientEmail),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${clientName} 👋</p>
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">Your order has been updated</h2>
        ${badge(meta.label, meta.color)}
        <p style="margin:16px 0 4px;font-size:14px;color:#374151;line-height:1.6;">${meta.message}</p>
        ${trackingBlock}
        ${orderTimeline(newStatus)}
        <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-top:8px;">
          <tbody>
            ${infoRow("Order ID", `#${shortId}`)}
            ${infoRow("Product", productName)}
            ${infoRow("New Status", meta.label)}
          </tbody>
        </table>
        ${btn("Track Your Order →", link)}
      `),
    });
  } catch (error) {
    console.error("[email] sendOrderStatusUpdateEmail error:", error);
  }
}

// ─── 0. Email verification ────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationLink: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }
  const subject = "Verify your RUYA account";
  try {
    logEmailAttempt("sendVerificationEmail", email, subject);
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(email),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${name} 👋</p>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f2044;">Verify your email address</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
          Thanks for joining RUYA! Please confirm your email address to activate your account and access the platform.
        </p>
        ${btn("Verify Email →", verificationLink)}
        <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
          This link expires in <strong>24 hours</strong>. If you didn't create a RUYA account, you can safely ignore this email.
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span style="color:#6b7280;word-break:break-all;">${verificationLink}</span>
        </p>
      `),
    });
  } catch (error) {
    console.error("[email] sendVerificationEmail error:", error);
  }
}

// ─── 6. Order status update → internal admin alert ───────────────────────────

export async function sendOrderStatusAdminAlert(
  productName: string,
  newStatus: string,
  orderId: string,
  clientName: string,
  agentName: string
) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log("[email] ADMIN_EMAIL not set — skipping admin alert");
    return;
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const meta    = STATUS_META[newStatus] ?? { label: newStatus.replace(/_/g, " "), color: "#0f2044" };
  const link    = `${BASE_URL}/agent/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();
  const subject = `[Admin] Order #${shortId} → ${meta.label}`;

  try {
    logEmailAttempt("sendOrderStatusAdminAlert", adminEmail, subject);
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(adminEmail),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Internal alert</p>
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f2044;">Order Status Changed</h2>
        ${badge(meta.label, meta.color)}
        <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-top:20px;">
          <tbody>
            ${infoRow("Order ID",   `#${shortId}`)}
            ${infoRow("Product",    productName)}
            ${infoRow("New Status", meta.label)}
            ${infoRow("Client",     clientName)}
            ${infoRow("Agent",      agentName)}
          </tbody>
        </table>
        ${btn("View Order →", link)}
      `),
    });
  } catch (error) {
    console.error("[email] sendOrderStatusAdminAlert error:", error);
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
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${BASE_URL}/agent/requests/${requestId}`;
  const subject = `Revision requested: ${productName}`;

  try {
  logEmailAttempt("sendRevisionRequestedEmail", agentEmail, subject);
  const result = await resend.emails.send({
    from: FROM,
    to: resolveRecipient(agentEmail),
    subject,
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
  } catch (error) {
    console.error("[email] sendRevisionRequestedEmail error:", error);
  }
}

// ─── 7. Payment receipt submitted → admin ────────────────────────────────────

export async function sendPaymentReceiptNotification(
  adminEmail: string,
  clientName: string,
  productName: string,
  orderId: string
) {
  if (!process.env.RESEND_API_KEY) return;
  const link = `${BASE_URL}/admin/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();
  const subject = `Payment receipt submitted: Order #${shortId}`;
  try {
    logEmailAttempt("sendPaymentReceiptNotification", adminEmail, subject);
    await resend.emails.send({
      from: FROM,
      to: resolveRecipient(adminEmail),
      subject,
      html: base(`
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f2044;">Payment receipt submitted</h2>
        ${badge("Awaiting Review", "#d97706")}
        <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
          <strong>${clientName}</strong> has uploaded a payment receipt for their order of <strong>${productName}</strong>.
          Please review the receipt and confirm or reject the payment.
        </p>
        <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:20px;">
          <tbody>
            ${infoRow("Client", clientName)}
            ${infoRow("Product", productName)}
            ${infoRow("Order ID", `#${shortId}`)}
          </tbody>
        </table>
        ${btn("Review Payment →", link)}
      `),
    });
  } catch (e) {
    console.error("[email] sendPaymentReceiptNotification error:", e);
  }
}

// ─── 8. Payment rejected → client ────────────────────────────────────────────

export async function sendPaymentRejectedEmail(
  clientEmail: string,
  clientName: string,
  productName: string,
  orderId: string,
  reason: string
) {
  if (!process.env.RESEND_API_KEY) return;
  const link = `${BASE_URL}/client/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();
  const subject = `Action required: Payment receipt rejected — Order #${shortId}`;
  try {
    logEmailAttempt("sendPaymentRejectedEmail", clientEmail, subject);
    await resend.emails.send({
      from: FROM,
      to: resolveRecipient(clientEmail),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${clientName} 👋</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f2044;">Payment receipt rejected</h2>
        ${badge("Action Required", "#dc2626")}
        <p style="margin:16px 0 8px;font-size:14px;color:#374151;line-height:1.6;">
          Your payment receipt for <strong>${productName}</strong> could not be verified. Please upload a new receipt.
        </p>
        <div style="margin:16px 0;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
          <p style="margin:0;font-size:14px;color:#374151;">${reason}</p>
        </div>
        ${btn("Resubmit Receipt →", link)}
      `),
    });
  } catch (e) {
    console.error("[email] sendPaymentRejectedEmail error:", e);
  }
}

// ─── 9. Invoice / payment confirmed → client ──────────────────────────────────

export async function sendInvoiceEmail(
  clientEmail: string,
  clientName: string,
  productName: string,
  orderId: string,
  invoiceBuffer: Buffer
) {
  if (!process.env.RESEND_API_KEY) return;
  const link = `${BASE_URL}/client/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();
  const subject = `Payment confirmed — Invoice for Order #${shortId}`;
  try {
    logEmailAttempt("sendInvoiceEmail", clientEmail, subject);
    await resend.emails.send({
      from: FROM,
      to: resolveRecipient(clientEmail),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${clientName} 👋</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f2044;">Payment confirmed!</h2>
        ${badge("Paid", "#16a34a")}
        <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
          Your payment for <strong>${productName}</strong> has been confirmed. Your invoice is attached to this email.
          Your order will now move to production.
        </p>
        <table cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;width:100%;margin-bottom:20px;">
          <tbody>
            ${infoRow("Order ID", `#${shortId}`)}
            ${infoRow("Product", productName)}
            ${infoRow("Next step", "Order is now in production")}
          </tbody>
        </table>
        ${btn("Track Your Order →", link)}
      `),
      attachments: [
        {
          filename: `RUYA-Invoice-${shortId}.pdf`,
          content: invoiceBuffer,
        },
      ],
    });
  } catch (e) {
    console.error("[email] sendInvoiceEmail error:", e);
  }
}

// ─── 10. Agent welcome email ──────────────────────────────────────────────────

export async function sendAgentWelcomeEmail(
  agentEmail: string,
  agentName: string,
  tempPassword: string
) {
  if (!process.env.RESEND_API_KEY) return;
  const subject = "Welcome to RUYA — Your agent account is ready";
  try {
    logEmailAttempt("sendAgentWelcomeEmail", agentEmail, subject);
    await resend.emails.send({
      from: FROM,
      to: resolveRecipient(agentEmail),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${agentName} 👋</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f2044;">Welcome to RUYA</h2>
        ${badge("Agent Account Created", "#7c3aed")}
        <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
          An agent account has been created for you on the RUYA Global Sourcing Platform.
          Use the credentials below to sign in and start managing sourcing requests.
        </p>
        <div style="margin:0 0 20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Your Login Credentials</p>
          ${infoRow("Email", agentEmail)}
          ${infoRow("Temporary Password", tempPassword)}
        </div>
        <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
          Please change your password after your first login.
        </p>
        ${btn("Sign In to RUYA →", `${BASE_URL}/auth/login`)}
      `),
    });
  } catch (e) {
    console.error("[email] sendAgentWelcomeEmail error:", e);
  }
}

// ─── 7. Role changed notification ─────────────────────────────────────────────

export async function sendRoleChangedEmail(
  email: string,
  name: string,
  fromRole: string,
  toRole: string
) {
  const portalPath = toRole === "AGENT" ? "/agent/dashboard" : "/client/dashboard";
  const roleBadgeColor = toRole === "AGENT" ? "#7c3aed" : "#059669";
  const subject = `Your RUYA account role has been updated to ${toRole}`;
  try {
    logEmailAttempt("sendRoleChangedEmail", email, subject);
    await resend.emails.send({
      from: FROM,
      to: resolveRecipient(email),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${name} 👋</p>
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f2044;">Your role has been updated</h2>
        ${badge(`Role: ${fromRole} → ${toRole}`, roleBadgeColor)}
        <p style="margin:16px 0 20px;font-size:14px;color:#374151;line-height:1.6;">
          An administrator has updated your role on the RUYA platform from
          <strong>${fromRole}</strong> to <strong>${toRole}</strong>.
          Your dashboard and available features have been updated accordingly.
        </p>
        ${btn("Go to Your Dashboard →", `${BASE_URL}${portalPath}`)}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
          If you believe this was done in error, please contact support@ruya-sourcing.com.
        </p>
      `),
    });
  } catch (e) {
    console.error("[email] sendRoleChangedEmail error:", e);
  }
}

// ─── 8. Password reset ────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetLink: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }
  const subject = "Reset your RUYA password";
  try {
    logEmailAttempt("sendPasswordResetEmail", email, subject);
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(email),
      subject,
      html: base(`
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Hello, ${name} 👋</p>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f2044;">Reset your password</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
          We received a request to reset the password for your RUYA account. Click the button below to choose a new password.
        </p>
        ${btn("Reset Password →", resetLink)}
        <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <span style="color:#6b7280;word-break:break-all;">${resetLink}</span>
        </p>
      `),
    });
  } catch (error) {
    console.error("[email] sendPasswordResetEmail error:", error);
  }
}
