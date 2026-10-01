"use strict";
// Explicit one-off launch update; normal startup only inserts missing products.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const products = require("../lib/jacket-collection");
async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Use --apply to publish the five owner-approved jackets at PKR 15,000, size L, stock 5.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB_NAME || "Leater-store").collection(process.env.MONGODB_PRODUCTS_COLLECTION || "products");
    for (const product of products) {
      const existing = await collection.findOne({ id: product.id, slug: product.slug });
      if (!existing) throw new Error(`Expected jacket draft missing: ${product.slug}`);
      if (existing.variants?.length !== 1 || existing.variants[0].id !== product.variants[0].id) throw new Error(`Review changed variants before publishing ${product.slug}`);
    }
    for (const product of products) {
      await collection.updateOne({ id: product.id, slug: product.slug }, { $set: { enabled: true, price: product.price, size: "L", "variants.0.name": product.variants[0].name, "variants.0.size": "L", "variants.0.sku": product.variants[0].sku, "variants.0.stock": 5, "variants.0.enabled": true, launchNotes: product.launchNotes, updatedAt: new Date() } });
    }
    const records = await collection.find({ id: { $in: products.map(p => p.id) } }, { projection: { _id: 0, slug: 1, price: 1, enabled: 1, "variants.name": 1, "variants.stock": 1, "variants.enabled": 1 } }).toArray();
    console.log(JSON.stringify(records, null, 2));
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
