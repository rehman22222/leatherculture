"use strict";
// Explicit publication only: inserts this reviewed article without overwriting other content.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const article = require("../content/leather-jacket-price-pakistan");
const pageMetadata = require("../content/seo-page-metadata");
const fs = require("fs/promises");
const path = require("path");

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Use --apply to publish the reviewed price guide.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    const pages = db.collection(process.env.MONGODB_PAGES_COLLECTION || "pages");
    const before = await pages.find({ id: { $in: Object.keys(pageMetadata) } }, { projection: { _id: 0, id: 1, metaTitle: 1, metaDescription: 1, keywords: 1 } }).toArray();
    const backup = path.join(__dirname, "..", "docs", "seo-metadata-before.json");
    await fs.writeFile(backup, JSON.stringify(before, null, 2) + "\n", { flag: "wx" }).catch(error => { if (error.code !== "EEXIST") throw error; });
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const existing = await blogs.findOne({ slug: article.slug }, { session });
        if (existing) {
          if (existing.body === article.body && existing.status === "published") return;
          throw new Error("An article already uses this slug; refusing to overwrite it.");
        }
        const store = await settings.findOne({}, { projection: { _id: 1 }, session });
        if (!store) throw new Error("Store settings not found.");
        const products = await db.collection(process.env.MONGODB_PRODUCTS_COLLECTION || "products").find({ enabled: { $ne: false } }, { session }).toArray();
        const slugs = ["the-blade", "the-heritage", "the-vibe", "the-nomad", "the-rune"];
        if (!slugs.every(slug => products.some(p => p.slug === slug && Number(String(p.price).replace(/[^\d.]/g, "")) === 15000))) throw new Error("Catalogue prices changed; review the guide before publishing.");
        await blogs.insertOne({ ...article, createdAt: new Date(), updatedAt: new Date() }, { session });
        for (const [id, metadata] of Object.entries(pageMetadata)) {
          const update = await pages.updateOne({ id }, { $set: { ...metadata, updatedAt: new Date() } }, { session });
          if (update.matchedCount !== 1) throw new Error(`Page ${id} not found; publication cancelled.`);
        }
        await settings.updateOne({ _id: store._id }, { $inc: { revision: 1 }, $set: { updatedAt: new Date() } }, { session });
      });
    } finally { await session.endSession(); }
    console.log(`Published /blog/${article.slug}`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
