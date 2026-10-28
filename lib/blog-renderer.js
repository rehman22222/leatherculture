const { esc, jsonLd, siteUrl, absolute, brandName, organization, breadcrumbs, headTags, siteFooter, displayImage, shareImage } = require("./seo");
const { sourcesFor } = require("./citations");

const longDate = value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? String(value || "") : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const plainText = html => String(html || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// Question/answer pairs (an <h3> followed by a <p>) from an article's FAQ section, whose <h2> has the
// id "faq" or "questions". They become FAQPage data that search and AI answer engines can quote.
function faqEntries(body) {
  const html = String(body || "");
  const headings = [...html.matchAll(/<h2[^>]*\bid="(?:faq|questions)"[^>]*>/gi)];
  return headings.flatMap(heading => {
    const start = heading.index || 0;
    const rest = html.slice(start + heading[0].length);
    const followingHeading = rest.search(/<h2\b/i);
    const section = html.slice(start, followingHeading < 0 ? html.length : start + heading[0].length + followingHeading);
    return [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];
  }).map(([, question, answer]) => ({ "@type": "Question", name: plainText(question), acceptedAnswer: { "@type": "Answer", text: plainText(answer) } }))
    .filter(entry => entry.name && entry.acceptedAnswer.text);
}

function renderBlogPost(post, settings, req) {
  const brand = brandName(settings);
  const site = siteUrl();
  const path = `/blog/${post.slug}`;
  const canonical = absolute(path, site);
  const title = post.metaTitle || `${post.title} - ${brand}`;
  const policy = settings.checkout?.returnsPolicy?.trim() || "Contact contact@leatherculture.shop for the current returns and exchange policy before ordering.";
  const body = String(post.body || "").trim().replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, paragraph => {
    const text = paragraph.replace(/<[^>]+>/g, " ");
    return /exchange|return/i.test(text) && /(?:7|30|thirty|seven)[ -]days?/i.test(text) && !paragraph.includes('href="/terms#returns"') ? `<p>${esc(policy)}</p>` : paragraph;
  });
  // The team behind the brand writes the journal; a named author can be set per post in the admin.
  const author = post.author && post.author !== brand ? post.author : `${brand} team`;
  const sources = sourcesFor(post);
  const modified = post.dateModified || post.date;
  const words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const cover = post.coverImage ? displayImage(post.coverImage) : "";
  const faqs = faqEntries(body);
  const articleImages = [...new Set([cover, ...[...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(match => match[1])].filter(Boolean))];
  const morePosts =(settings.blogPosts || []).filter(item => item.status === "published" && item.slug && item.slug !== post.slug).slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BlogPosting", "@id": `${canonical}#article`, headline: post.title, description: post.excerpt || post.metaDescription,
        mainEntityOfPage: canonical, url: canonical, inLanguage: "en-PK", wordCount: words,
        ...(articleImages.length ? { image: articleImages.map(src => absolute(src, site)) } : {}),
        ...(post.keywords ? { keywords: post.keywords } : {}),
        ...(post.category ? { articleSection: post.category } : {}),
        ...(post.date ? { datePublished: post.date, dateModified: modified } : {}),
        author: author === `${brand} team`
          ? { "@type": "Organization", "@id": `${site}/#organization`, name: brand, url: absolute("/about", site) }
          : { "@type": "Person", name: author, url: absolute("/about", site) },
        publisher: { "@id": `${site}/#organization` },
        ...(sources.length ? { citation: sources.map(source => ({ "@type": "CreativeWork", name: source.title, url: source.url, ...(source.publisher ? { publisher: { "@type": "Organization", name: source.publisher } } : {}) })) } : {}) },
      breadcrumbs([["Home", "/"], ["Journal", "/blog"], [post.title, path]], site),
      ...(faqs.length ? [{ "@type": "FAQPage", "@id": `${canonical}#faq`, url: canonical, mainEntity: faqs }] : []),
      organization(settings, site)
    ]
  };
  const sourcesHtml = sources.length ? `<section class="sources" aria-labelledby="sources-title"><h2 id="sources-title">Sources</h2><ol>${sources.map(source => `<li><cite><a href="${esc(source.url)}" rel="noopener" target="_blank">${esc(source.title)}</a></cite>${source.publisher ? `, ${esc(source.publisher)}` : ""}.${source.note ? ` ${esc(source.note)}` : ""}${(source.quotes || []).map(quote => `<blockquote cite="${esc(source.url)}"><p>&ldquo;${esc(quote)}&rdquo;</p></blockquote>`).join("")}</li>`).join("")}</ol></section>` : "";
  const moreHtml = morePosts.length ? `<section class="more" aria-labelledby="more-title"><h2 id="more-title">More from the journal</h2><ul>${morePosts.map(item => `<li><a href="/blog/${esc(item.slug)}">${esc(item.title)}</a>${item.excerpt ? `<span>${esc(item.excerpt)}</span>` : ""}</li>`).join("")}</ul></section>` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headTags({ settings, title, path, type: "article", keywords: post.keywords,
      description: post.metaDescription || post.excerpt || settings.brand?.description,
      image: post.coverImage ? shareImage(post.coverImage) : "", imageAlt: post.coverAlt || post.title })}
    ${post.date ? `<meta property="article:published_time" content="${esc(post.date)}"><meta property="article:modified_time" content="${esc(modified)}">` : ""}
    <meta property="article:author" content="${esc(absolute("/about", site))}">
    <script type="application/ld+json">${jsonLd(schema)}</script>
    <style>
      body{margin:0;background:#f8f8f8;color:#080808;font-family:Inter,Arial,sans-serif}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:24px clamp(18px,5vw,72px);background:#050505;color:#fff}
      header a{color:inherit;text-decoration:none;font-weight:800}
      header nav{display:flex;gap:26px}
      main{max-width:920px;margin:0 auto;padding:56px 20px 90px}
      .crumbs{font-size:14px;color:#666;margin:0 0 24px}.crumbs a{color:inherit}
      .cover{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#e8e8e8}
      .meta{margin:28px 0 12px;color:#666;font-weight:800}.meta a{color:#080808}
      h1{margin:0 0 18px;font-size:clamp(42px,7vw,84px);line-height:.95;letter-spacing:0}
      .excerpt{font-size:20px;line-height:1.55;color:#333;background:#fff;border-left:4px solid #080808;border-radius:8px;padding:16px 20px}
      article{margin-top:36px;font-size:18px;line-height:1.75}
      article img{max-width:100%;height:auto;border-radius:8px}
      article h2,article h3{line-height:1.25;scroll-margin-top:130px}article h2{margin-top:44px;font-size:30px}article h3{margin-top:28px;font-size:23px}
      article a{color:#174c39;text-underline-offset:3px}article li{margin-bottom:10px}
      .article-toc{padding:24px;background:#eeeee9;border-radius:8px;margin:30px 0}.article-toc ol{margin-bottom:0}
      .table-scroll{max-width:100%;overflow-x:auto;margin:28px 0}article table{border-collapse:collapse;width:100%;font-size:16px;text-align:left}article th,article td{padding:14px;border-bottom:1px solid #ddd;vertical-align:top}article thead{background:#eeeee9}article caption{text-align:left;font-size:14px;color:#555;margin-bottom:12px}
      .editorial-photo{margin:36px 0}.editorial-photo img{display:block;max-height:620px;width:100%;object-fit:contain;background:#eeeee9}.editorial-photo figcaption{font-size:14px;line-height:1.6;color:#555;margin-top:12px}
      .sources,.more{margin-top:56px;border-top:1px solid #e2e2e2;padding-top:28px}
      .sources h2,.more h2{font-size:22px;margin:0 0 16px}
      .sources ol{padding-left:22px;line-height:1.7}.sources li{margin-bottom:16px}.sources a,.more a{color:#080808;font-weight:700}
      .sources blockquote{margin:10px 0 0;padding:4px 0 4px 16px;border-left:3px solid #c9c9c9;color:#444;font-style:italic}.sources blockquote p{margin:0}
      .more ul{list-style:none;padding:0;margin:0;display:grid;gap:14px}.more span{display:block;color:#555;line-height:1.6}
      .site-footer{padding:30px 20px;text-align:center;color:#666;font-size:14px;border-top:1px solid #e2e2e2}
      .site-footer nav{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 20px;margin-bottom:10px}.site-footer a{color:#080808}.site-footer p{margin:0}
      @media(max-width:600px){header{flex-wrap:wrap;gap:16px}header nav{gap:16px;flex-wrap:wrap;font-size:14px}h1{font-size:42px}}
    </style>
  </head>
  <body>
    <header>
      <a href="/" aria-label="${esc(brand)}"><img src="/assets/brand/leather-culture-logo-white.png" alt="${esc(brand)}" width="124" height="44" style="height:44px;width:auto;display:block"></a>
      <nav aria-label="Main">${(settings.header?.nav || []).map((item) => `<a href="${esc(item.href)}">${esc(item.label)}</a>`).join("")}<a href="/account" rel="nofollow">My account</a></nav>
    </header>
    <main>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Journal</a> / <span aria-current="page">${esc(post.title)}</span></nav>
      ${cover ? `<img class="cover" src="${esc(cover)}" alt="${esc(post.coverAlt || post.title)}" width="${Number(post.coverWidth) || 1600}" height="${Number(post.coverHeight) || 900}" fetchpriority="high" decoding="async">` : ""}
      <p class="meta">By <a href="/about" rel="author">${esc(author)}</a>${post.date ? ` &middot; <time datetime="${esc(post.date)}">${esc(longDate(post.date))}</time>` : ""}${post.readTime ? ` &middot; ${esc(post.readTime)}` : ""}</p>
      <h1>${esc(post.title)}</h1>
      ${post.excerpt ? `<p class="excerpt"><strong>In short:</strong> ${esc(post.excerpt)}</p>` : ""}
      <article>${body}</article>${sourcesHtml ? `
      ${sourcesHtml}` : ""}${moreHtml ? `
      ${moreHtml}` : ""}
      <p style="margin-top:48px"><a href="/blog" style="color:#080808;font-weight:800">&larr; Back to the journal</a></p>
    </main>
    ${siteFooter(settings)}
  </body>
</html>`;
}

module.exports = { renderBlogPost };
