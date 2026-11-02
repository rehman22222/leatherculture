"use strict";
// One-off internal linking update, 3 November 2026. Run after the leather bag guide is published:
//   node scripts/update-bag-guide-links.js --apply
// Adds one relevant link to the guide from each of four articles that already discuss bags. A missing anchor stops the run
// with nothing written, and running it again changes nothing. Added text is saved in docs/bag-guide-links-before-2026-11-03.json.
// Blog pages are built at deploy, so these links appear on the live site after the next deploy.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

const link = text => `<a href="/blog/original-leather-bags-pakistan">${text}</a>`;
const after = (slug, anchor, add) => ({ slug, from: anchor, to: `${anchor} ${add}` });
const edits = [
  after("pure-leather-types-pakistan", "so it is a poor match for a bag that gets thrown around or a jacket worn on a motorbike.", `Our ${link("leather bag guide")} matches each hide to each kind of bag.`),
  after("original-leather-online-pakistan-checklist", "On a bag, look at handles, attachment points, strap edges and the base.", `Our ${link("seven-point leather bag check")} goes through each one.`),
  after("original-leather-vs-faux-leather-pakistan", "<strong>Leather bags:</strong> Think beyond the front view.", `Our ${link("guide to original leather bags")} shows where a bag fails first.`),
  after("where-to-buy-original-leather-pakistan", "Use this to check for original leather at any shop, in any city.", `Buying a bag instead of a jacket? Add our ${link("seven bag checks")}.`)
];

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the changes in this file, then rerun with --apply.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    if (!await blogs.findOne({ slug: "original-leather-bags-pakistan", status: "published" }, { projection: { _id: 1 } })) throw new Error("Publish the leather bag guide first, so these links do not point at a missing page.");
    const posts = await blogs.find({ slug: { $in: edits.map(item => item.slug) } }).toArray();
    const bodies = new Map(), applied = [];
    for (const item of edits) {
      const post = posts.find(entry => entry.slug === item.slug);
      if (!post) throw new Error(`Post not found: ${item.slug}`);
      if (post.body.includes(item.to)) continue;
      if (post.body.split(item.from).length !== 2) throw new Error(`${item.slug}: expected exactly one anchor: ${item.from.slice(0, 80)}`);
      bodies.set(item.slug, post.body.replace(item.from, item.to));
      applied.push(item);
    }
    if (!bodies.size) return console.log("Nothing to change: the links are already in place.");
    const file = path.join(__dirname, "..", "docs", "bag-guide-links-before-2026-11-03.json");
    const earlier = await fs.readFile(file, "utf8").then(JSON.parse).catch(() => null);
    await fs.writeFile(file, JSON.stringify({ savedAt: earlier?.savedAt || new Date().toISOString(), replacedText: [...(earlier?.replacedText || []), ...applied] }, null, 2) + "\n");
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        for (const [slug, body] of bodies) await blogs.updateOne({ slug }, { $set: { body, updatedAt: now } }, { session });
        const store = await settings.findOne({}, { projection: { _id: 1 }, session });
        if (!store) throw new Error("Store settings not found.");
        // A revision bump stops an admin tab opened earlier from saving older text over these changes.
        await settings.updateOne({ _id: store._id }, { $inc: { revision: 1 }, $set: { updatedAt: now } }, { session });
      });
    } finally { await session.endSession(); }
    console.log(`Added ${applied.length} links; store revision incremented.`);
    for (const slug of bodies.keys()) console.log(` - ${slug}`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
