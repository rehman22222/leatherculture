const assert = require("assert/strict");
const { createCustomerAccounts, checkPassword, hashPassword } = require("../lib/customers");
const clone = value => structuredClone(value);
const field = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
function matches(record, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$or") return value.some(part => matches(record, part));
    const current = field(record, key);
    if (value && typeof value === "object" && !(value instanceof Date)) {
      if ("$gt" in value) return current > value.$gt;
      if ("$lt" in value) return current < value.$lt;
      if ("$lte" in value) return current <= value.$lte;
      if ("$in" in value) return value.$in.includes(current);
      if ("$nin" in value) return !value.$nin.includes(current);
      if ("$exists" in value) return (current !== undefined) === value.$exists;
      if ("$regex" in value) return new RegExp(value.$regex, value.$options).test(current || "");
    }
    return current === value;
  });
}
class MemoryCollection {
  rows = [];
  async createIndex() {}
  async countDocuments(query) { return this.rows.filter(row => matches(row, query)).length; }
  async insertOne(record) {
    if (this.rows.some(row => (record.email && row.email === record.email) || (record._id && row._id === record._id))) throw Object.assign(new Error("Duplicate"), { code: 11000 });
    this.rows.push(clone(record));
  }
  async findOne(query) { return clone(this.rows.find(row => matches(row, query)) || null); }
  update(row, update) {
    function assign(key, value, remove = false) { const parts = key.split("."); const last = parts.pop(); let target = row; for (const part of parts) target = target[part] ||= {}; if (remove) delete target[last]; else target[last] = value; }
    for (const [key, value] of Object.entries(update.$set || {})) assign(key, value);
    for (const [key, amount] of Object.entries(update.$inc || {})) assign(key, (field(row, key) || 0) + amount);
    for (const key of Object.keys(update.$unset || {})) assign(key, undefined, true);
  }
  async findOneAndUpdate(query, update, options = {}) {
    let row = this.rows.find(row => matches(row, query));
    if (!row && options.upsert) { row = { ...query, ...update.$setOnInsert }; this.rows.push(row); }
    if (!row) return null;
    this.update(row, update); return clone(row);
  }
  async updateOne(query, update) { return { matchedCount: (await this.findOneAndUpdate(query, update)) ? 1 : 0 }; }
  async updateMany(query, update) { this.rows.filter(row => matches(row, query)).forEach(row => this.update(row, update)); }
  async deleteMany(query) { this.rows = this.rows.filter(row => !matches(row, query)); }
  async deleteOne(query) { const row = this.rows.find(row => matches(row, query)); this.rows = this.rows.filter(item => item !== row); }
  find(query) { let rows = this.rows.filter(row => matches(row, query)); return { sort(spec) { rows.sort((a, b) => { for (const [key, dir] of Object.entries(spec)) { if (a[key] < b[key]) return -dir; if (a[key] > b[key]) return dir; } return 0; }); return this; }, skip(n) { rows = rows.slice(n); return this; }, limit(n) { rows = rows.slice(0, n); return this; }, async toArray() { return clone(rows); } }; }
}
async function main() {
  const collections = Object.fromEntries(["customers", "customerSessions", "customerRateLimits", "orders"].map(key => [key, new MemoryCollection()]));
  const emails = [];
  const accounts = createCustomerAccounts({ collections, readBody: async req => JSON.stringify(req.body), json: (res, status, body) => Object.assign(res, { status, body }), parseCookies: req => req.cookies,
    origins: new Set(["https://www.leatherculture.shop"]), siteUrl: () => "https://www.leatherculture.shop",
    mailer: { readConfig: async () => ({ enabled: true }), isAccountConfigured: () => true, queue: async job => { emails.push(job); return { queued: "test" }; } } });
  await accounts.initialize();
  async function request(action, body = {}, cookie = "", method = "POST", origin = "https://www.leatherculture.shop") {
    const req = { method, body, headers: { origin, "content-type": "application/json", "x-forwarded-proto": "https" }, socket: { remoteAddress: "test" }, cookies: { lc_customer_session: cookie } };
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; } };
    await accounts.handle(req, res, new URL(`https://www.leatherculture.shop/api/account/${action}`));
    return { ...res, cookie: res.headers["set-cookie"]?.match(/lc_customer_session=([^;]*)/)[1] };
  }
  const a = await request("register", { name: "Test Customer", email: "TEST@example.com", password: "Strong-test-password-1" });
  assert.equal(a.status, 201); assert.equal(a.body.customer.email, "test@example.com"); assert(!("passwordHash" in a.body.customer));
  assert.match(a.headers["set-cookie"], /HttpOnly; Secure; SameSite=Lax/);
  const stored = collections.customers.rows[0]; assert.notEqual(stored.passwordHash, "Strong-test-password-1"); assert(await checkPassword("Strong-test-password-1", stored.passwordHash));
  assert.equal((await request("register", { name: "Again", email: "test@example.com", password: "Strong-test-password-1" })).status, 409);
  assert.equal((await request("login", { email: "test@example.com", password: "wrong" })).status, 401);
  assert.equal((await request("profile", { name: "Hacker" }, a.cookie, "PUT", "https://evil.example")).status, 403);
  assert.equal((await request("profile", { name: "Updated Customer", phone: "03001234567", address: "Test delivery address", city: "Lahore", email: "changed@example.com" }, a.cookie, "PUT")).status, 200);
  assert.equal((await request("me", {}, a.cookie, "GET")).body.customer.email, "test@example.com");
  await collections.orders.insertOne({ id: "LC-OWN", customerId: stored.id, adminNote: "private", customer: { email: stored.email } });
  await collections.orders.insertOne({ id: "LC-GUEST", customer: { email: "TEST@example.com" } });
  await collections.orders.insertOne({ id: "LC-OTHER", customerId: "someone-else", customer: { email: "other@example.com" } });
  assert.equal((await request("orders", {}, a.cookie, "GET")).body.orders.length, 1);
  assert.equal((await request("orders/LC-OTHER", {}, a.cookie, "GET")).status, 404);
  assert(!("adminNote" in (await request("orders/LC-OWN", {}, a.cookie, "GET")).body.order));
  const code = emails[0].order.accountCode;
  assert.match(code, /^\d{6}$/);
  assert(!JSON.stringify(stored.verification).includes(code));
  assert.equal((await request("verify-code", { code })).status, 401);
  assert.equal((await request("resend-verification", {}, a.cookie)).status, 429);
  assert.equal((await request("verify-code", { code: "000000" }, a.cookie)).status, 400);
  const verified = await request("verify-code", { code }, a.cookie); assert.equal(verified.status, 200);
  assert.equal((await request("orders", {}, a.cookie, "GET")).body.orders.length, 2);
  assert.equal((await request("verify-code", { code }, a.cookie)).status, 400);
  await request("forgot-password", { email: stored.email });
  const reset = new URL(emails.at(-1).order.accountUrl).searchParams.get("reset");
  const changed = await request("reset-password", { token: reset, password: "A-new-strong-password" }); assert.equal(changed.status, 200);
  assert.equal((await request("me", {}, a.cookie, "GET")).status, 401);
  assert.equal((await request("reset-password", { token: reset, password: "Another-password" })).status, 400);
  assert.equal((await request("login", { email: stored.email, password: "Strong-test-password-1" })).status, 401);
  const login = await request("login", { email: stored.email, password: "A-new-strong-password" }); assert.equal(login.status, 200);
  for (let i = 0; i < 24; i++) await collections.orders.insertOne({ id: `LC-PAGE-${String(i).padStart(2, "0")}`, customerId: stored.id, createdAt: new Date(2026, 0, i + 1) });
  const firstPage = await request("orders", {}, login.cookie, "GET");
  const secondPage = await request("orders?page=1", {}, login.cookie, "GET");
  assert.equal(firstPage.body.orders.length, 20); assert.equal(firstPage.body.hasMore, true);
  assert.equal(secondPage.body.orders.length, 6); assert.equal(secondPage.body.hasMore, false);
  assert(!secondPage.body.orders.some(order => firstPage.body.orders.some(first => first.id === order.id)));
  assert.equal((await request("logout", {}, login.cookie)).status, 200);
  assert.equal((await request("me", {}, login.cookie, "GET")).status, 401);
  collections.customerSessions.rows.push({ _id: require("../lib/customers").digest("a".repeat(64)), customerId: stored.id, expiresAt: new Date(0) });
  assert.equal((await request("me", {}, "a".repeat(64), "GET")).status, 401);
  const b = await request("register", { name: "Code Limit", email: "limit@example.com", password: "Strong-test-password-2" });
  const limitedCode = emails.at(-1).order.accountCode;
  const attempts = await Promise.all(Array.from({ length: 5 }, () => request("verify-code", { code: "000000" }, b.cookie)));
  assert(attempts.every(result => result.status === 400));
  assert.equal((await request("verify-code", { code: limitedCode }, b.cookie)).status, 400);
  const limited = collections.customers.rows.find(row => row.email === "limit@example.com");
  limited.verification.sentAt = new Date(0);
  assert.equal((await request("resend-verification", {}, b.cookie)).status, 200);
  limited.verification.expiresAt = new Date(0);
  assert.equal((await request("verify-code", { code: emails.at(-1).order.accountCode }, b.cookie)).status, 400);
  for (let i = 0; i < 21; i++) await request("forgot-password", { email: "missing@example.com" });
  assert.equal((await request("forgot-password", { email: "missing@example.com" })).status, 429);
  const burst = await Promise.allSettled(Array.from({ length: 12 }, () => hashPassword("A-bounded-load-test-password")));
  assert.equal(burst.filter(result => result.status === "fulfilled").length, 8);
  assert(burst.filter(result => result.status === "rejected").every(result => result.reason.status === 503));
  assert(await hashPassword("A-password-after-the-burst"));
  console.log("Customer tests passed: signup, hashing, cookies, CSRF, ownership, OTP attempts/expiry/replay/cooldown, guest orders, pagination, single-use reset, session revocation and rate limits.");
}
module.exports = { MemoryCollection };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
