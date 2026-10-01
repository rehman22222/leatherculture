function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function originFor(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return process.env.SITE_URL || `${protocol}://${host}`;
}

function absoluteUrl(req, pathname) {
  return new URL(pathname || "/", originFor(req)).toString();
}

function metaTags({ title, description, keywords, canonicalPath, image }, req) {
  const canonical = absoluteUrl(req, canonicalPath || "/");
  return `
    <meta name="description" content="${escapeHtml(description || "")}">
    <meta name="keywords" content="${escapeHtml(keywords || "")}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(title || "")}">
    <meta property="og:description" content="${escapeHtml(description || "")}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    ${image ? `<meta property="og:image" content="${escapeHtml(absoluteUrl(req, image))}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title || "")}">
    <meta name="twitter:description" content="${escapeHtml(description || "")}">
  `;
}

function renderBlogPost(post, settings, req) {
  const brand = settings.brand?.name || "LeatherCulture";
  const title = post.metaTitle || `${post.title} - ${brand}`;
  const policy = settings.checkout?.returnsPolicy?.trim() || "Contact info@leatherculture.shop for the current returns and exchange policy before ordering.";
  const body = String(post.body || "").replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, paragraph => {
    const text = paragraph.replace(/<[^>]+>/g, " ");
    return /exchange|return/i.test(text) && /(?:7|30|thirty|seven)[ -]days?/i.test(text) ? `<p>${escapeHtml(policy)}</p>` : paragraph;
  });
  const canonical = absoluteUrl(req, `/blog/${post.slug}`);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BlogPosting", headline: post.title, description: post.excerpt || post.metaDescription,
        mainEntityOfPage: canonical, url: canonical, ...(post.coverImage ? { image: [absoluteUrl(req, post.coverImage)] } : {}),
        ...(post.date ? { datePublished: post.date } : {}),
        author: { "@type": "Organization", name: post.author || brand, url: absoluteUrl(req, "/about") },
        publisher: { "@type": "Organization", name: brand, logo: { "@type": "ImageObject", url: absoluteUrl(req, "/assets/brand/leather-culture-logo-black.png") } } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(req, "/") },
        { "@type": "ListItem", position: 2, name: "Journal", item: absoluteUrl(req, "/blog") },
        { "@type": "ListItem", position: 3, name: post.title, item: canonical }
      ] }
    ]
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
    <link href="/assets/brand/leather-culture-mark.png" rel="icon" type="image/png">
    ${metaTags({ title, description: post.metaDescription || post.excerpt || settings.brand?.description, keywords: post.keywords, canonicalPath: `/blog/${post.slug}`, image: post.coverImage }, req)}
    <style>
      body{margin:0;background:#f8f8f8;color:#080808;font-family:Inter,Arial,sans-serif}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:24px clamp(18px,5vw,72px);background:#050505;color:#fff}
      header a{color:inherit;text-decoration:none;font-weight:800}
      nav{display:flex;gap:26px}
      main{max-width:920px;margin:0 auto;padding:56px 20px 90px}
      .cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#e8e8e8}
      .meta{margin:28px 0 12px;color:#666;font-weight:800}
      h1{margin:0 0 18px;font-size:clamp(42px,7vw,84px);line-height:.95;letter-spacing:0}
      .excerpt{font-size:20px;line-height:1.55;color:#555}
      article{margin-top:36px;font-size:18px;line-height:1.75}
      article img{max-width:100%;border-radius:8px}
      @media(max-width:600px){header{flex-wrap:wrap;gap:16px}nav{gap:16px;flex-wrap:wrap;font-size:14px}h1{font-size:42px}}
    </style>
  </head>
  <body>
    <header>
      <a href="/" aria-label="${escapeHtml(brand)}"><img src="/assets/brand/leather-culture-logo-white.png" alt="${escapeHtml(brand)}" style="height:44px;width:auto;display:block"></a>
      <nav>${(settings.header?.nav || []).map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}</nav>
    </header>
    <main>
      ${post.coverImage ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.coverAlt || post.title)}">` : ""}
      <p class="meta">${escapeHtml(post.author || brand)} / ${escapeHtml(post.date || "")}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="excerpt">${escapeHtml(post.excerpt || "")}</p>
      <article>${body}</article>
      <p style="margin-top:48px"><a href="/blog" style="color:#080808;font-weight:800">&larr; Back to the journal</a></p>
    </main>
  </body>
</html>`;
}

module.exports = { renderBlogPost };
