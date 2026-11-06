"use strict";
// One-off internal linking update, 6 November 2026. Run after the wallet and belt guide is published:
//   node scripts/update-wallet-guide-links.js --apply
// Adds one relevant link to the guide from each of four articles. A missing anchor stops the run with nothing written, and
// running it again changes nothing. Added text is saved in docs/wallet-guide-links-before-2026-11-06.json.
// Blog pages are built at deploy, so these links appear on the live site after the next deploy.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

const link = text => `<a href="/blog/original-leather-wallets-belts-pakistan">${text}</a>`;
const after = (slug, anchor, add) => ({ slug, from: anchor, to: `${anchor} ${add}` });
const edits = [
  after("original-leather-bags-pakistan", "Do not burn it.</strong> Flame tests damage goods you have not bought, and they prove less than people think.", `For belts and wallets, our ${link("hole test for small leather goods")} is quicker.`),
  after("pure-leather-types-pakistan", "The result holds its shape, which suits belts, structured bags, formal shoes and jackets that will see daily wear.", `Our ${link("wallet and belt guide")} shows how to check a belt's construction.`),
  after("original-leather-online-pakistan-checklist", "For bags, check width, height, depth and strap drop against what you actually carry.", `For a belt or wallet, ask for a ${link("close photo inside a belt hole")}.`),
  after("leather-jacket-gift-for-him-pakistan", "A broad wooden hanger is a practical extra that helps the jacket keep its shape for years.", `If a wallet or belt suits him better, use our ${link("checks for original leather wallets and belts")}.`)
];

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the changes in this file, then rerun with --apply.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    if (!await blogs.findOne({ slug: "original-leather-wallets-belts-pakistan", status: "published" }, { projection: { _id: 1 } })) throw new Error("Publish the wallet and belt guide first, so these links do not point at a missing page.");
    const posts = await blogs.find({ slug: { $in: edits.map(item => item.slug) } }).toArray();
    const bodies = new Map(), applied = [];
    for (const item of edits) {
      const post = posts.find(entry => entry.slug === item.slug);
      if (!post) throw new Error(`Post not found: ${item.slug}`);
      const body = bodies.get(item.slug) ?? post.body;
      if (body.includes(item.to)) continue;
      if (body.split(item.from).length !== 2) throw new Error(`${item.slug}: expected exactly one anchor: ${item.from.slice(0, 80)}`);
      bodies.set(item.slug, body.replace(item.from, item.to));
      applied.push(item);
    }
    if (!bodies.size) return console.log("Nothing to change: the links are already in place.");
    const file = path.join(__dirname, "..", "docs", "wallet-guide-links-before-2026-11-06.json");
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
