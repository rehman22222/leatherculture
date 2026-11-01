"use strict";
// One-off internal linking update, 2 November 2026:
//   node scripts/update-internal-links.js --apply
// Article-body links were uneven: no article linked to the gift guide, the care and size guides linked to no other guide,
// and only four articles linked to the jacket collection. Each edit adds one relevant link to existing text, or points a
// general shop link at the collection. A missing anchor stops the run with nothing written, and running it again changes
// nothing. Replaced text is saved in docs/internal-links-before-2026-11-02.json. Blog pages are built at deploy, so these
// changes appear on the live site after the next deploy.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");
const fs = require("fs/promises");
const path = require("path");

const blog = (slug, text) => `<a href="/blog/${slug}">${text}</a>`;
const collection = text => `<a href="/collections/leather-jackets">${text}</a>`;
const after = (slug, anchor, add) => ({ slug, from: anchor, to: `${anchor} ${add}` });
const swap = (slug, from, to) => ({ slug, from, to });

const GIFT = "leather-jacket-gift-for-him-pakistan", FAUX = "original-leather-vs-faux-leather-pakistan", WEAR = "how-to-wear-leather-jacket-men-pakistan";
const CHECKLIST = "original-leather-online-pakistan-checklist", STYLES = "mens-leather-jacket-styles-pakistan", CHOOSE = "how-to-choose-leather-jacket-pakistan";
const PRICE = "leather-jacket-price-pakistan", SIZE = "leather-jacket-size-guide", CARE = "leather-jacket-care-pakistan", REAL = "real-leather-vs-faux-leather", MINIMAL = "minimal-street-style";

const edits = [
  // The gift guide had no links from any article.
  after(STYLES, "The best choice still depends on the clothes and occasions you have most often.", `Buying for someone else? Our ${blog(GIFT, "leather jacket gift guide")} covers finding his size without asking.`),
  after(PRICE, "Choose the shape and layering room first, then decide which colour works with the clothes you already own.", `Buying it as a present? See our ${blog(GIFT, "gift guide for him")}.`),
  after(SIZE, "It is the hardest one to do alone and the most important one to get right.", `Planning a surprise? Our ${blog(GIFT, "leather jacket gift guide")} explains how to work out his size.`),
  // The original versus faux comparison had one.
  after(REAL, "and you should not pay leather prices for it.", `Our ${blog(FAUX, "original leather vs faux leather comparison")} looks at how each holds up over five years.`),
  after(PRICE, "A smooth photograph does not establish whether a jacket is cowhide, sheepskin, another material or a coated imitation.", `Our ${blog(FAUX, "five-year value test")} compares original and faux leather in more depth.`),
  after(CHECKLIST, "Treat visual cues as clues to investigate, not a final verdict.", `If you are still deciding between materials, try our ${blog(FAUX, "original leather vs faux leather test")}.`),
  // The outfit guide had two.
  after(MINIMAL, "Plain colours do more work than prints, because they let the jacket be the piece people notice.", `Our ${blog(WEAR, "guide to wearing a leather jacket")} has outfits for each occasion.`),
  after(CHOOSE, `has more ideas.`, `For specific occasions, see ${blog(WEAR, "how to wear a leather jacket in Pakistan")}.`),
  // The online checklist and the styles guide had three each.
  after(REAL, "so the edge shows a clean plastic layer sitting over cloth.", `Shopping online, where you cannot touch it? Use our ${blog(CHECKLIST, "10-point original leather checklist")}.`),
  after(CHOOSE, "Buying a leather jacket online is now normal, and it can be just as safe as buying in a shop if you check a few things first.", `Our ${blog(CHECKLIST, "original leather online checklist")} goes through them one by one.`),
  after(MINIMAL, "Black or a deep brown, clean lines, no heavy hardware.", `Our ${blog(STYLES, "guide to men's jacket styles")} compares the main shapes.`),
  after(SIZE, "If your measurements fall between the two, pick by shoulder first.", `Our ${blog(STYLES, "men's leather jacket styles guide")} shows how fit changes between designs.`),
  // The care guide linked to no other guide.
  after(CARE, "A leather jacket should last you ten years, not one season.", `That starts with ${blog(CHOOSE, "choosing the right one")}.`),
  after(CARE, "None of that ruins leather, as long as you do a few simple things.", `Not sure what yours is made of? Our ${blog("pure-leather-types-pakistan", "pure leather types guide")} explains the differences.`),
  // The jacket collection is the page that should rank for shopping searches, so general shop links now lead to it.
  swap(PRICE, `<a href="/shop">LeatherCulture jacket collection</a>`, collection("LeatherCulture jacket collection")),
  after(CHOOSE, "Each design is photographed from every angle and delivered across Pakistan with cash on delivery.", `See them all in our ${collection("leather jacket collection")}.`),
  swap(GIFT, `Explore <a href="/shop">the LeatherCulture collection</a> to find`, `Explore ${collection("the LeatherCulture collection")} to find`),
  swap(WEAR, `<a href="/shop">the LeatherCulture collection</a>, with every design`, `${collection("the LeatherCulture collection")}, with every design`),
  after(STYLES, "Use it to narrow your choices, then read the individual product page for the current price, sizing, material information and availability.", `All five are in our ${collection("leather jacket collection")}.`),
  swap(CARE, `You can see what is in stock on the <a href="/shop">shop page</a>.`, `You can see what is in stock in our ${collection("leather jacket collection")}.`),
  after(SIZE, "The hem sits at your belt or just below.", `Compare those points with the photos of each design in our ${collection("leather jacket collection")}.`),
  swap(REAL, `Have a look at the <a href="/shop">current collection</a>`, `Have a look at the ${collection("current collection")}`),
  swap(MINIMAL, `<a href="/shop">See what is in stock</a>`, collection("See what is in stock"))
];

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the changes in this file, then rerun with --apply.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const blogs = db.collection(process.env.MONGODB_BLOGS_COLLECTION || "blogs");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    const posts = await blogs.find({ slug: { $in: [...new Set(edits.map(item => item.slug))] } }).toArray();
    const bodies = new Map();
    const applied = [];
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

    // The first run holds the true originals, so a later run only adds what it changed.
    const file = path.join(__dirname, "..", "docs", "internal-links-before-2026-11-02.json");
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
    console.log(`Added or repointed ${applied.length} links in ${bodies.size} posts; store revision incremented.`);
    for (const slug of bodies.keys()) console.log(` - ${slug}`);
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
