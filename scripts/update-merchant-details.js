"use strict";
// Apply only the owner-confirmed public contact, delivery and return details.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");
const details = require("../content/merchant-settings");
async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Use --apply to publish the confirmed merchant details.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const stores = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const before = await stores.findOne({});
    if (!before) throw new Error("Store settings not found");
    const keys = Object.keys(details.checkout);
    const backup = { email: before.footer?.email, checkout: Object.fromEntries(keys.map(key => [key, before.checkout?.[key] ?? null])) };
    await fs.writeFile(path.join(__dirname, "..", "docs", "merchant-details-before.json"), JSON.stringify(backup, null, 2) + "\n", { flag: "wx" }).catch(error => { if (error.code !== "EEXIST") throw error; });
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const update = { "footer.email": details.email, updatedAt: new Date() };
        for (const [key, value] of Object.entries(details.checkout)) update[`checkout.${key}`] = value;
        // Keep text groups aligned with checkout; unrelated admin changes stay untouched.
        const current = await stores.findOne({ _id: before._id }, { session });
        for (const [key, value] of Object.entries(current.content?.values || {})) {
          if (typeof value === "string" && value.includes("info@leatherculture.shop")) update[`content.values.${key}`] = value.replaceAll("info@leatherculture.shop", details.email);
        }
        update["content.values.a496f4bd68"] = details.checkout.returnsPolicy;
        await stores.updateOne({ _id: before._id }, { $set: update, $inc: { revision: 1 } }, { session });
        const posts = await blogs.find({}, { session }).toArray();
        for (const post of posts) {
          const changes = {};
          for (const field of ["body", "excerpt"]) {
            if (typeof post[field] === "string" && post[field].includes("info@leatherculture.shop")) changes[field] = post[field].replaceAll("info@leatherculture.shop", details.email);
          }
          if (post.slug === "leather-jacket-price-pakistan") {
            const paragraph = require("../content/leather-jacket-price-pakistan").body.match(/<p>Check the <a href="\/terms#returns">[\s\S]*?<\/p>/)[0];
            const body = changes.body || post.body;
            changes.body = body.replace(/<p>Ask about exchanges before payment,[\s\S]*?<\/p>|<p>Check the <a href="\/terms#returns">[\s\S]*?<\/p>/, paragraph);
          }
          if (Object.keys(changes).length) await blogs.updateOne({ _id: post._id }, { $set: { ...changes, updatedAt: new Date() } }, { session });
        }
      });
    } finally { await session.endSession(); }
    console.log("Published owner-confirmed contact and merchant details; store revision incremented.");
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
