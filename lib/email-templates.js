"use strict";

/**
 * Branded transactional emails for LeatherCulture.
 *
 * Everything is table-based with inline styles, because Gmail, Outlook and the
 * Pakistani webmail clients strip <style> blocks and ignore flexbox. The palette
 * matches the storefront: black, white, and the same warm grey we use for muted text.
 */

const THEME = {
  ink: "#000000",
  body: "#3d3d3d",
  muted: "#7a7a7a",
  line: "#e6e6e6",
  panel: "#f7f7f7",
  canvas: "#f2f2f2",
  accent: "#000000",
  onAccent: "#ffffff",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount, currency) {
  const n = Math.round(Number(amount) || 0);
  return `${currency || "Rs"} ${n.toLocaleString("en-PK")}`;
}

function shortDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------- building blocks ---------- */

function button(label, href, theme = THEME) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
  <tr><td align="center" bgcolor="${theme.accent}" style="border-radius:999px">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 32px;font-family:${theme.font};font-size:15px;font-weight:600;line-height:1;color:${theme.onAccent};text-decoration:none;border-radius:999px">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}

function paragraph(text, theme = THEME) {
  return `<p style="margin:0 0 16px;font-family:${theme.font};font-size:15px;line-height:1.65;color:${theme.body}">${text}</p>`;
}

function orderLines(order, theme = THEME) {
  const currency = order.currency || "Rs";
  const rows = (order.items || [])
    .map((item) => {
      const variant = item.variantName ? `<br><span style="font-size:13px;color:${theme.muted}">${escapeHtml(item.variantName)}</span>` : "";
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${theme.line};font-family:${theme.font};font-size:15px;color:${theme.ink}">
          ${escapeHtml(item.name)}${variant}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${theme.line};font-family:${theme.font};font-size:15px;color:${theme.muted};text-align:center;white-space:nowrap">x ${Number(item.qty) || 1}</td>
        <td style="padding:14px 0;border-bottom:1px solid ${theme.line};font-family:${theme.font};font-size:15px;color:${theme.ink};text-align:right;white-space:nowrap">${money(item.lineTotal, currency)}</td>
      </tr>`;
    })
    .join("");

  const totalRow = (label, value, strong) => `<tr>
    <td colspan="2" style="padding:${strong ? "14px 0 0" : "10px 0 0"};font-family:${theme.font};font-size:${strong ? "16px" : "14px"};color:${strong ? theme.ink : theme.muted};${strong ? "font-weight:700" : ""}">${escapeHtml(label)}</td>
    <td style="padding:${strong ? "14px 0 0" : "10px 0 0"};font-family:${theme.font};font-size:${strong ? "16px" : "14px"};color:${strong ? theme.ink : theme.muted};text-align:right;white-space:nowrap;${strong ? "font-weight:700" : ""}">${escapeHtml(value)}</td>
  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
    ${rows}
    ${totalRow("Subtotal", money(order.subtotal, currency))}
    ${totalRow("Delivery", order.shipping ? money(order.shipping, currency) : "Free")}
    ${totalRow("Total to pay on delivery", money(order.total, currency), true)}
  </table>`;
}

function detailPanel(rows, theme = THEME) {
  const body = rows
    .filter((row) => row && row[1])
    .map(
      ([label, value]) => `<tr>
        <td style="padding:4px 0;font-family:${theme.font};font-size:13px;color:${theme.muted};width:110px;vertical-align:top">${escapeHtml(label)}</td>
        <td style="padding:4px 0;font-family:${theme.font};font-size:14px;color:${theme.ink};vertical-align:top">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${theme.panel};border-radius:14px;padding:18px 20px;margin:0 0 20px">
    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table></td></tr>
  </table>`;
}

/* ---------- layout ---------- */

function layout(brand, { preheader, heading, kicker, content, footerNote }) {
  const theme = THEME;
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" width="168" alt="${escapeHtml(brand.name)}" style="display:block;border:0;width:168px;max-width:168px;height:auto">`
    : `<div style="font-family:${theme.font};font-size:22px;font-weight:700;letter-spacing:-0.4px;color:${theme.ink}">${escapeHtml(brand.name)}</div>`;

  const social = (brand.socials || [])
    .filter((item) => item.href)
    .map(
      (item) =>
        `<a href="${escapeHtml(item.href)}" style="font-family:${theme.font};font-size:12px;color:${theme.muted};text-decoration:none;padding:0 8px">${escapeHtml(item.label)}</a>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${theme.canvas};-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;color:${theme.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${theme.canvas}">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">

      <tr><td align="center" style="padding:8px 0 28px">
        <a href="${escapeHtml(brand.siteUrl)}" style="text-decoration:none">${logo}</a>
      </td></tr>

      <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px">
        ${kicker ? `<div style="font-family:${theme.font};font-size:12px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:${theme.muted};margin:0 0 10px">${escapeHtml(kicker)}</div>` : ""}
        <h1 style="margin:0 0 20px;font-family:${theme.font};font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.5px;color:${theme.ink}">${escapeHtml(heading)}</h1>
        ${content}
      </td></tr>

      <tr><td style="padding:26px 24px 8px" align="center">
        ${footerNote ? `<p style="margin:0 0 14px;font-family:${theme.font};font-size:13px;line-height:1.6;color:${theme.muted}">${footerNote}</p>` : ""}
        ${social ? `<div style="margin:0 0 14px">${social}</div>` : ""}
        <p style="margin:0 0 6px;font-family:${theme.font};font-size:12px;line-height:1.7;color:${theme.muted}">
          ${escapeHtml(brand.name)}${brand.tagline ? ` &middot; ${escapeHtml(brand.tagline)}` : ""}<br>
          ${brand.supportEmail ? `<a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${theme.muted};text-decoration:underline">${escapeHtml(brand.supportEmail)}</a>` : ""}
          ${brand.phone ? ` &middot; ${escapeHtml(brand.phone)}` : ""}
        </p>
        <p style="margin:0;font-family:${theme.font};font-size:11px;color:#a5a5a5">
          You are receiving this because you placed an order at
          <a href="${escapeHtml(brand.siteUrl)}" style="color:#a5a5a5">${escapeHtml(brand.siteHost)}</a>.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ---------- plain-text fallback ---------- */

function toText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|tr|h1|h2|div|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&middot;/g, "-")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ---------- the templates ---------- */

/**
 * Each template returns { subject, html, text }.
 * `copy` holds the admin-editable strings for this template; every field falls
 * back to the default below, so a blank box in the admin never sends a blank email.
 */

const DEFAULT_COPY = {
  order_confirmation: {
    subject: "Order {{id}} confirmed - {{brand}}",
    heading: "Thanks for your order, {{firstName}}",
    intro:
      "We have received your order and our team is preparing it now. You pay in cash when the parcel reaches you, and you are welcome to check the pieces before paying the courier.",
    outro: "We will email you again as soon as it is on its way. Any questions, just reply to this email.",
  },
  order_shipped: {
    subject: "Your order {{id}} is on its way",
    heading: "{{firstName}}, your order has been dispatched",
    intro: "Your parcel has left our workshop and is with the courier now. Please keep the cash on delivery amount ready.",
    outro: "You can open the parcel and check your order before you pay the courier.",
  },
  order_delivered: {
    subject: "Your {{brand}} order has been delivered",
    heading: "Enjoy your new pieces, {{firstName}}",
    intro: "Your order has been marked as delivered. Thank you for shopping with us.",
    outro: "If anything is not right, reply to this email within 7 days and we will sort out an exchange.",
  },
  order_review: {
    subject: "How did we do, {{firstName}}?",
    heading: "Would you leave us a quick review?",
    intro:
      "You received your order a few days ago, so you have had a chance to wear it. A short, honest review helps other customers in Pakistan decide, and it helps us get better.",
    outro: "It takes about a minute, and we read every single one.",
  },
  order_cancelled: {
    subject: "Your order {{id}} has been cancelled",
    heading: "Your order has been cancelled",
    intro: "We have cancelled this order, so there is nothing to pay. No amount was charged, since all our orders are cash on delivery.",
    outro: "If this was a mistake, reply to this email and we will place it again for you.",
  },
  order_admin: {
    subject: "New order {{id}} - {{total}}",
    heading: "New order received",
    intro: "A new cash-on-delivery order just came in from the website.",
    outro: "",
  },
};

function fill(template, vars) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

function templateVars(order, brand) {
  const customer = order.customer || {};
  return {
    id: order.id || "",
    brand: brand.name,
    firstName: (customer.name || "there").trim().split(/\s+/)[0],
    name: customer.name || "",
    city: customer.city || "",
    total: money(order.total, order.currency),
    date: shortDate(order.createdAt),
  };
}

function build(templateId, { order, brand, copy = {}, links = {} }) {
  const vars = templateVars(order, brand);
  const defaults = DEFAULT_COPY[templateId] || {};
  const text = (key) => fill(copy[key] || defaults[key] || "", vars);
  const customer = order.customer || {};
  const address = [customer.address, customer.city].filter(Boolean).join(", ");

  let kicker = "";
  let content = "";
  let footerNote = "";

  if (templateId === "order_confirmation") {
    kicker = `Order ${vars.id}`;
    content = [
      paragraph(escapeHtml(text("intro"))),
      detailPanel([
        ["Order", vars.id],
        ["Placed", vars.date],
        ["Payment", "Cash on delivery"],
        ["Deliver to", `${customer.name}${address ? `, ${address}` : ""}`],
        ["Phone", customer.phone],
      ]),
      orderLines(order),
      links.orderUrl ? button("View your order", links.orderUrl) : "",
      paragraph(escapeHtml(text("outro"))),
    ].join("");
    footerNote = "Delivery across Pakistan usually takes 3-5 working days.";
  } else if (templateId === "order_shipped") {
    kicker = `Order ${vars.id}`;
    const tracking = [
      ["Courier", order.courier],
      ["Tracking number", order.trackingNumber],
      ["Expected", order.deliveryEstimate],
    ].filter((row) => row[1]);
    content = [
      paragraph(escapeHtml(text("intro"))),
      tracking.length ? detailPanel(tracking) : "",
      detailPanel([
        ["Order", vars.id],
        ["Amount due", vars.total],
        ["Deliver to", `${customer.name}${address ? `, ${address}` : ""}`],
      ]),
      order.trackingUrl ? button("Track your parcel", order.trackingUrl) : "",
      paragraph(escapeHtml(text("outro"))),
    ].join("");
  } else if (templateId === "order_delivered") {
    kicker = `Order ${vars.id}`;
    content = [
      paragraph(escapeHtml(text("intro"))),
      orderLines(order),
      paragraph(escapeHtml(text("outro"))),
    ].join("");
    footerNote = "Looking after leather: keep it out of direct sun, and never dry it with heat.";
  } else if (templateId === "order_review") {
    kicker = "Your recent order";
    content = [
      paragraph(escapeHtml(text("intro"))),
      links.reviewUrl ? button("Write a quick review", links.reviewUrl) : "",
      paragraph(escapeHtml(text("outro"))),
      links.reviewUrl
        ? paragraph(
            `<span style="font-size:13px;color:${THEME.muted}">If the button does not work, paste this into your browser:<br><a href="${escapeHtml(links.reviewUrl)}" style="color:${THEME.muted}">${escapeHtml(links.reviewUrl)}</a></span>`
          )
        : "",
    ].join("");
  } else if (templateId === "order_cancelled") {
    kicker = `Order ${vars.id}`;
    content = [paragraph(escapeHtml(text("intro"))), orderLines(order), paragraph(escapeHtml(text("outro")))].join("");
  } else if (templateId === "order_admin") {
    kicker = "Website order";
    content = [
      paragraph(escapeHtml(text("intro"))),
      detailPanel([
        ["Order", vars.id],
        ["Placed", vars.date],
        ["Customer", customer.name],
        ["Phone", customer.phone],
        ["Email", customer.email],
        ["Address", address],
        ["Notes", customer.notes],
      ]),
      orderLines(order),
      links.adminUrl ? button("Open in admin", links.adminUrl) : "",
    ].join("");
  } else {
    content = paragraph(escapeHtml(text("intro")));
  }

  const html = layout(brand, {
    preheader: text("intro").slice(0, 140),
    kicker,
    heading: text("heading"),
    content,
    footerNote,
  });

  return { subject: text("subject"), html, text: toText(html) };
}

module.exports = { build, DEFAULT_COPY, THEME, money, escapeHtml, layout, paragraph, button, toText };
