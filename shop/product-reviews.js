/* Shared by the server, static build and product page. Only product-specific customer reviews count. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LeatherCultureReviews = factory();
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function forProduct(reviews, slug) {
    const ids = new Set();
    return (Array.isArray(reviews) ? reviews : []).filter(review => {
      if (!review || !review.id || ids.has(review.id) || review.productSlug !== slug || review.status !== "approved" || review.verified !== true || typeof review.name !== "string" || !review.name.trim() || typeof review.text !== "string" || !review.text.trim() || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) return false;
      ids.add(review.id);
      return true;
    });
  }
  function markup(reviews, slug) {
    const rows = forProduct(reviews, slug);
    if (!rows.length) return {};
    return {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number((rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(2)), reviewCount: rows.length, bestRating: 5, worstRating: 1 },
      review: rows.map(r => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, reviewBody: r.text,
        ...(r.createdAt && Number.isFinite(new Date(r.createdAt).getTime()) ? { datePublished: new Date(r.createdAt).toISOString().slice(0, 10) } : {}),
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 } }))
    };
  }
  function render(reviews, slug) {
    const rows = forProduct(reviews, slug), data = markup(rows, slug);
    if (!rows.length) return '<h2>Customer reviews</h2><p>No customer reviews for this jacket yet. After delivery, use the review link in your order email to share your experience.</p>';
    return `<h2>Customer reviews</h2><p>${data.aggregateRating.ratingValue} / 5 from ${rows.length} verified purchase review${rows.length === 1 ? "" : "s"}</p><div class="product-review-list">${rows.map(r => `<article><p><strong>${esc(r.name)}</strong>${r.city ? ` &middot; ${esc(r.city)}` : ""} &middot; ${r.rating} / 5</p><p>${esc(r.text)}</p></article>`).join("")}</div>`;
  }
  return { forProduct, markup, render };
});
