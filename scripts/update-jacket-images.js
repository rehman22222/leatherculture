"use strict";
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const products = require("../lib/jacket-collection");
async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Use --apply to replace only jacket media and SEO copy.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const collection = client.db(process.env.MONGODB_DB_NAME || "Leater-store").collection(process.env.MONGODB_PRODUCTS_COLLECTION || "products");
    for (const product of products) {
      const existing = await collection.findOne({ id: product.id, slug: product.slug });
      if (!existing) throw new Error(`Missing product: ${product.slug}`);
      const update = { image: product.image, alt: product.alt, gallery: product.gallery, description: product.description, metaDescription: product.metaDescription, updatedAt: new Date() };
      for (let i = 0; i < (existing.variants || []).length; i++) {
        if (existing.variants[i].image === existing.image || existing.variants[i].image?.endsWith(`${product.slug}-design.jpg`)) {
          update[`variants.${i}.image`] = product.image;
          update[`variants.${i}.alt`] = product.alt;
        }
      }
      await collection.updateOne({ _id: existing._id }, { $set: update });
      console.log(`${product.slug}: ${product.gallery.length} gallery images updated; price, size and stock preserved.`);
    }
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
