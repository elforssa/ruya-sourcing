import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "RUYA Platform <onboarding@resend.dev>";
const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

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
  console.log("[email] sendNewRequestEmail called", { agentEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${baseUrl}/agent/requests/${requestId}`;

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

  const link = `${baseUrl}/client/requests/${requestId}`;

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

  const link = `${baseUrl}/agent/requests/${requestId}`;

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

// ─── 5. Order status update → notify client ──────────────────────────────────

export async function sendOrderStatusUpdateEmail(
  clientEmail: string,
  clientName: string,
  productName: string,
  newStatus: string,
  orderId: string,
  trackingNumber?: string | null
) {
  console.log("[email] sendOrderStatusUpdateEmail called", { clientEmail, productName, orderId, newStatus });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const meta   = STATUS_META[newStatus] ?? { label: newStatus.replace(/_/g, " "), color: "#0f2044", message: "Your order status has been updated." };
  const link   = `${baseUrl}/client/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();

  const trackingBlock = (newStatus === "SHIPPED" || newStatus === "DELIVERED") && trackingNumber
    ? `<div style="margin:16px 0;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</p>
        <p style="margin:0;font-size:15px;font-family:monospace;font-weight:700;color:#1e40af;">${trackingNumber}</p>
      </div>`
    : "";

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(clientEmail),
      subject: `Order #${shortId} update: ${meta.label}`,
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
    console.log("[email] sendOrderStatusUpdateEmail sent:", result);
  } catch (error) {
    console.error("[email] sendOrderStatusUpdateEmail error:", error);
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
  console.log("[email] sendOrderStatusAdminAlert called", { orderId, newStatus });
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const meta    = STATUS_META[newStatus] ?? { label: newStatus.replace(/_/g, " "), color: "#0f2044" };
  const link    = `${baseUrl}/agent/orders/${orderId}`;
  const shortId = orderId.slice(-8).toUpperCase();

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: resolveRecipient(adminEmail),
      subject: `[Admin] Order #${shortId} → ${meta.label}`,
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
    console.log("[email] sendOrderStatusAdminAlert sent:", result);
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
  console.log("[email] sendRevisionRequestedEmail called", { agentEmail, productName, requestId });
  console.log("[email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is missing — skipping email");
    return;
  }

  const link = `${baseUrl}/agent/requests/${requestId}`;

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
