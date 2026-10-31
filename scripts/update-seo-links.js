"use strict";
// One-off SEO update, 1 November 2026. Run after the pure leather guide is published:
//   node scripts/update-seo-links.js --apply
// Links related guides to it and to the men's styles guide, shortens two meta descriptions and gives the jacket
// collection a title of its own. Every change is checked first, so a missing anchor stops the run with nothing written. Running it again
// changes nothing. The previous values are saved in docs/seo-updates-before-2026-11-01.json.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

const GUIDE = "/blog/pure-leather-types-pakistan";
const STYLES = "/blog/mens-leather-jacket-styles-pakistan";
const link = (text, href = GUIDE) => `<a href="${href}">${text}</a>`;
const links = [
  { slug: "how-to-choose-leather-jacket-pakistan", after: "The right one depends on how and where you plan to wear the jacket.", add: ` Our ${link("guide to pure leather types in Pakistan")} compares each animal, layer and finish in more depth.` },
  { slug: "leather-jacket-price-pakistan", after: " if you need those details before paying.", add: ` Our ${link("guide to pure leather types")} explains what those details mean.` },
  { slug: "original-leather-online-pakistan-checklist", after: "and is the listing transparent enough for me to decide?”", add: ` Our ${link("guide to the types of pure leather")} breaks that question into animal, layer and finish.` },
  { slug: "original-leather-vs-faux-leather-pakistan", after: "rather than treating every leather-related label as identical.", add: ` For the differences inside that broad label, see our ${link("pure leather types guide")}.` },
  { slug: "real-leather-vs-faux-leather", after: "This is the quickest tell.", add: ` If the grain looks natural, the next question is which kind of leather it is: our ${link("guide to pure leather types")} compares cow, buffalo, goat and sheep.` },
  { slug: "mens-leather-jacket-styles-pakistan", after: "ask the seller about any detail that affects your purchase.", add: ` Our ${link("guide to original and pure leather types")} lists the questions worth asking.` },
  { slug: "how-to-choose-leather-jacket-pakistan", after: "Knowing their names makes it far easier to describe what you want and to compare like with like.", add: ` Our ${link("guide to men's leather jacket styles", STYLES)} looks at five designs in more detail.` },
  { slug: "how-to-wear-leather-jacket-men-pakistan", after: "Use this table as a starting point, then adjust to your own taste.", add: ` If you are still choosing a shape, start with these ${link("five men's leather jacket styles", STYLES)}.` },
  { slug: "leather-jacket-gift-for-him-pakistan", after: "Look at his wardrobe for a minute and match it to one of these profiles.", add: ` Our ${link("men's leather jacket styles guide", STYLES)} explains each design in more detail.` }
];
const descriptions = {
  "original-leather-online-pakistan-checklist": "Buying original leather online in Pakistan? Use this 10-point checklist to assess listings, ask better questions and order jackets or bags with confidence.",
  "mens-leather-jacket-styles-pakistan": "Compare five men's leather jacket styles: collared, stand-collar, hooded, asymmetric and contrast-panel. Find the shape that suits your wardrobe in Pakistan."
};
const collectionTitle = "Buy Leather Jackets Online in Pakistan | LeatherCulture";

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the changes in this file, then rerun with --apply.");
  for (const [slug, text] of Object.entries(descriptions)) if (text.length > 160) throw new Error(`${slug}: description is ${text.length} characters`);
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const categories = db.collection(process.env.MONGODB_CATEGORIES_COLLECTION || "categories");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    if (!await blogs.findOne({ slug: "pure-leather-types-pakistan", status: "published" }, { projection: { _id: 1 } })) throw new Error("Publish the pure leather guide first, so these links do not point at a missing page.");

    const posts = await blogs.find({ slug: { $in: [...new Set([...links.map(item => item.slug), ...Object.keys(descriptions)])] } }).toArray();
    const before = { savedAt: new Date().toISOString(), addedSentences: links.map(({ slug, add }) => ({ slug, add })), metaDescriptions: {}, collectionTitle: null };
    const changes = new Map();
    const bodies = new Map();
    for (const item of links) {
      const post = posts.find(entry => entry.slug === item.slug);
      if (!post) throw new Error(`Post not found: ${item.slug}`);
      const body = bodies.get(item.slug) ?? post.body;
      if (body.includes(item.add)) continue;
      if (body.split(item.after).length !== 2) throw new Error(`${item.slug}: expected exactly one anchor: ${item.after}`);
      bodies.set(item.slug, body.replace(item.after, item.after + item.add));
    }
    for (const [slug, body] of bodies) changes.set(slug, { ...(changes.get(slug) || {}), body });
    for (const [slug, text] of Object.entries(descriptions)) {
      const post = posts.find(entry => entry.slug === slug);
      if (!post) throw new Error(`Post not found: ${slug}`);
      before.metaDescriptions[slug] = post.metaDescription;
      if (post.metaDescription !== text) changes.set(slug, { ...(changes.get(slug) || {}), metaDescription: text });
    }
    const jackets = await categories.findOne({ slug: "leather-jackets" });
    if (!jackets) throw new Error("Leather jackets category not found.");
    before.collectionTitle = jackets.metaTitle;
    const updateCollection = jackets.metaTitle !== collectionTitle;

    if (!changes.size && !updateCollection) return console.log("Nothing to change: the SEO updates are already applied.");
    // The first run holds the true originals, so later runs only extend its list of added sentences.
    const backup = path.join(__dirname, "..", "docs", "seo-updates-before-2026-11-01.json");
    const earlier = await fs.readFile(backup, "utf8").then(JSON.parse).catch(() => null);
    await fs.writeFile(backup, JSON.stringify(earlier ? { ...earlier, addedSentences: before.addedSentences } : before, null, 2) + "\n");

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        for (const [slug, fields] of changes) await blogs.updateOne({ slug }, { $set: { ...fields, updatedAt: now } }, { session });
        if (updateCollection) await categories.updateOne({ _id: jackets._id }, { $set: { metaTitle: collectionTitle, updatedAt: now } }, { session });
        const store = await settings.findOne({}, { projection: { _id: 1 }, session });
        if (!store) throw new Error("Store settings not found.");
        // A revision bump stops an admin tab opened earlier from saving older text over these changes.
        await settings.updateOne({ _id: store._id }, { $inc: { revision: 1 }, $set: { updatedAt: now } }, { session });
      });
    } finally { await session.endSession(); }
    console.log(`Updated ${changes.size} posts${updateCollection ? " and the jacket collection title" : ""}; store revision incremented.`);
    for (const [slug, fields] of changes) console.log(` - ${slug}: ${Object.keys(fields).join(", ")}`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
