"use strict";
function reviewProducts(order) {
  const products = new Map();
  for (const item of order.items || []) {
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || "")) products.set(item.slug, { slug: item.slug, name: item.name });
  }
  return [...products.values()];
}
function reviewSelection(order, body) {
  if (order.status !== "delivered") throw Object.assign(new Error("Reviews open after your order has been delivered."), { status: 400 });
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw Object.assign(new Error("Please choose a rating from 1 to 5."), { status: 400 });
  const product = body.productSlug ? reviewProducts(order).find(p => p.slug === body.productSlug) : null;
  if (body.productSlug && !product) throw Object.assign(new Error("Please select a product from this order."), { status: 400 });
  return { rating: body.rating, product: product?.name || "", productSlug: product?.slug || "" };
}
// Public responses never contain order IDs, email addresses, tokens or other private order data.
function storefrontReview(review) {
  const keys = ["id", "rating", "text", "name", "city", "product", "productSlug", "status", "verified", "featured", "createdAt"];
  return Object.fromEntries(keys.filter(key => review[key] !== undefined).map(key => [key, review[key]]));
}
module.exports = { reviewProducts, reviewSelection, storefrontReview };
