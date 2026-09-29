"use strict";

/**
 * Outbox-backed mail sending.
 *
 * Nothing is sent inline with a request. Checkout and the admin status change
 * write a job into the `mail` collection and return straight away, so a slow or
 * unreachable SMTP host can never hold up a customer's order. A worker drains
 * the outbox with a concurrency cap, an hourly send cap and exponential backoff,
 * and every job is claimed atomically so two Render instances cannot send the
 * same email twice.
 */

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const templates = require("./email-templates");

const CONFIG_ID = "mail-config";
const BACKOFF_MINUTES = [1, 5, 15, 60, 180, 360];
const STUCK_AFTER_MS = 5 * 60 * 1000;
const TICK_MS = 10 * 1000;

const DEFAULT_CONFIG = {
  enabled: true,
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  user: "",
  fromName: "LeatherCulture",
  fromEmail: "",
  replyTo: "",
  adminRecipients: [],
  send: {
    order_confirmation: true,
    order_admin: true,
    order_shipped: true,
    order_delivered: true,
    order_review: true,
    order_cancelled: true,
  },
  reviewDelayDays: 3,
  maxPerMinute: 8,
  maxPerHour: 100,
  concurrency: 2,
  maxAttempts: 6,
  copy: {},
};

/* ---------- credentials at rest ---------- */

function secretKey() {
  // Derived from the Mongo URI by default: it is already a secret and it is the
  // same string locally and on Render, so a password saved from either admin
  // decrypts in both. MAIL_SECRET overrides it if the database URI ever changes.
  const source = process.env.MAIL_SECRET || process.env.MONGODB_URI || process.env.ADMIN_PASSWORD || "leatherculture-mail";
  return crypto.createHash("sha256").update(String(source)).digest();
}

function encrypt(plain) {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const body = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${body.toString("base64")}`;
}

function decrypt(stored) {
  if (!stored) return "";
  const parts = String(stored).split(":");
  if (parts[0] !== "v1" || parts.length !== 4) return String(stored); // a value written before encryption existed
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(parts[1], "base64"));
    decipher.setAuthTag(Buffer.from(parts[2], "base64"));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64")), decipher.final()]).toString("utf8");
  } catch (error) {
    return "";
  }
}

/* ---------- helpers ---------- */

function cleanEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function emailList(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,;\s]+/);
  return [...new Set(raw.map(cleanEmail).filter(Boolean))];
}

function jobId() {
  return `ML-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function backoffMs(attempt) {
  const minutes = BACKOFF_MINUTES[Math.min(attempt, BACKOFF_MINUTES.length) - 1] || 360;
  // a little jitter so retries from several instances do not land together
  return minutes * 60 * 1000 + Math.floor(Math.random() * 20000);
}

function createMailer({ collection, getSettings, siteUrl, log = console }) {
  let cachedConfig = null;
  let transport = null;
  let transportKey = "";
  let timer = null;
  let ticking = false;
  const recentSends = [];
  const stats = { sent: 0, failed: 0, lastError: "", lastSentAt: null, lastTickAt: null };
  const instanceId = `${process.pid}-${crypto.randomBytes(3).toString("hex")}`;

  /* ---------- config ---------- */

  async function readConfig(force = false) {
    if (cachedConfig && !force) return cachedConfig;
    const stored = (await collection.config.findOne({ _id: CONFIG_ID })) || {};
    const { _id, pass, ...rest } = stored;
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...rest,
      send: { ...DEFAULT_CONFIG.send, ...(rest.send || {}) },
      copy: { ...(rest.copy || {}) },
      // env wins on first boot so a fresh deploy can send before anyone opens the admin
      host: rest.host || process.env.SMTP_HOST || DEFAULT_CONFIG.host,
      port: Number(rest.port || process.env.SMTP_PORT || DEFAULT_CONFIG.port),
      user: rest.user || process.env.SMTP_USER || "",
      fromEmail: rest.fromEmail || process.env.SMTP_FROM || process.env.SMTP_USER || "",
      pass: decrypt(pass) || process.env.SMTP_PASS || "",
    };
    cachedConfig.secure = cachedConfig.port === 465 ? true : Boolean(rest.secure);
    cachedConfig.adminRecipients = emailList(rest.adminRecipients);
    return cachedConfig;
  }

  async function writeConfig(patch = {}) {
    const current = await readConfig(true);
    const next = { ...current, ...patch };
    const update = {
      enabled: next.enabled !== false,
      host: String(next.host || "").trim(),
      port: Number(next.port) || 465,
      secure: Number(next.port) === 465 ? true : Boolean(next.secure),
      user: String(next.user || "").trim(),
      fromName: String(next.fromName || "").trim().slice(0, 60),
      fromEmail: cleanEmail(next.fromEmail),
      replyTo: cleanEmail(next.replyTo),
      adminRecipients: emailList(next.adminRecipients),
      send: { ...DEFAULT_CONFIG.send, ...(next.send || {}) },
      reviewDelayDays: Math.min(30, Math.max(0, Number(next.reviewDelayDays) || 0)),
      maxPerMinute: Math.min(60, Math.max(1, Number(next.maxPerMinute) || 8)),
      maxPerHour: Math.min(2000, Math.max(5, Number(next.maxPerHour) || 100)),
      concurrency: Math.min(5, Math.max(1, Number(next.concurrency) || 2)),
      maxAttempts: Math.min(10, Math.max(1, Number(next.maxAttempts) || 6)),
      copy: next.copy && typeof next.copy === "object" ? next.copy : {},
      updatedAt: new Date(),
    };
    // only replace the stored password when a new one was actually typed
    if (typeof patch.pass === "string" && patch.pass.trim()) update.pass = encrypt(patch.pass.trim());
    await collection.config.updateOne({ _id: CONFIG_ID }, { $set: update }, { upsert: true });
    cachedConfig = null;
    transport = null;
    return publicConfig(await readConfig(true));
  }

  function publicConfig(config) {
    const { pass, ...rest } = config;
    return { ...rest, hasPassword: Boolean(pass), configured: isConfigured(config) };
  }

  function isConfigured(config) {
    return Boolean(config.enabled && config.host && config.user && config.pass && config.fromEmail);
  }

  /* ---------- transport ---------- */

  async function getTransport() {
    const config = await readConfig();
    const key = [config.host, config.port, config.secure, config.user, config.pass].join("|");
    if (transport && transportKey === key) return transport;
    if (transport) transport.close();
    transportKey = key;
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      // one pooled connection reused across jobs; shared hosts drop you for opening many
      pool: true,
      maxConnections: config.concurrency,
      maxMessages: 50,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 25000,
    });
    return transport;
  }

  async function verify() {
    const config = await readConfig(true);
    if (!isConfigured(config)) {
      const missing = ["host", "user", "pass", "fromEmail"].filter((key) => !config[key]);
      return { ok: false, message: config.enabled ? `Missing: ${missing.join(", ")}` : "Email sending is switched off." };
    }
    try {
      await (await getTransport()).verify();
      return { ok: true, message: `Connected to ${config.host}:${config.port} as ${config.user}.` };
    } catch (error) {
      return { ok: false, message: String(error && error.message ? error.message : error).slice(0, 300) };
    }
  }

  /* ---------- brand block for the templates ---------- */

  async function brandBlock() {
    const settings = (await getSettings()) || {};
    const footer = settings.footer || {};
    const base = siteUrl();
    return {
      name: (settings.brand && settings.brand.name) || "LeatherCulture",
      tagline: "Premium leather, made in Pakistan",
      siteUrl: base,
      siteHost: base.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      logoUrl: `${base}/assets/brand/leather-culture-logo-black.png`,
      supportEmail: footer.email || "",
      phone: footer.phone || "",
      socials: [
        { label: "Instagram", href: footer.socials && footer.socials.instagram },
        { label: "Facebook", href: footer.socials && footer.socials.facebook },
      ],
    };
  }

  function reviewToken(orderId) {
    return crypto.createHmac("sha256", secretKey()).update(`review:${orderId}`).digest("hex").slice(0, 20);
  }

  function orderToken(orderId) {
    return crypto.createHmac("sha256", secretKey()).update(`order:${orderId}`).digest("hex").slice(0, 20);
  }

  /* ---------- queueing ---------- */

  /**
   * Adds a job to the outbox. `dedupeKey` makes this safe to call twice: marking
   * an order delivered a second time will not send a second email.
   */
  async function queue({ template, to, order, sendAt, dedupeKey, cc }) {
    const config = await readConfig();
    const recipients = emailList(to);
    if (!recipients.length) return { skipped: "no recipient" };
    if (config.send[template] === false) return { skipped: "template switched off" };

    const job = {
      id: jobId(),
      template,
      to: recipients,
      cc: emailList(cc),
      orderId: (order && order.id) || "",
      orderSnapshot: order ? { ...order, _id: undefined } : null,
      status: "queued",
      attempts: 0,
      nextAttemptAt: sendAt ? new Date(sendAt) : new Date(),
      dedupeKey: dedupeKey || `${template}:${(order && order.id) || recipients[0]}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      await collection.outbox.insertOne(job);
    } catch (error) {
      if (error && error.code === 11000) return { skipped: "already queued" };
      throw error;
    }
    setImmediate(() => tick().catch(() => {}));
    return { queued: job.id };
  }

  async function render(job) {
    const brand = await brandBlock();
    const config = await readConfig();
    const order = job.orderSnapshot || { id: job.orderId };
    const base = brand.siteUrl;
    const links = {
      orderUrl: `${base}/order/?id=${encodeURIComponent(order.id || "")}&t=${orderToken(order.id || "")}`,
      reviewUrl: `${base}/review/?order=${encodeURIComponent(order.id || "")}&t=${reviewToken(order.id || "")}`,
      adminUrl: `${base}/admin/#/orders/view/${encodeURIComponent(order.id || "")}`,
    };
    return templates.build(job.template, { order, brand, copy: config.copy[job.template] || {}, links });
  }

  /* ---------- the worker ---------- */

  function withinRateLimit(config) {
    const now = Date.now();
    while (recentSends.length && now - recentSends[0] > 60 * 60 * 1000) recentSends.shift();
    const lastMinute = recentSends.filter((time) => now - time < 60 * 1000).length;
    return lastMinute < config.maxPerMinute && recentSends.length < config.maxPerHour;
  }

  async function claimOne() {
    const now = new Date();
    const result = await collection.outbox.findOneAndUpdate(
      { status: "queued", nextAttemptAt: { $lte: now } },
      { $set: { status: "sending", claimedAt: now, claimedBy: instanceId }, $inc: { attempts: 1 } },
      { sort: { nextAttemptAt: 1 }, returnDocument: "after" }
    );
    return result && (result.value || result);
  }

  async function deliver(job) {
    const config = await readConfig();
    const { subject, html, text } = await render(job);
    const from = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;
    const info = await (await getTransport()).sendMail({
      from,
      to: job.to.join(", "),
      cc: job.cc && job.cc.length ? job.cc.join(", ") : undefined,
      replyTo: config.replyTo || undefined,
      subject,
      html,
      text,
      headers: { "X-Entity-Ref-ID": job.id },
    });
    recentSends.push(Date.now());
    stats.sent += 1;
    stats.lastSentAt = new Date();
    await collection.outbox.updateOne(
      { id: job.id },
      { $set: { status: "sent", sentAt: new Date(), updatedAt: new Date(), subject, messageId: info.messageId || "", lastError: "" } }
    );
  }

  async function fail(job, error) {
    const config = await readConfig();
    const message = String(error && error.message ? error.message : error).slice(0, 400);
    stats.failed += 1;
    stats.lastError = message;
    const exhausted = job.attempts >= config.maxAttempts;
    await collection.outbox.updateOne(
      { id: job.id },
      {
        $set: {
          status: exhausted ? "failed" : "queued",
          nextAttemptAt: exhausted ? job.nextAttemptAt : new Date(Date.now() + backoffMs(job.attempts)),
          lastError: message,
          updatedAt: new Date(),
        },
      }
    );
    if (exhausted) log.error(`mail: giving up on ${job.id} (${job.template}) - ${message}`);
  }

  async function tick() {
    if (ticking) return;
    ticking = true;
    stats.lastTickAt = new Date();
    try {
      const config = await readConfig();
      if (!isConfigured(config)) return;

      // anything a crashed instance left mid-flight goes back in the queue
      await collection.outbox.updateMany(
        { status: "sending", claimedAt: { $lt: new Date(Date.now() - STUCK_AFTER_MS) } },
        { $set: { status: "queued", updatedAt: new Date() } }
      );

      const workers = [];
      for (let slot = 0; slot < config.concurrency; slot += 1) {
        workers.push(
          (async () => {
            while (withinRateLimit(config)) {
              const job = await claimOne();
              if (!job) return;
              try {
                await deliver(job);
              } catch (error) {
                await fail(job, error);
              }
            }
          })()
        );
      }
      await Promise.all(workers);
    } catch (error) {
      stats.lastError = String(error && error.message ? error.message : error).slice(0, 400);
      log.error("mail: worker tick failed", stats.lastError);
    } finally {
      ticking = false;
    }
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => tick().catch(() => {}), TICK_MS);
    if (timer.unref) timer.unref();
    tick().catch(() => {});
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (transport) transport.close();
    transport = null;
  }

  /* ---------- admin surface ---------- */

  async function sendTest(to) {
    const recipients = emailList(to);
    if (!recipients.length) throw Object.assign(new Error("Enter a valid email address."), { status: 400 });
    const config = await readConfig(true);
    if (!isConfigured(config)) throw Object.assign(new Error("Finish the SMTP settings first."), { status: 400 });
    const sample = {
      id: "LC-TEST01",
      currency: (await getSettings()).checkout?.currency || "Rs",
      createdAt: new Date(),
      customer: { name: "Test Customer", phone: "0300 0000000", city: "Lahore", address: "12 Example Street", email: recipients[0] },
      items: [{ name: "Structured Trench Coat", variantName: "Black", qty: 1, unitPrice: 24900, lineTotal: 24900 }],
      subtotal: 24900,
      shipping: 0,
      total: 24900,
    };
    const brand = await brandBlock();
    const { subject, html, text } = templates.build("order_confirmation", {
      order: sample,
      brand,
      copy: config.copy.order_confirmation || {},
      links: {},
    });
    const from = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;
    await (await getTransport()).sendMail({ from, to: recipients.join(", "), subject: `[Test] ${subject}`, html, text });
    recentSends.push(Date.now());
    return { ok: true, to: recipients };
  }

  async function preview(template) {
    const brand = await brandBlock();
    const config = await readConfig();
    const sample = {
      id: "LC-PREVIEW",
      currency: "Rs",
      createdAt: new Date(),
      customer: { name: "Ayesha Khan", phone: "0300 1234567", city: "Karachi", address: "House 7, Block 4, Clifton", email: "customer@example.com" },
      items: [
        { name: "Structured Trench Coat", variantName: "Black", qty: 1, unitPrice: 24900, lineTotal: 24900 },
        { name: "Classic Boxy Tee", variantName: "Off White", qty: 2, unitPrice: 3400, lineTotal: 6800 },
      ],
      subtotal: 31700,
      shipping: 0,
      total: 31700,
      courier: "TCS",
      trackingNumber: "TCS123456789",
    };
    return templates.build(template, {
      order: sample,
      brand,
      copy: config.copy[template] || {},
      links: {
        orderUrl: `${brand.siteUrl}/order/?id=LC-PREVIEW`,
        reviewUrl: `${brand.siteUrl}/review/?order=LC-PREVIEW&t=preview`,
        adminUrl: `${brand.siteUrl}/admin/#/orders`,
      },
    });
  }

  async function list({ limit = 100, status = "" } = {}) {
    const query = status ? { status } : {};
    const rows = await collection.outbox.find(query).sort({ createdAt: -1 }).limit(Math.min(500, limit)).toArray();
    return rows.map(({ _id, orderSnapshot, ...row }) => row);
  }

  async function retry(id) {
    const result = await collection.outbox.updateOne(
      { id, status: { $in: ["failed", "sent"] } },
      { $set: { status: "queued", nextAttemptAt: new Date(), attempts: 0, updatedAt: new Date() } }
    );
    setImmediate(() => tick().catch(() => {}));
    return { ok: Boolean(result.matchedCount) };
  }

  async function health() {
    const config = await readConfig();
    const [queued, failed, sent] = await Promise.all([
      collection.outbox.countDocuments({ status: "queued" }),
      collection.outbox.countDocuments({ status: "failed" }),
      collection.outbox.countDocuments({ status: "sent" }),
    ]);
    return { ...stats, queued, failed, sent, configured: isConfigured(config), enabled: config.enabled !== false, instanceId };
  }

  return { readConfig, writeConfig, publicConfig, queue, start, stop, tick, verify, sendTest, preview, list, retry, health, reviewToken, orderToken, isConfigured };
}

module.exports = { createMailer, DEFAULT_CONFIG, cleanEmail, emailList };
