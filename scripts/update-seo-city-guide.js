"use strict";
// One-off SEO and accuracy update, 2 November 2026. Run after the city guide is published:
//   node scripts/update-seo-city-guide.js --apply
// Links related guides to the new city guide, replaces four leftover template covers, and corrects older posts that
// still named retired products or an old price range. Two owner claims are left for the owner to decide: see the report.
// Every edit is checked first, so a missing anchor stops the run with nothing written. Running it again changes nothing.
// Each replaced sentence and the previous cover values are saved in docs/seo-updates-before-2026-11-02.json.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

const GUIDE = "/blog/where-to-buy-original-leather-pakistan";
const TODAY = "2026-11-02";
const link = text => `<a href="${GUIDE}">${text}</a>`;
const after = (slug, anchor, add) => ({ slug, from: anchor, to: anchor + add });

const edits = [
  after("pure-leather-types-pakistan", "its leather apparel factories sit mainly in Karachi and Sialkot.", ` Our ${link("city guide to buying original leather")} explains what that means for shoppers.`),
  after("leather-jacket-price-pakistan", "instead of choosing between two similar black jackets on appearance alone.", ` Our ${link("city-by-city guide to original leather")} shows what jackets were listed for in Sialkot, Lahore and Rawalpindi.`),
  after("original-leather-online-pakistan-checklist", "a seller should be able to tell you what they are selling when that information affects your purchase.", ` Our ${link("guide to where to buy original leather in Pakistan")} explains what a city name can and cannot tell you.`),
  after("how-to-choose-leather-jacket-pakistan", "lists measurements and states what the jacket is made of.", ` Comparing markets? See ${link("where to buy original leather in Pakistan")}.`),
  after("original-leather-vs-faux-leather-pakistan", "should always take priority over broad material assumptions.", ` The same goes for city names, as our ${link("Sialkot, Karachi and Lahore buying guide")} shows.`),
  {
    slug: "real-leather-vs-faux-leather",
    from: `Our range runs from Rs 3,400 for a tee to Rs 24,900 for a structured coat, all cash on delivery. Have a look at the <a href="/shop">full collection</a>, or <a href="/contact">ask us anything</a> before you order.`,
    to: `Our current collection is leather jackets listed at Rs 15,000 each, all cash on delivery. Have a look at the <a href="/shop">current collection</a>, or <a href="/contact">ask us anything</a> before you order. Shopping in a bazaar instead? Use our <a href="${GUIDE}#market-test">ten-minute market test</a>.`
  },
  {
    slug: "leather-jacket-size-guide",
    from: `Our <a href="/shop/heavyweight-oversized-hoodie">Heavyweight Oversized Hoodie</a> is cut roomy already, so plan the jacket around it.`,
    to: `A heavy or oversized hoodie takes up even more room, so measure over the layer you will actually wear.`
  },
  {
    slug: "leather-jacket-size-guide",
    from: `Our men's pieces are cut straighter through the waist with a wider shoulder. Women's pieces like the <a href="/shop/structured-trench-coat">Structured Trench Coat</a> are shaped at the waist with a narrower shoulder and a shorter sleeve. If your measurements fall between the two, pick by shoulder first. Everything else has some room in it.`,
    to: `Men's cuts are usually straighter through the waist with a wider shoulder. Women's cuts are usually shaped at the waist with a narrower shoulder and a shorter sleeve. If your measurements fall between the two, pick by shoulder first.`
  },
  {
    slug: "minimal-street-style",
    from: `Ours that people reach for most is the <a href="/shop/structured-trench-coat">Structured Trench Coat</a> for a smarter look, or a plain leather jacket if you want something easier.`,
    to: `In our current collection, <a href="/shop/the-heritage">The Heritage</a> is the closest to that brief: chocolate brown, with a plain collar and a central zip.`
  },
  { slug: "minimal-street-style", from: `A <a href="/shop/classic-boxy-tee">heavy cotton tee</a> under a jacket`, to: `A heavy cotton tee under a jacket` },
  { slug: "minimal-street-style", from: `<a href="/shop/pleated-smart-trousers">Pleated trousers</a> or plain cargos`, to: `Pleated trousers or plain cargos` }
];

const covers = {
  "real-leather-vs-faux-leather": { coverImage: "/assets/blog/real-leather-vs-faux-leather.webp", coverAlt: "Two illustrated swatches on a dark background: a natural leather grain labelled real and a repeating printed pattern labelled faux", coverWidth: 1600, coverHeight: 900 },
  "leather-jacket-care-pakistan": { coverImage: "/assets/blog/leather-jacket-care-pakistan.webp", coverAlt: "Four illustrated badges on a leather background: keep it out of the sun, dry it slowly, condition twice a year and store it somewhere breathable", coverWidth: 1600, coverHeight: 900 },
  "leather-jacket-size-guide": { coverImage: "/assets/blog/leather-jacket-size-guide.webp", coverAlt: "Line drawing of a jacket on a leather background with shoulder, chest, length and sleeve measurements marked", coverWidth: 1600, coverHeight: 900 },
  "minimal-street-style": { coverImage: "/assets/blog/minimal-street-style.webp", coverAlt: "Flat illustration of a dark leather jacket laid out with a plain white tee and dark trousers", coverWidth: 1600, coverHeight: 900 }
};
const corrected = new Set(Object.keys(covers));

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the changes in this file, then rerun with --apply.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    if (!await blogs.findOne({ slug: "where-to-buy-original-leather-pakistan", status: "published" }, { projection: { _id: 1 } })) throw new Error("Publish the city guide first, so these links do not point at a missing page.");

    const posts = await blogs.find({ slug: { $in: [...new Set([...edits.map(item => item.slug), ...Object.keys(covers)])] } }).toArray();
    const backup = { savedAt: new Date().toISOString(), replacedText: [], covers: {} };
    const changes = new Map();
    const bodies = new Map();
    for (const item of edits) {
      const post = posts.find(entry => entry.slug === item.slug);
      if (!post) throw new Error(`Post not found: ${item.slug}`);
      const body = bodies.get(item.slug) ?? post.body;
      if (body.includes(item.to)) continue;
      if (body.split(item.from).length !== 2) throw new Error(`${item.slug}: expected exactly one anchor: ${item.from.slice(0, 80)}`);
      bodies.set(item.slug, body.replace(item.from, item.to));
      backup.replacedText.push(item);
    }
    for (const [slug, body] of bodies) changes.set(slug, { body });
    for (const [slug, fields] of Object.entries(covers)) {
      const post = posts.find(entry => entry.slug === slug);
      if (!post) throw new Error(`Post not found: ${slug}`);
      for (const file of [fields.coverImage, fields.coverImage.replace(".webp", ".jpg"), fields.coverImage.replace(".webp", "-card.webp")]) await fs.access(path.join(__dirname, "..", file));
      if (post.coverImage !== fields.coverImage) {
        backup.covers[slug] = { coverImage: post.coverImage, coverAlt: post.coverAlt, coverWidth: post.coverWidth ?? null, coverHeight: post.coverHeight ?? null, dateModified: post.dateModified ?? null };
        changes.set(slug, { ...(changes.get(slug) || {}), ...fields });
      }
      if (corrected.has(slug) && changes.has(slug)) changes.set(slug, { ...changes.get(slug), dateModified: TODAY });
    }
    if (!changes.size) return console.log("Nothing to change: the updates are already applied.");

    // The first run holds the true originals, so a later run only adds what it changed.
    const file = path.join(__dirname, "..", "docs", "seo-updates-before-2026-11-02.json");
    const earlier = await fs.readFile(file, "utf8").then(JSON.parse).catch(() => null);
    await fs.writeFile(file, JSON.stringify(earlier ? { ...earlier, replacedText: [...earlier.replacedText, ...backup.replacedText], covers: { ...backup.covers, ...earlier.covers } } : backup, null, 2) + "\n");

    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        for (const [slug, fields] of changes) await blogs.updateOne({ slug }, { $set: { ...fields, updatedAt: now } }, { session });
        const store = await settings.findOne({}, { projection: { _id: 1 }, session });
        if (!store) throw new Error("Store settings not found.");
        // A revision bump stops an admin tab opened earlier from saving older text over these changes.
        await settings.updateOne({ _id: store._id }, { $inc: { revision: 1 }, $set: { updatedAt: now } }, { session });
      });
    } finally { await session.endSession(); }
    console.log(`Updated ${changes.size} posts; store revision incremented.`);
    for (const [slug, fields] of changes) console.log(` - ${slug}: ${Object.keys(fields).join(", ")}`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
