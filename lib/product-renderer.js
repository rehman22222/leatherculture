"use strict";
const { esc, jsonLd, siteUrl, absolute, brandName, organization, breadcrumbs, headTags, siteHeader, siteFooter, displayImage, cardImage, shareImage } = require("./seo");

const FALLBACK_POLICY = "Contact info@leatherculture.shop for the current returns and exchange policy before ordering.";
const priceValue = value => { const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/); return match ? Number(match[0]) : 0; };
const amount = value => Number(value || 0).toLocaleString("en-US");
const summary = (text, max = 158) => { const clean = String(text || "").replace(/\s+/g, " ").trim(); return clean.length <= max ? clean : `${clean.slice(0, clean.lastIndexOf(" ", max - 1))}…`; };

// The free-delivery threshold applies per order, so a product priced above it ships free on its own.
function shippingFor(price, checkout) {
  const fee = Number(checkout.shippingFee) || 0, freeFrom = Number(checkout.freeShippingFrom) || 0;
  return freeFrom && price >= freeFrom ? 0 : fee;
}

function deliveryText(checkout) {
  const currency = checkout.currency || "Rs", fee = Number(checkout.shippingFee) || 0, freeFrom = Number(checkout.freeShippingFrom) || 0;
  const cost = fee ? `Delivery anywhere in Pakistan costs ${currency} ${amount(fee)}${freeFrom ? `, free on orders of ${currency} ${amount(freeFrom)} or more` : ""}.` : "Delivery anywhere in Pakistan is free.";
  return `${cost} ${checkout.codNote || ""}`.trim();
}

function renderProductPage(product, settings, req) {
  const site = siteUrl();
  const path = `/shop/${product.slug}`;
  const url = absolute(path, site);
  const checkout = settings.checkout || {};
  const variants = (product.variants || []).filter(v => v.enabled !== false);
  const available = variants.some(v => Number(v.stock) > 0);
  const price = priceValue(product.price);
  const category = (settings.categories || []).find(item => item.id === product.category || item.slug === product.category);
  const gallery = [{ image: product.image, alt: product.alt || product.name, label: "Front", width: 1122, height: 1402 }, ...(product.gallery || [])].filter((item, i, list) => item.image && list.findIndex(other => other.image === item.image) === i);
  const galleryHtml = '<div class="product-photo">' + gallery.map((item, i) => '<figure id="product-image-' + i + '" data-gallery-panel ' + (i ? 'hidden' : '') + '><img src="' + esc(displayImage(item.image)) + '" alt="' + esc(item.alt || product.name) + '" width="' + (Number(item.width) || 1122) + '" height="' + (Number(item.height) || 1402) + '" ' + (i ? 'loading="lazy"' : 'fetchpriority="high"') + ' decoding="async"><figcaption>' + esc(item.label || 'Product view') + '</figcaption></figure>').join('') + '<nav class="product-gallery-nav" aria-label="Product photos">' + gallery.map((item, i) => '<button type="button" data-gallery-target="product-image-' + i + '" aria-controls="product-image-' + i + '" aria-pressed="' + (i === 0) + '">' + esc(item.label || 'View ' + (i + 1)) + '</button>').join('') + '</nav><noscript>' + gallery.slice(1).map(item => '<p><a href="' + esc(displayImage(item.image)) + '">' + esc(item.alt || product.name) + '</a></p>').join('') + '</noscript></div>';
  const related = (settings.products || []).filter(item => item.enabled !== false && item.slug && item.slug !== product.slug && item.image)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category)).slice(0, 4);
  const relatedHtml = related.length ? `<section class="product-related" aria-labelledby="product-related-title"><h2 id="product-related-title">More from the collection</h2><div class="product-related-grid">${related.map(item => `<a href="/shop/${esc(item.slug)}"><img src="${esc(cardImage(item.image))}" alt="${esc(item.alt || item.name)}" width="400" height="500" loading="lazy" decoding="async"><span>${esc(item.name)}</span><small>${esc(item.price)}</small></a>`).join("")}</div></section>` : "";
  const sizeGuide = (settings.blogPosts || []).find(post => post.slug === "leather-jacket-size-guide" && post.status === "published");
  const sku = variants.find(v => v.sku)?.sku;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Product", "@id": `${url}#product`, name: product.name, description: product.description, url,
        image: gallery.map(item => absolute(displayImage(item.image), site)),
        ...(sku ? { sku } : {}),
        brand: { "@type": "Brand", name: brandName(settings) },
        ...(category ? { category: category.name } : {}),
        ...(product.material ? { material: product.material } : {}),
        offers: { "@type": "Offer", url, price: String(price), priceCurrency: "PKR",
          availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": `${site}/#organization` },
          shippingDetails: { "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: shippingFor(price, checkout), currency: "PKR" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" } } } },
      breadcrumbs([["Home", "/"], ["Shop", "/shop"], [product.name, path]], site),
      organization(settings, site)
    ]
  };
  const head = headTags({
    settings, path, type: "product", keywords: product.keywords,
    title: product.metaTitle || `${product.name} | ${brandName(settings)} Pakistan`,
    description: product.metaDescription || summary(product.description),
    image: shareImage(product.image), imageAlt: product.alt || product.name
  });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<meta property="product:price:amount" content="${price}"><meta property="product:price:currency" content="PKR"><link rel="stylesheet" href="/store.css?v=seo-1"><link rel="stylesheet" href="/account/nav.css?v=2"><link rel="stylesheet" href="/shop/product-page.css?v=mobile-1"><script type="application/ld+json">${jsonLd(schema)}</script></head>
  <body>${siteHeader(settings)}
  <main class="product-page"><nav class="product-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/shop">Shop</a> / <span aria-current="page">${esc(product.name)}</span></nav><div class="product-layout">${galleryHtml}<section class="product-info"><p class="product-eyebrow">THE LEATHERCULTURE COLLECTION</p><h1>${esc(product.name)}</h1><p class="product-price">${esc(product.price)}</p><p class="product-description">${esc(product.description)}</p><label for="product-variant">Colour / size</label><select id="product-variant">${variants.map(v => `<option value="${esc(v.id)}" ${Number(v.stock) > 0 ? "" : "disabled"}>${esc(v.name)}${Number(v.stock) > 0 ? "" : " — Sold out"}</option>`).join("")}</select><p id="product-stock" class="muted"></p><button id="product-add" class="btn" type="button" ${available ? "" : "disabled"}>${available ? "Add to cart" : "Sold out"}</button><p id="product-message" role="status"></p><p class="product-payment">Cash on delivery &middot; Pakistan</p>${product.material ? `<details><summary>Material</summary><p>${esc(product.material)}</p></details>` : ""}${product.care ? `<details><summary>Care</summary><p>${esc(product.care)}</p></details>` : ""}<details><summary>Delivery &amp; exchanges</summary><p>${esc(deliveryText(checkout))}</p><p>${esc(String(checkout.returnsPolicy || "").trim() || FALLBACK_POLICY)}</p></details><a class="product-help" href="/contact">Need help choosing your size?</a>${sizeGuide ? ` <a class="product-help" href="/blog/${esc(sizeGuide.slug)}">Read the leather jacket size guide</a>` : ""}</section></div>${relatedHtml}</main>${siteFooter(settings)}<script id="lc-product-data" type="application/json">${jsonLd({ product, checkout })}</script><script src="/site-config.js"></script><script src="/cart.js?v=cart-6"></script><script src="/shop/product-page.js"></script></body></html>`;
}
module.exports = { renderProductPage, shippingFor };
