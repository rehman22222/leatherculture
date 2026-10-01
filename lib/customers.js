const crypto = require("crypto");
const { promisify } = require("util");
const scrypt = promisify(crypto.scrypt);
const digest = token => crypto.createHash("sha256").update(token).digest("hex");
const emailOf = value => String(value || "").trim().toLowerCase();
const clean = (value, limit = 200) => String(value || "").trim().slice(0, limit);
const fail = (status, message) => Object.assign(new Error(message), { status });

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 10 || password.length > 128) throw fail(400, "Use a password between 10 and 128 characters.");
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}
async function checkPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128 || !stored) return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash || "", "hex");
  const actual = await scrypt(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
function publicCustomer(customer) {
  return { id: customer.id, name: customer.name, email: customer.email, emailVerified: Boolean(customer.emailVerified), phone: customer.phone || "", address: customer.address || "", city: customer.city || "" };
}
function customerOrder(order) {
  const { _id, adminNote, customerId, ...record } = order;
  return record;
}

function createCustomerAccounts({ collections, readBody, json, parseCookies, origins, siteUrl, mailer }) {
  async function bodyOf(req) {
    const raw = await readBody(req, 16384);
    if (Buffer.byteLength(raw, "utf8") > 16384) throw fail(413, "Request is too large.");
    const body = JSON.parse(raw || "{}");
    if (!body || typeof body !== "object" || Array.isArray(body)) throw fail(400, "Invalid request.");
    return body;
  }
  async function initialize() {
    await Promise.all([
      collections.customers.createIndex({ email: 1 }, { unique: true }),
      collections.customers.createIndex({ id: 1 }, { unique: true }),
      collections.customers.createIndex({ "verification.hash": 1 }, { sparse: true }),
      collections.customers.createIndex({ "reset.hash": 1 }, { sparse: true }),
      collections.customerSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      collections.customerSessions.createIndex({ customerId: 1 }),
      collections.customerRateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      collections.orders.createIndex({ customerId: 1, createdAt: -1 })
    ]);
  }
  function cookie(req, res, token, maxAge = 2592000) {
    const secure = req.headers["x-forwarded-proto"] === "https" || Boolean(req.socket?.encrypted) || process.env.NODE_ENV === "production";
    res.setHeader("set-cookie", `lc_customer_session=${token}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${maxAge}`);
  }
  async function session(req, res, customer) {
    const token = crypto.randomBytes(32).toString("hex");
    await collections.customerSessions.insertOne({ _id: digest(token), customerId: customer.id, createdAt: new Date(), expiresAt: new Date(Date.now() + 2592000000) });
    cookie(req, res, token);
  }
  async function authenticated(req) {
    const token = parseCookies(req).lc_customer_session;
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const record = await collections.customerSessions.findOne({ _id: digest(token), expiresAt: { $gt: new Date() } });
    return record ? collections.customers.findOne({ id: record.customerId }) : null;
  }
  async function rateLimit(req, action) {
    // A Mongo-backed limit remains effective across restarts and multiple workers.
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
    const bucket = Math.floor(Date.now() / 600000);
    const record = await collections.customerRateLimits.findOneAndUpdate(
      { _id: digest(`${action}:${ip}:${bucket}`) },
      { $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 1200000) } },
      { upsert: true, returnDocument: "after" }
    );
    if (record.attempts > 20) throw fail(429, "Too many attempts. Please try again in 10 minutes.");
  }
  async function emailAction(customer, purpose) {
    const config = await mailer.readConfig();
    if (!mailer.isConfigured(config) || config.enabled === false) return false;
    const token = crypto.randomBytes(32).toString("hex");
    const field = purpose === "verify" ? "verification" : "reset";
    await collections.customers.updateOne({ id: customer.id }, { $set: { [field]: { hash: digest(token), expiresAt: new Date(Date.now() + (purpose === "verify" ? 86400000 : 3600000)) } } });
    const result = await mailer.queue({
      template: `account_${purpose}`, to: customer.email,
      order: { id: customer.id, customer: { name: customer.name }, accountUrl: `${siteUrl()}/account?${purpose}=${token}` },
      dedupeKey: `account_${purpose}:${digest(token)}`
    });
    return Boolean(result.queued);
  }
  async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/account/")) return false;
    try {
      const action = url.pathname.slice("/api/account/".length);
      if (req.method !== "GET") {
        if (req.headers.origin && !origins.has(req.headers.origin)) throw fail(403, "This request is not allowed.");
        if (!String(req.headers["content-type"] || "").startsWith("application/json")) throw fail(415, "Use a JSON request.");
        await rateLimit(req, action);
      }
      if (action === "register" && req.method === "POST") {
        const body = await bodyOf(req);
        const email = emailOf(body.email), name = clean(body.name, 80);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120 || name.length < 2) throw fail(400, "Enter your name and a valid email address.");
        const customer = { id: crypto.randomUUID(), name, email, passwordHash: await hashPassword(body.password), emailVerified: false, createdAt: new Date(), updatedAt: new Date() };
        try { await collections.customers.insertOne(customer); }
        catch (error) { if (error.code === 11000) throw fail(409, "Unable to create this account. Try signing in or resetting your password."); throw error; }
        await session(req, res, customer);
        const verificationSent = await emailAction(customer, "verify").catch(() => false);
        json(res, 201, { customer: publicCustomer(customer), verificationSent });
      } else if (action === "login" && req.method === "POST") {
        const body = await bodyOf(req);
        const customer = await collections.customers.findOne({ email: emailOf(body.email) });
        // Perform the same expensive password check for unknown emails.
        const valid = await checkPassword(body.password, customer?.passwordHash || `${"0".repeat(32)}:${"0".repeat(128)}`);
        if (!customer || !valid) throw fail(401, "Email or password is incorrect.");
        await session(req, res, customer);
        json(res, 200, { customer: publicCustomer(customer) });
      } else if (action === "forgot-password" && req.method === "POST") {
        const body = await bodyOf(req);
        const customer = await collections.customers.findOne({ email: emailOf(body.email) });
        if (customer) await emailAction(customer, "reset").catch(() => false);
        json(res, 200, { message: "If an account exists and email delivery is enabled, a reset link will arrive shortly." });
      } else if (["verify", "reset-password"].includes(action) && req.method === "POST") {
        const body = await bodyOf(req);
        if (!/^[a-f0-9]{64}$/.test(body.token || "")) throw fail(400, "This link is invalid or expired.");
        const field = action === "verify" ? "verification" : "reset";
        const query = { [`${field}.hash`]: digest(body.token), [`${field}.expiresAt`]: { $gt: new Date() } };
        const update = action === "verify" ? { emailVerified: true, updatedAt: new Date() } : { passwordHash: await hashPassword(body.password), updatedAt: new Date() };
        const customer = await collections.customers.findOneAndUpdate(query, { $set: update, $unset: { [field]: "" } }, { returnDocument: "after" });
        if (!customer) throw fail(400, "This link is invalid or expired.");
        if (action === "verify") {
          const emailPattern = customer.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          await collections.orders.updateMany({ customerId: { $exists: false }, "customer.email": { $regex: `^${emailPattern}$`, $options: "i" } }, { $set: { customerId: customer.id } });
        } else await collections.customerSessions.deleteMany({ customerId: customer.id });
        await session(req, res, customer);
        json(res, 200, { customer: publicCustomer(customer) });
      } else {
        const customer = await authenticated(req);
        if (!customer) throw fail(401, "Please sign in to your account.");
        if (action === "me" && req.method === "GET") json(res, 200, { customer: publicCustomer(customer) });
        else if (action === "logout" && req.method === "POST") {
          await collections.customerSessions.deleteOne({ _id: digest(parseCookies(req).lc_customer_session) });
          cookie(req, res, "", 0); json(res, 200, { ok: true });
        } else if (action === "resend-verification" && req.method === "POST") {
          const sent = customer.emailVerified || await emailAction(customer, "verify");
          json(res, 200, { message: sent ? "Check your inbox for your verification link." : "Email delivery is not configured yet. Contact the store for help." });
        } else if (action === "profile" && req.method === "PUT") {
          const body = await bodyOf(req);
          const update = { name: clean(body.name, 80), phone: clean(body.phone, 30), address: clean(body.address, 300), city: clean(body.city, 60), updatedAt: new Date() };
          if (update.name.length < 2) throw fail(400, "Enter your name.");
          await collections.customers.updateOne({ id: customer.id }, { $set: update });
          json(res, 200, { customer: publicCustomer({ ...customer, ...update }) });
        } else if (action === "password" && req.method === "PUT") {
          const body = await bodyOf(req);
          if (!await checkPassword(body.currentPassword, customer.passwordHash)) throw fail(400, "Current password is incorrect.");
          await collections.customers.updateOne({ id: customer.id }, { $set: { passwordHash: await hashPassword(body.password), updatedAt: new Date() }, $unset: { reset: "" } });
          await collections.customerSessions.deleteMany({ customerId: customer.id });
          await session(req, res, customer); json(res, 200, { ok: true });
        } else if (action === "orders" && req.method === "GET") {
          const orders = await collections.orders.find({ customerId: customer.id }).sort({ createdAt: -1 }).limit(100).toArray();
          json(res, 200, { orders: orders.map(customerOrder) });
        } else if (/^orders\/[A-Za-z0-9-]+$/.test(action) && req.method === "GET") {
          const order = await collections.orders.findOne({ customerId: customer.id, id: action.split("/")[1] });
          if (!order) throw fail(404, "Order not found.");
          json(res, 200, { order: customerOrder(order) });
        } else throw fail(404, "Account endpoint not found.");
      }
    } catch (error) {
      json(res, error.status || (error instanceof SyntaxError ? 400 : 500), { message: error.status ? error.message : "Unable to process this request. Please try again." });
    }
    return true;
  }
  return { initialize, authenticated, handle };
}
module.exports = { createCustomerAccounts, hashPassword, checkPassword, publicCustomer, customerOrder, digest };
