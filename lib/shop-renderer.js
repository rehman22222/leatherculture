"use strict";

// The original /shop export was a Framer demo page.  It meant a direct visit
// first painted demo copy and only became a real catalogue after client-side
// JavaScript ran.  Keep the catalogue in the initial HTML instead.
const { esc, jsonLd, siteUrl, absolute, brandName, organization, breadcrumbs, headTags, siteHeader, siteFooter, cardImage, shareImage } = require("./seo");

const asAmount = value => {
  const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

function renderShopPage(settings) {
  const site = siteUrl();
  const products = (settings.products || []).filter(product => product.enabled !== false && product.slug && product.name);
  const firstImage = products.find(product => product.image)?.image || "";
  const count = products.length;
  const description = count
    ? `Browse ${count} current LeatherCulture ${count === 1 ? "piece" : "pieces"} online in Pakistan. View product details, sizes and delivery information before ordering.`
    : "Browse the current LeatherCulture collection online in Pakistan.";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absolute("/shop", site)}#webpage`,
        name: `Shop | ${brandName(settings)}`,
        url: absolute("/shop", site),
        description,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absolute(`/shop/${product.slug}`, site),
            name: product.name
          }))
        }
      },
      breadcrumbs([["Home", "/"], ["Shop", "/shop"]], site),
      organization(settings, site)
    ]
  };
  const head = headTags({
    settings,
    path: "/shop",
    title: settings.seo?.shopTitle || `Leather Jacket Prices in Pakistan | ${brandName(settings)}`,
    description: settings.seo?.shopDescription || description,
    keywords: "leather jackets Pakistan, leather jacket price Pakistan, original leather jackets, pure leather jackets",
    image: shareImage(firstImage),
    imageAlt: "LeatherCulture leather jacket collection"
  });
  const cards = products.map(product => {
    const price = asAmount(product.price);
    const compare = asAmount(product.compareAtPrice);
    const discount = compare > price ? `<span class="shop-card-compare">${esc(product.compareAtPrice)}</span>` : "";
    return `<article class="shop-card"><a href="/shop/${esc(product.slug)}"><div class="shop-card-media"><img src="${esc(cardImage(product.image))}" alt="${esc(product.alt || product.name)}" width="720" height="900" loading="lazy" decoding="async"></div><div class="shop-card-copy"><h2>${esc(product.name)}</h2><p class="shop-card-price">${esc(product.price)}${discount}</p><span class="shop-card-link">View details <span aria-hidden="true">→</span></span></div></a></article>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<link rel="stylesheet" href="/store.css?v=seo-1"><link rel="stylesheet" href="/account/nav.css?v=2"><style>
  .shop-page{max-width:1240px;margin:0 auto;padding:34px 24px 82px}.shop-intro{max-width:760px;padding:22px 0 46px;border-bottom:1px solid #e8e5df}.shop-kicker,.lc-answers .lc-meta{margin:0 0 12px;color:#756956;font-size:11px;font-weight:700;letter-spacing:.17em}.shop-intro h1{margin:0;color:#171614;font-size:clamp(38px,6vw,68px);line-height:1.02;letter-spacing:-.055em}.shop-intro p:last-child{max-width:620px;margin:20px 0 0;color:#625d55;font-size:16px;line-height:1.7}.shop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;margin-top:42px}.shop-card{min-width:0}.shop-card a{display:block;color:#171614;text-decoration:none}.shop-card-media{overflow:hidden;border-radius:14px;background:#f3f1ed}.shop-card img{display:block;width:100%;aspect-ratio:4/5;object-fit:cover;transition:transform .25s ease}.shop-card a:hover img{transform:scale(1.02)}.shop-card a:focus-visible{outline:3px solid #756956;outline-offset:5px}.shop-card-copy{padding:15px 2px 4px}.shop-card h2{margin:0;font-size:18px;line-height:1.35}.shop-card-price{margin:8px 0 12px;font-size:17px;font-weight:700}.shop-card-compare{margin-left:8px;color:#777;font-size:14px;font-weight:400;text-decoration:line-through}.shop-card-link{font-size:14px;text-decoration:underline;text-underline-offset:3px}.shop-empty{margin:48px 0;padding:32px;border:1px solid #e8e5df;border-radius:12px;background:#faf9f7}.shop-empty a{color:inherit}.lc-answers{margin-top:64px;padding-top:40px;border-top:1px solid #e8e5df}.lc-answers-inner{max-width:820px}.lc-answers h2{margin:0 0 14px;font-size:clamp(26px,4vw,38px);letter-spacing:-.04em}.lc-answers p{color:#625d55;line-height:1.7}.lc-answers details{padding:15px 0;border-top:1px solid #e8e5df}.lc-answers summary{font-weight:700;cursor:pointer}.site-header{position:relative;background:#050505}@media(max-width:800px){.shop-page{padding:24px 16px 56px}.shop-intro{padding:12px 0 34px}.shop-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 14px;margin-top:30px}.shop-card h2{font-size:15px}.shop-card-price{font-size:15px}.shop-card-link{font-size:13px}.lc-answers{margin-top:48px}}@media(max-width:390px){.shop-grid{grid-template-columns:1fr}.shop-card img{aspect-ratio:5/4;object-fit:contain}}
  </style><script type="application/ld+json">${jsonLd(schema)}</script></head><body>${siteHeader(settings)}<main id="main" class="shop-page" data-lc-shop-page><section class="shop-intro" aria-labelledby="shop-title"><p class="shop-kicker">THE LEATHERCULTURE COLLECTION</p><h1 id="shop-title">Shop leather jackets in Pakistan</h1><p>${esc(description)}</p></section>${count ? `<section class="shop-grid" aria-label="Current leather jacket collection">${cards}</section>` : `<section class="shop-empty"><h2>Our collection is being updated</h2><p>Please <a href="/contact">contact us</a> for current product availability.</p></section>`}<section class="lc-answers" aria-labelledby="shop-help-title"><div class="lc-answers-inner"><p class="lc-meta">BUYING HELP</p><h2 id="shop-help-title">Choose with confidence</h2><p class="lc-lede">Compare the current collection, check the product photos and available size options, then ask our team about measurements or materials before ordering.</p><details><summary>How do I choose the right jacket?</summary><p>Use the measurements and size options on the product page. If you need help comparing a style, <a href="/contact">contact the LeatherCulture team</a> before checkout.</p></details><details><summary>Where do I find delivery and return details?</summary><p>Read our <a href="/terms#returns">delivery and returns policy</a> before ordering. Product pages show the checkout options available for that item.</p></details></div></section></main>${siteFooter(settings)}<script src="/site-config.js"></script><script src="/store-override.js"></script></body></html>`;
}

module.exports = { renderShopPage };
