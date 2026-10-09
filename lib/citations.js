"use strict";
// Published sources behind the journal's care, sizing and material advice. Quotes are verbatim from
// the linked pages (CCI checked 2026-10-10; FTC text from 16 CFR 24.2, 2023 edition).
const CCI = {
  title: "Caring for leather, skin and fur",
  publisher: "Canadian Conservation Institute, Government of Canada",
  url: "https://www.canada.ca/en/conservation-institute/services/preventive-conservation/guidelines-collections/caring-leather-skin-fur.html"
};
const FTC = {
  title: "Guides for Select Leather and Imitation Leather Products, 16 CFR 24.2",
  publisher: "US Federal Trade Commission",
  url: "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-24/section-24.2"
};
const ISO_LEATHER = {
  title: "ISO 15115:2019 Leather - Vocabulary",
  publisher: "International Organization for Standardization",
  url: "https://www.iso.org/standard/67424.html",
  note: "The international standard that defines the terms used in the leather industry."
};
const ISO_SIZING = {
  title: "ISO 8559-1:2017 Size designation of clothes - Part 1: Anthropometric definitions for body measurement",
  publisher: "International Organization for Standardization",
  url: "https://www.iso.org/standard/61686.html",
  note: "The international standard that defines how body measurements for clothing sizes are taken."
};

const postSources = {
  "leather-jacket-care-pakistan": [
    { ...CCI, quotes: [
      "Infrared radiation causes heating and problems such as desiccation within the skin material.",
      "An RH above 65% is favourable for mould to grow on leather, skins, furs and parchment.",
      "In storage, wrap or cover objects with humidity-buffering materials such as cotton or acid-free (non-buffered) tissue."
    ] }
  ],
  "real-leather-vs-faux-leather": [
    { ...FTC, note: "These US guides cover leather goods such as bags, footwear and belts.", quotes: [
      "If all or part of an industry product is made of non-leather material that appears to be leather, the fact that the material is not leather, or the general nature of the material as something other than leather, should be disclosed.",
      "A material in an industry product that contains ground, pulverized, shredded, reconstituted, or bonded leather and thus is not wholly the hide of an animal should not be represented, directly or by implication, as being leather."
    ] },
    ISO_LEATHER
  ],
  "leather-jacket-size-guide": [ISO_SIZING]
};

// Admin "Sources" field: one source per line as "Title | URL" or "Title | URL | Publisher".
function parseSources(value) {
  if (Array.isArray(value)) return value.filter(item => item && item.title && item.url);
  return String(value || "").split(/\r?\n/).map(line => line.split("|").map(part => part.trim())).filter(([title, url]) => title && /^https?:\/\//i.test(url || "")).map(([title, url, publisher]) => ({ title, url, publisher: publisher || "" }));
}

function sourcesFor(post) {
  const own = parseSources(post?.sources);
  return own.length ? own : postSources[post?.slug] || [];
}

module.exports = { CCI, FTC, ISO_LEATHER, ISO_SIZING, postSources, parseSources, sourcesFor };
