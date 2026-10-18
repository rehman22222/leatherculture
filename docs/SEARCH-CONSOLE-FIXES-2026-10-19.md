# Search Console follow-up — 19 October 2026

## What the screenshots show

The Product snippets and Merchant listings screenshots show **0 affected items** for each listed recommendation and a link to valid items. They do not show an active invalid-product count. The Links report shows six discovered links in its sample; that is not a complete inventory of the site's current HTML links. [Google Links report documentation](https://support.google.com/webmasters/answer/9049606).

The screenshots confirm that the owner has a Search Console domain property. This session has no authenticated Search Console API or browser access, so it cannot submit validation, request indexing, or claim Google's reports have refreshed.

## Implemented

- **Contact:** `contact@leatherculture.shop` throughout generated storefront pages and article content. The site's fallback support address is updated too. SMTP credentials and sender identities are unchanged.
- **Delivery:** total estimate **5–7 days**, dispatch **1–2 days**; customers are told they will receive updates. Replaced the stale 3–5 working-day statements in FAQs and order-email copy.
- **Returns:** refund requests within **7 days of receipt**, for **undamaged products**; customers pay the return courier. The terms page, product pages and FAQs use the same checkout policy. The owner confirmed these facts in this conversation.
- **Merchant schema:** every product has `offers.shippingDetails`, with Pakistan as destination, PKR as currency, and the shipping rate calculated from the real checkout threshold. All five Rs 15,000 jackets qualify for free delivery at the current Rs 10,000 threshold. `deliveryTime.handlingTime` is 1–2 days. The separate courier-only transit range has not been confirmed, so it is omitted rather than derived from the total estimate. Google's optional transit-time recommendation may remain.
- **Return schema:** `hasMerchantReturnPolicy` is present under Organization and product offers: `MerchantReturnFiniteReturnWindow`, `merchantReturnDays: 7`, `ReturnByMail`, `ReturnFeesCustomerResponsibility`, country `PK`, and a link to `/terms#returns`. Static build and browser updates preserve confirmed terms. Invalid or unconfirmed settings produce no return promise. [Google merchant listing requirements](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).
- **Genuine product reviews:** signed delivery-email links now let customers select a jacket from their order or review the overall service. The backend checks delivery status, rating range and whether that product was purchased. Only approved, verified reviews explicitly tied to the selected product enter its visible reviews, `review` and `aggregateRating`. Hidden reviews and order-wide reviews do not. Both low and high approved ratings count. Public responses exclude order IDs and private customer fields. Static HTML includes available reviews at build time; browser rendering refreshes reviews and schema together.
- **Internal links:** each jacket links to the other four jackets and to the price, size and care guides. These are ordinary HTML links that work without JavaScript. The audit now reports inbound source pages and click depth from the homepage.
- **Old template copy:** replaced stale introductions that still advertised retired clothing, Rs 3,400 starting prices, and unverified handmade/material claims. The current introductions use the live catalogue and direct material questions to the team.

There are **no customer reviews in the database** at this check. Review/rating schema is therefore correctly absent for now. The mechanism is ready for actual customer feedback; no ratings were fabricated. Product snippets can use valid offers without ratings, although Google may show optional review warnings. [Google product snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).

## Verification

- Build, `npm run verify:seo`, and `npm run verify:commerce` pass.
- All **17 public sitemap pages** pass the implemented local technical checks.
- **192 unique source-to-target internal link pairs**, excluding self-links; maximum **2 clicks** from home. Each product has links from **7 other public pages**. These are our HTML-crawl measurements, not Search Console counts.
- Browser checks at 360px and 1440px: no horizontal overflow, three guide links, four related jackets, and an honest empty-review state.
- Local mocked API checks verify that a low-rated product review appears with matching schema and that the form submits the selected purchased product. **No test reviews or orders were submitted to production.** See [browser evidence](commerce-browser-checks.json).
- Business settings were updated with a revision increment; prior public values are saved in [merchant-details-before.json](merchant-details-before.json).

## After deployment

Use URL Inspection in the existing Search Console property to test the live home, shop and product URLs and request indexing for the changed pages. Confirm `https://www.leatherculture.shop/sitemap.xml` is submitted. If a report shows an active issue with affected URLs and a **Validate fix** action, start validation there after testing the live URL. A row with 0 items and N/A does not establish an active validation task.

Google needs to recrawl the site before its sampled links and enhancement reports can reflect these changes. Report counts and rich results are controlled by Google; no ranking, indexing or rich-result guarantee is made.

Deployment verification is recorded below after the push.
