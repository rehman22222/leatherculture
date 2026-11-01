# City buying guide and homepage fixes: 2 November 2026

**Article:** https://www.leatherculture.shop/blog/where-to-buy-original-leather-pakistan
**Market:** Pakistan, in English with a short Roman Urdu section
**Source file:** `content/where-to-buy-original-leather-pakistan.js`
**Data:** `seo-research-2026-11-02.json`

## Why this topic

The owner resent the original blog request after the pure leather guide went live, so it was treated as a request for a second post on a new topic.

Google's suggestions for Pakistan showed a large group of city searches with no page on the site: "which city is famous for leather in Pakistan", "sialkot leather jacket price", "leather jacket market saddar karachi", "leather jackets in panorama lahore" and "lwg certified tanneries in pakistan". The 83 seed phrases returned 368 distinct suggestions. Suggestions show that a phrase is searched, not how often, so no traffic forecast is made.

## Original research in the article

| Source | Read on 2 November 2026 | Main result |
|---|---|---|
| OLX Pakistan, neutral search phrases | 262 ads found, 99 kept, 84 presented as leather | 41 claim pure or original, 13 name one animal, 1 names a grade, 0 name a tannery, 0 mention returns |
| Leather garment association directories | 214 members with an address | Sialkot area 134, Karachi 57, Lahore 14 |
| Leather Working Group directory | 51 Pakistani sites of 2,170 listed | Karachi 25, Lahore area 11, Sialkot 8, Kasur 4, Multan 1, 2 unclear |

The ad sample is one marketplace on one day, and some sellers repeat their text. No seller is named or stored. The markets were not visited, so older market reports are dated in the text.

## Original writing check

The check compared 5,486 article words against 49 external pages (91,116 words) and 12 of the site's own posts. A word counts as matched when it sits inside a run of consecutive words that also appears, word for word, in a source.

| Run length | External pages | Own posts | Combined |
|---:|---:|---:|---:|
| 4 words | 3.2% | 4.0% | 6.5% |
| 5 words | 0.9% | 1.9% | 2.7% |
| 6 words | 0.6% | 0.9% | 1.6% |
| 8 words | 0.3% | 0.2% | 0.5% |

**This is a local estimate, not a certified plagiarism score.** Dawn, Leather International, Graana and several low-quality pages refused automated download, so they are not in the comparison. The longest external match is a short attributed LWG quotation.

## Media

All media was generated for this article. The route is a schematic and deliberately draws no country borders.

| File in `assets/blog/` | Use |
|---|---|
| `where-to-buy-original-leather-pakistan.webp`, `.jpg`, `-card.webp` | Cover, link preview and journal card |
| `leather-ads-claims-chart.webp` | What 84 ads said |
| `leather-cities-two-counts.webp` | Association and LWG counts by city |
| `leather-jacket-asking-prices-chart.webp` | Asking prices by city |
| `leather-jacket-five-stops.webp` | Five-stop diagram |
| `leather-jacket-five-stops.mp4`, `-poster.webp` | 20-second silent explainer, 594 KB |

## Homepage fixes

| Problem | Fix |
|---|---|
| React error 418 on every homepage load. The build moved the JSON-LD to the head while React renders it in the body, so React rebuilt the page and dropped the business contact block | The script stays in the body. No errors on the live site, and the contact block survives |
| The page painted one hero photo, then swapped to another when React started | The photo that stays on screen is now painted first and preloaded |
| Seven hero photos loaded during first paint | The hidden six wait for page load or the first interaction |
| The brand film and a 20 KB logo competed for the first bytes | The film no longer preloads on desktop, and small screens get a 5.5 KB logo |

## Homepage measurements

Lighthouse's default simulated score fell, even though the page errors are gone and measured load improved. This has not been fully explained.

| Lighthouse, simulated mobile, live | Before | After, three runs |
|---|---:|---:|
| Performance | 81 | 68 to 76 |
| Accessibility | 99 | 100 |
| Best practices | 93 | 100 |
| SEO | 100 | 100 |
| First contentful paint | 2.5 s | 1.7 s |
| Largest contentful paint | 3.1 s | 4.4 to 7.0 s |
| Speed index | 9.2 s | 5.4 s |
| Total blocking time | 140 ms | 200 to 220 ms |

In those simulated runs the browser recorded first paint at about 2.47 seconds on the live site, and chose the hero paragraph as the largest element, which ties the estimate to all the JavaScript before it. Applied throttling does not show that:

| Applied throttling, mobile | Result |
|---|---:|
| Lighthouse on the live site, two runs: score | 71 and 74 |
| Lighthouse on the live site, two runs: largest contentful paint | 2.8 s and 2.3 s |
| Lighthouse on the live site, two runs: total blocking time | 880 ms and 970 ms |
| Browser timing on the live site, three runs: median largest contentful paint | 1.5 s |
| Same test on local builds: page load before and after | 9.6 s and 6.3 s |

The remaining weight is JavaScript. Google's own PageSpeed API returned a quota error, so its result could not be read. Check https://pagespeed.web.dev for the homepage.

The guide scored 98, 100, 100 and 100 in the simulated run, with a 2.0-second largest contentful paint.

## Database changes

`scripts/publish-article.js` inserted the guide.

The owner ran `scripts/update-seo-city-guide.js --apply` on 2 November 2026, after auto mode had blocked that write for the assistant. It updated nine posts: links from six older guides, new covers on four guides, retired products removed from two posts and an old price range corrected. Replaced text and previous covers are in `seo-updates-before-2026-11-02.json`.

## Needs the owner

1. **Decide two live claims, which no script changes:**
   - `/blog/real-leather-vs-faux-leather` says "Everything we make is genuine leather, cut and finished by hand here in Pakistan". Product records do not confirm this.
   - `/blog/leather-jacket-care-pakistan` says "the stitching and hardware are covered for 12 months". This appears nowhere in the terms or product records. If it is not a real promise, it should come out.
2. **Confirm each jacket's hide, layer and finish.** The Heritage lookbook images print "Genuine leather" and "Premium leather", while the guides say records do not name a hide.
3. **Add a real phone or WhatsApp number and a city in admin, plus social links.** The contact page shows only "Pakistan". Local details and a Google Business Profile are stronger location signals than anything in the page code.
4. **Request indexing in Search Console** for the guide. This environment has no Search Console access, and the site settings hold no verification tag.
5. **Earn links from Pakistani sites.** Run a commercial checker if a certified plagiarism figure is needed.
