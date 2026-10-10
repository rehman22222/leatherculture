"use strict";

// One-off catalogue migration. It changes products only: blog posts, pages,
// orders, customers and all other collections remain untouched.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const jackets = require("../lib/jacket-collection");

const apply = process.argv.includes("--apply");
const approvedIds = jackets.map((jacket) => jacket.id);

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing in .env.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const products = client
      .db(process.env.MONGODB_DB_NAME || "Leater-store")
      .collection(process.env.MONGODB_PRODUCTS_COLLECTION || "products");
    const existing = await products.find({}, { projection: { _id: 1, id: 1, slug: 1, name: 1 } }).toArray();
    const removed = existing.filter((product) => !approvedIds.includes(product.id));

    console.log(JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      keep: jackets.map(({ name, slug }) => ({ name, slug })),
      remove: removed.map(({ name, slug }) => ({ name, slug })),
      blogPostsChanged: false
    }, null, 2));

    if (!apply) return;

    const now = new Date();
    await products.deleteMany({ id: { $nin: approvedIds } });
    await products.bulkWrite(jackets.map((jacket, order) => ({
      updateOne: {
        filter: { id: jacket.id },
        update: {
          $set: { ...jacket, id: jacket.id, order, updatedAt: now },
          $setOnInsert: { createdAt: now }
        },
        upsert: true
      }
    })));

    const finalProducts = await products.find({}, { projection: { _id: 0, id: 1, slug: 1, name: 1, enabled: 1 } }).sort({ order: 1 }).toArray();
    if (finalProducts.length !== jackets.length || finalProducts.some((product, index) => product.id !== approvedIds[index])) {
      throw new Error("Catalogue verification failed; expected only the five approved jackets.");
    }
    console.log(`Catalogue updated: ${finalProducts.length} jackets remain. Blogs were not changed.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
