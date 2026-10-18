"use strict";
// Privacy policy and terms, rendered from the live checkout settings so delivery charges and the
// returns policy always match what checkout applies. Every statement describes what this code does.
const { esc, jsonLd, siteUrl, absolute, brandName, contactEmail, analyticsId, organization, breadcrumbs, headTags, siteHeader, siteFooter } = require("./seo");
const { deliveryTimingText } = require("../shop/commerce-schema");

const UPDATED = "2026-10-19";
const FALLBACK_POLICY = "Contact contact@leatherculture.shop for the current returns and exchange policy before ordering.";
const longDate = value => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const amount = value => Number(value || 0).toLocaleString("en-US");
const list = items => `<ul>${items.filter(Boolean).map(item => `<li>${item}</li>`).join("")}</ul>`;

function privacy(settings) {
  const email = esc(contactEmail(settings));
  const analytics = Boolean(analyticsId(settings));
  return {
    path: "/privacy-policy",
    title: "Privacy Policy",
    metaTitle: `Privacy Policy | ${brandName(settings)} Pakistan`,
    description: `How ${brandName(settings)} collects, uses and protects the details you share when you order, create an account or contact us.`,
    lead: "In short: we collect only the details needed to deliver your order, run your account and answer your messages. We never sell your personal information, and you can ask us to correct or delete it at any time.",
    body: `
      <h2>What we collect</h2>
      ${list([
        "<strong>Orders:</strong> your name, phone number, delivery address, city, optional email address and order notes, and the items you buy. We need these to deliver your order and collect cash on delivery.",
        "<strong>Accounts:</strong> if you create an account, your name, email address, your password stored only as a salted scrypt hash (we never see the password itself), and any phone number or address you save.",
        "<strong>Reviews:</strong> if you review an order, your rating, your review and the name and city you choose to show.",
        "<strong>Messages:</strong> anything you send us by email.",
        "<strong>Security data:</strong> your IP address is used to limit repeated sign-in, sign-up and order attempts. Stored records of this expire automatically within about 20 minutes."
      ])}
      <h2>How we use it</h2>
      ${list([
        "To confirm, pack and deliver your order, and to contact you about it.",
        "To send the emails linked to your order: confirmation, dispatch and delivery updates, and a request to review your order a few days after delivery.",
        "To run your account: sign-in, email verification codes and password resets.",
        "To answer your questions and handle exchanges or problems with an order.",
        "To protect the store from fraud and abuse.",
        analytics && "To understand how visitors use the site so we can improve it, using Google Analytics."
      ])}
      <p>We only send marketing emails to people who ask for them.</p>
      <h2>Cookies and local storage</h2>
      ${list([
        "<strong>lc_customer_session:</strong> a secure, HttpOnly sign-in cookie, set only when you sign in. It lasts up to 30 days, or until you sign out.",
        "<strong>Your cart and checkout details:</strong> kept in your own browser (local storage) so they survive a page refresh. They stay on your device until you place an order.",
        analytics ? "<strong>Google Analytics cookies (_ga and related):</strong> used to count visits and page views." : "We do not use advertising or tracking cookies."
      ])}
      <h2>Who we share it with</h2>
      <p>We share personal information only with the services that help us run the store, and only what each one needs:</p>
      ${list([
        "<strong>Delivery partners:</strong> your name, phone number, address and the amount to collect, so the courier can deliver your order and take payment.",
        "<strong>Hosting and email providers:</strong> the website is hosted by Vercel, the store application runs on Render, order and account data is stored in MongoDB Atlas, and order emails are sent through our email provider.",
        analytics && "<strong>Google:</strong> usage statistics collected through Google Analytics.",
        "<strong>Authorities:</strong> when the law requires us to share information."
      ])}
      <p>We do not sell or rent your personal information to anyone.</p>
      <h2>How long we keep it</h2>
      ${list([
        "Order records: for as long as we need them for delivery, exchanges, warranty questions and our accounts.",
        "Account details: until you ask us to delete your account.",
        "Sign-in sessions end after 30 days. Email verification codes expire after 10 minutes and password reset links after 1 hour."
      ])}
      <h2>Your choices</h2>
      <p>You can view and update your saved details under <a href="/account">My account</a> at any time. To get a copy of your information, correct it or have it deleted, email <a href="mailto:${email}">${email}</a> from the address linked to your order or account.</p>
      <h2>Security</h2>
      <p>The site is served over HTTPS, passwords and sign-in sessions are stored only as hashes, and access to order data is limited to the store team. No system is perfectly secure, so please use a password you do not use anywhere else.</p>
      <h2>Children</h2>
      <p>Our store is meant for adults. If you are under 18, please ask a parent or guardian to order for you.</p>
      <h2>Changes to this policy</h2>
      <p>If we change how we handle personal information, we will update this page and the date at the top. Our <a href="/terms">Terms &amp; Conditions</a> explain how ordering works.</p>
      <h2>Contact</h2>
      <p>Questions about this policy: email <a href="mailto:${email}">${email}</a> or use our <a href="/contact">contact page</a>.</p>`
  };
}

function terms(settings) {
  const checkout = settings?.checkout || {};
  const email = esc(contactEmail(settings));
  const currency = esc(checkout.currency || "Rs");
  const fee = Number(checkout.shippingFee) || 0;
  const free = Number(checkout.freeShippingFrom) || 0;
  const delivery = fee ? `Delivery costs ${currency} ${amount(fee)}${free ? `, and it is free on orders of ${currency} ${amount(free)} or more` : ""}.` : "Delivery is free.";
  return {
    path: "/terms",
    title: "Terms & Conditions",
    metaTitle: `Terms & Conditions | ${brandName(settings)} Pakistan`,
    description: `The terms for ordering from ${brandName(settings)}: prices in rupees, cash on delivery across Pakistan, delivery charges, exchanges and your account.`,
    lead: "In short: you order on our website, pay cash on delivery when the parcel arrives, and the prices and delivery charges shown at checkout are what you pay.",
    body: `
      <h2>Placing an order</h2>
      <p>When you place an order, you are offering to buy the items in your cart at the prices shown. We may contact you by phone or email to confirm your details before dispatch. We can decline or cancel an order if an item is no longer available, the price shown was clearly wrong, or we cannot confirm the delivery details. Because you pay on delivery, there is nothing to refund if an order is cancelled before it ships.</p>
      <h2>Prices and payment</h2>
      <p>Prices are in Pakistani rupees (${currency}). Payment is cash on delivery: you pay the courier when your order arrives. The price shown when you placed your order is the price you pay.</p>
      <h2>Delivery</h2>
      <p>We deliver anywhere in Pakistan. ${delivery} ${esc(checkout.codNote || "")} ${esc(deliveryTimingText(checkout))} Delivery times are estimates and can be affected by couriers, weather and public holidays.</p>
      <h2 id="returns">Returns and exchanges</h2>
      <p>${esc(String(checkout.returnsPolicy || "").trim() || FALLBACK_POLICY)}</p>
      <p>If an item arrives damaged or is not what you ordered, email <a href="mailto:${email}">${email}</a> as soon as possible so we can put it right. Nothing in these terms affects the rights you have under consumer protection law.</p>
      <h2>Product details and sizing</h2>
      <p>We work to show every product accurately, but colours can look slightly different on different screens. If you are unsure about your size, send us your measurements through the <a href="/contact">contact page</a> before ordering and we will help you choose.</p>
      <h2>Your account</h2>
      <p>Keep your password private and tell us if you think someone else has used your account. We may suspend accounts that are used for fraud or abuse.</p>
      <h2>Reviews</h2>
      <p>Reviews must be honest and about an order you received. We read every review before it appears and may decline reviews that are abusive, off-topic or contain personal information.</p>
      <h2>Our content</h2>
      <p>The text, photos, logo and design of this website belong to ${esc(brandName(settings))} or are used with permission. Please do not copy them for commercial use without asking us.</p>
      <h2>Liability</h2>
      <p>We are responsible for delivering the products you order as described. We are not responsible for losses that could not be foreseen when you placed your order, or for delays caused by events outside our control. Nothing in these terms limits any liability that cannot be limited by law.</p>
      <h2>Changes and governing law</h2>
      <p>We may update these terms from time to time. The version on this page when you place an order applies to that order. These terms are governed by the laws of Pakistan. Our <a href="/privacy-policy">Privacy Policy</a> explains how we handle your details.</p>
      <h2>Contact</h2>
      <p>Email <a href="mailto:${email}">${email}</a> or use our <a href="/contact">contact page</a>.</p>`
  };
}

const pages = { privacy, terms };

function renderPolicyPage(kind, settings) {
  const page = pages[kind](settings);
  const site = siteUrl();
  const url = absolute(page.path, site);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: page.title, description: page.description, inLanguage: "en-PK", dateModified: UPDATED,
        isPartOf: { "@type": "WebSite", "@id": `${site}/#website`, url: `${site}/`, name: brandName(settings) },
        author: { "@id": `${site}/#organization` }, publisher: { "@id": `${site}/#organization` } },
      breadcrumbs([["Home", "/"], [page.title, page.path]], site),
      organization(settings, site)
    ]
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headTags({ settings, title: page.metaTitle, description: page.description, path: page.path })}
<link rel="stylesheet" href="/store.css?v=seo-1">
<link rel="stylesheet" href="/account/nav.css?v=2">
<script type="application/ld+json">${jsonLd(schema)}</script>
<style>
  .policy { max-width: 760px; }
  .policy .crumbs { font-size: 13px; color: var(--muted); margin: 0 0 18px; }
  .policy .lead { font-size: 18px; line-height: 1.65; background: #fff; border: 1px solid var(--line); border-left: 4px solid var(--ink); border-radius: 12px; padding: 16px 20px; margin: 0 0 14px; }
  .policy .updated { color: var(--muted); font-size: 14px; margin: 0 0 30px; }
  .policy h2 { font-size: 20px; margin: 32px 0 10px; }
  .policy p, .policy li { line-height: 1.75; color: #333; }
  .policy ul { padding-left: 20px; }
  .policy li { margin-bottom: 8px; }
</style>
</head>
<body>
${siteHeader(settings)}
<main class="policy">
  <p class="crumbs"><a href="/">Home</a> / ${esc(page.title)}</p>
  <h1>${esc(page.title)}</h1>
  <p class="lead">${esc(page.lead)}</p>
  <p class="updated">Last updated <time datetime="${UPDATED}">${longDate(UPDATED)}</time> by the <a href="/about" rel="author">${esc(brandName(settings))} team</a>. This page covers ${esc(new URL(site).host)}, run by ${esc(brandName(settings))} in Pakistan.</p>
  ${page.body}
</main>
${siteFooter(settings)}
</body>
</html>`;
}

module.exports = { renderPolicyPage, policyPaths: { privacy: "/privacy-policy", terms: "/terms" }, POLICY_UPDATED: UPDATED };
