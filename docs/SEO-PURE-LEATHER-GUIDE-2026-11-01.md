# Pure leather guide and SEO fixes: 1 November 2026

**Article:** https://www.leatherculture.shop/blog/pure-leather-types-pakistan
**Market:** Pakistan, in English with a short Roman Urdu section
**Source file:** `content/pure-leather-types-pakistan.js`

## Why this topic

Existing journal posts cover online checks, the faux comparison, price, care, size and style. Hide types only had one section inside the jacket-choosing guide, so a dedicated guide adds something new without competing with those posts.

Google's search suggestions for Pakistan show people searching for pure leather types, sheep versus cow leather, which leather suits each item, and Roman Urdu phrases such as "leather ki pehchan kaise kare". The full list is in `seo-research-2026-11-01.json`. Suggestions show that a term is searched, not how often, so no traffic forecast is made.

The Pakistani guides found in DuckDuckGo's Pakistan region (Waji's, House of Leather, Liner, Vceela, Khas, Novado, Zameen) are mostly grade lists. This guide uses a different structure: a three-question label test, a decoder for local listing phrases, a choice by item and by city, a copy-ready seller message, and Roman Urdu help.

Live Google rankings for Pakistan could not be checked from this environment. Bing's automated results were unusable and DuckDuckGo stopped responding after two queries.

## Original writing check

The word-overlap check compared the article against 27 competitor pages (47,256 words) and the 11 earlier journal posts. A word counts as matched when it sits inside a run of consecutive words that also appears, word for word, in a source. The article text checked was 4,539 words.

| Run length | Competitor pages | Own posts | Combined |
|---:|---:|---:|---:|
| 4 words | 5.2% | 5.8% | 9.8% |
| 5 words | 1.2% | 2.9% | 4.1% |
| 6 words | 0.1% | 1.1% | 1.3% |
| 8 words | 0% | 0% | 0% |

**This is a local estimate, not a certified plagiarism score.** No commercial checker was available. Turnitin, Copyscape and Grammarly use larger databases and different thresholds, so their percentage will differ. Run the article through one of them if a certified figure is needed.

## Media

All media was generated for this article. Nothing is a stock photo or a photograph of a product. Leather textures are procedural illustrations and are captioned as such.

| File in `assets/blog/` | Use | Size |
|---|---|---:|
| `pure-leather-types-pakistan.webp` | Cover, 1600 x 900 | 96 KB |
| `pure-leather-types-pakistan.jpg` | Link preview, 1200 x 630 | 99 KB |
| `pure-leather-types-pakistan-card.webp` | Journal card, 800 x 600 | 40 KB |
| `pure-leather-label-test.webp` | Three-question graphic, 1200 x 1200 | 56 KB |
| `pure-leather-hide-comparison.webp` | Hide comparison, 1200 x 1200 | 124 KB |
| `pure-leather-hide-layers.webp` | Layer diagram, 1200 x 1240 | 98 KB |
| `pure-leather-layers-explainer.mp4` | Silent explainer, 18 s, 1080 x 1080 | 532 KB |
| `pure-leather-layers-explainer-poster.webp` | Video poster | 48 KB |

## Site-wide fixes

| Problem found | Fix |
|---|---|
| The homepage H1 in the raw HTML read "Premium leather leather jackets", because a saved phrase replaced one word of the headline | The build no longer replaces single words inside motion headlines |
| The homepage canonical had no trailing slash, unlike the sitemap | The canonical and `og:url` now match the sitemap |
| The jacket collection and the homepage shared one title | The collection is now "Buy Leather Jackets Online in Pakistan \| LeatherCulture" |
| Seven pages shared WebP link previews, which WhatsApp and other apps do not reliably show | Added JPEG versions and the build now prefers them |
| Two meta descriptions were 189 and 177 characters | Shortened to fit |
| "More from the journal" always showed the three newest guides | It now shows the most closely related guides |
| On phones, the sticky article header covered about a fifth of the screen | The header scrolls away on phones |
| Generated pages mixed `en` and `en-PK` | Storefront pages now use `en-PK` |
| Journal cards loaded full-size covers for the two newest guides | Added 800 x 600 card images |
| In browser tests no Google Analytics hit left the page, because the security policy blocked `analytics.google.com`, `www.google.com` and `stats.g.doubleclick.net` | Added those three hosts to `connect-src`, with a check in `verify:seo` |
| `/favicon.ico` returned 404 while the homepage linked to it. Google shows this icon beside results | Added a real `favicon.ico` made from the brand mark |

The new guide was added to every product page's guide list. It has 14 inbound internal links, and the lowest count for any guide rose from 3 to 4.

## Database changes

`scripts/publish-article.js` inserted the article. `scripts/update-seo-links.js` added nine contextual links, shortened two descriptions and changed the collection title. The original values and every added sentence are in `seo-updates-before-2026-11-01.json`, so the changes can be reversed. Each script increments the store revision, so an admin tab opened earlier cannot save older text over them.

## Verification before deployment

- `npm run build`, `npm run verify:seo` (25 pages) and `npm run verify:commerce` all pass.
- `scripts/audit-storefront.js` reports only links to the three "coming soon" collections. Those pages are deliberately `noindex` and stay out of the sitemap.
- Browser checks at 360, 390 and 1440 pixels on eight key pages found no horizontal overflow, no failed local requests and exactly one H1 on each page. The article was also checked at 820 pixels, and the video plays.

## Production Lighthouse results

Simulated mobile run on the live site, before the Analytics and favicon fix. These are lab figures, not real-user data.

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| Guide | 99 | 100 | 93 | 100 | 2.0 s | 0 |
| Homepage | 81 | 99 | 93 | 100 | 3.1 s | 0 |

## Known and not changed

- Homepage LCP on simulated mobile is 3.1 seconds, above the 2.5-second target.
- The homepage logs React error 418, a hydration mismatch. It is also present on the live site from before this work. The final page content is correct.
- Four older guides still use leftover template covers, including a hoodie on the real-versus-faux guide.

## Needs the owner

1. **Confirm each jacket's hide, layer and finish.** Product records have an empty material field, so the site cannot honestly claim "pure cow" or "full grain" for any jacket. This is the biggest remaining gap for material searches. Once confirmed, update the listings and the "Use the same message on us" paragraph in the guide.
2. **Request indexing in Search Console** for the guide URL, and confirm the sitemap is submitted. This environment has no Search Console access.
3. **Add real social profile links** in admin. The footer still holds placeholders, so the schema has no `sameAs` profiles.
4. **Earn links from Pakistani sites.** An earlier report found authority 5 and 20 referring domains. On-page work cannot replace these links, and no ranking is guaranteed.
