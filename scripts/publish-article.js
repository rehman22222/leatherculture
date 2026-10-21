"use strict";
// Explicit publication of one reviewed article from content/<slug>.js:
//   node scripts/publish-article.js <slug> --apply
// Inserts the article without touching other content, refuses to overwrite an existing slug, and bumps
// the settings revision so an admin tab opened earlier cannot save over it.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const path = require("path");

async function main() {
  const slug = process.argv.slice(2).find(arg => !arg.startsWith("--"));
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Usage: node scripts/publish-article.js <slug> --apply");
  const article = require(path.join(__dirname, "..", "content", slug));
  if (article.slug !== slug || !article.title || !article.body) throw new Error(`content/${slug}.js is not a complete article.`);
  if (!process.argv.includes("--apply")) throw new Error(`Review content/${slug}.js, then rerun with --apply to publish it.`);

  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    const session = client.startSession();
    let published = false;
    try {
      await session.withTransaction(async () => {
        const existing = await blogs.findOne({ $or: [{ slug }, { _id: article.id }] }, { session });
        if (existing) {
          if (existing.body === article.body && existing.status === "published") return;
          throw new Error("An article already uses this slug; refusing to overwrite it.");
        }
        const store = await settings.findOne({}, { projection: { _id: 1 }, session });
        if (!store) throw new Error("Store settings not found.");
        // _id matches the id, as the admin's own saves store it
        await blogs.insertOne({ _id: article.id, ...article, createdAt: new Date(), updatedAt: new Date() }, { session });
        await settings.updateOne({ _id: store._id }, { $inc: { revision: 1 }, $set: { updatedAt: new Date() } }, { session });
        published = true;
      });
    } finally { await session.endSession(); }
    console.log(published ? `Published /blog/${slug}` : `/blog/${slug} is already published with this text.`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
