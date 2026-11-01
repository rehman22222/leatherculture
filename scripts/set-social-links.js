"use strict";
// Saves the owner's social profiles, supplied on 2 November 2026:
//   node scripts/set-social-links.js --apply
// These are the same fields as Admin's footer socials. They drive the footer links, the mobile side tab and the sameAs
// profiles in the site's schema. Tracking parameters are removed from the shared links. The previous values are printed.
// Pages are built at deploy, so the links appear on the live site after the next deploy.
require("dotenv").config({ quiet: true });
const { MongoClient } = require("mongodb");

const socials = {
  instagram: "https://www.instagram.com/leatherculturepk/",
  facebook: "https://www.facebook.com/share/1B7quR6iR8/"
};

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Review the links in this file, then rerun with --apply.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || "Leater-store");
    const settings = db.collection(process.env.MONGODB_SETTINGS_COLLECTION || "leater store");
    const store = await settings.findOne({}, { projection: { "footer.socials": 1 } });
    if (!store?.footer) throw new Error("Store footer settings not found.");
    const current = store.footer.socials || {};
    if (Object.entries(socials).every(([key, url]) => current[key] === url)) return console.log("Nothing to change: the links are already saved.");
    console.log("Previous values:", JSON.stringify({ instagram: current.instagram, facebook: current.facebook }));
    // A revision bump stops an admin tab opened earlier from saving older values over these.
    await settings.updateOne({ _id: store._id }, { $set: { "footer.socials.instagram": socials.instagram, "footer.socials.facebook": socials.facebook, updatedAt: new Date() }, $inc: { revision: 1 } });
    console.log("Saved Instagram and Facebook; store revision incremented.");
  } finally { await client.close(); }
}
main().catch(error => { console.error(error.name === "MongoServerSelectionError" ? "Could not connect to the store database." : error.message); process.exitCode = 1; });
