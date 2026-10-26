const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const cheerio = require("cheerio");
const { materialize, publicPhone } = require("./build-storefront");
const { legalLinks, profileUrl, cardImage } = require("../lib/seo");
const { CATEGORY_CATALOG, categoryIsIndexable } = require("../lib/category-catalog");
const typesOf = node => [].concat(node["@type"] || []);

const output = path.join(__dirname, "..", "dist");
const xml = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
const siteOrigin = "https://www.leatherculture.shop";
const outputFileFor = pathname => pathname === "/"
  ? path.join(output, "index.html")
  : path.join(output, pathname.replace(/^\//, ""), "index.html");
assert(urls.length > 0, "sitemap.xml has no URLs");
assert.equal(new Set(urls.map(url => url.href)).size, urls.length, "sitemap.xml has duplicate URLs");
for (const url of urls) {
  assert.equal(url.origin, siteOrigin, `sitemap.xml: non-canonical origin ${url.href}`);
  assert.equal(url.search, "", `sitemap.xml: query URL ${url.href}`);
  assert.equal(url.hash, "", `sitemap.xml: fragment URL ${url.href}`);
  assert(fs.existsSync(outputFileFor(url.pathname)), `sitemap.xml: dead URL ${url.pathname}`);
}
// Every configured collection must be rendered, including empty launch-soon collections.
// Only a collection with live stock belongs in the sitemap; the rest must explicitly noindex.
const collectionsRoot = path.join(output, "collections");
const collectionPaths = fs.existsSync(collectionsRoot)
  ? fs.readdirSync(collectionsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(collectionsRoot, entry.name, "index.html")))
    .map(entry => `/collections/${entry.name}`)
  : [];
assert(collectionPaths.length > 0, "collections: no rendered collection pages");
for (const pathname of collectionPaths) {
  const html = fs.readFileSync(outputFileFor(pathname), "utf8");
  const $ = cheerio.load(html);
  const schemas = $("script[type='application/ld+json']").map((_, element) => JSON.parse($(element).text())).get().flatMap(data => data["@graph"] || [data]);
  const isInSitemap = urls.some(url => url.pathname === pathname);
  const robotsValue = $("meta[name='robots']").attr("content") || "";
  assert.equal($("h1").length, 1, `${pathname}: expected one H1`);
  assert.equal($("link[rel='canonical']").attr("href"), `${siteOrigin}${pathname}`, `${pathname}: incorrect canonical`);
  assert(schemas.some(node => node["@type"] === "CollectionPage"), `${pathname}: missing CollectionPage schema`);
  assert.equal(/\bnoindex\b/i.test(robotsValue), !isInSitemap, `${pathname}: sitemap/noindex mismatch`);
}
const robots = fs.readFileSync(path.join(output, "robots.txt"), "utf8");
assert(robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`), "robots.txt: canonical sitemap missing");
for (const pathname of ["/admin/", "/api/", "/account/", "/cart/", "/checkout/", "/order/", "/review/"]) {
  assert(robots.includes(`Disallow: ${pathname}`), `robots.txt: ${pathname} must be excluded`);
}
for (const url of urls) {
  const html = fs.readFileSync(path.join(output, url.pathname, "index.html"), "utf8");
  const $ = cheerio.load(html);
  const schemas = $("script[type='application/ld+json']").map((_, element) => JSON.parse($(element).text())).get().flatMap(data => data["@graph"] || [data]);
  const settings = $("#lc-build-settings").length ? JSON.parse($("#lc-build-settings").text()) : null;
  if (settings) {
    const page = settings.pages?.find(page => page.path === url.pathname);
    if (page?.metaTitle) assert.equal($("title").text(), page.metaTitle, `${url.pathname}: admin title missing from initial HTML`);
    if (page?.metaDescription) assert.equal($("meta[name='description']").attr("content"), page.metaDescription, `${url.pathname}: admin description missing from initial HTML`);
    $("a[href*='/blog/']").filter((_, e) => $(e).find("img").length).each((_, element) => {
      const card = $(element), post = settings.blogPosts.find(post => `/blog/${post.slug}` === card.attr("href"));
      assert(post && card.text().includes(post.title), `${url.pathname}: journal card title does not match its destination`);
    });
    $("footer .lc-contact-link").each((_, element) => {
      assert($(element).find("svg path").length, `${url.pathname}: contact icon depends on a missing SVG symbol`);
    });
    if (!publicPhone(settings.footer?.phone)) {
      $("footer a[data-lc-phone]").each((_, element) => assert($(element).parent().attr("hidden") !== undefined, `${url.pathname}: duplicate email fallback should be hidden`));
    }
  }
  if (url.pathname === "/" && settings) {
    // Catalogue cards must work before the deferred Framer runtime or settings API loads.
    const live = settings.products.filter(product => product.enabled !== false);
    const cards = $("[data-framer-name='Best sellers'] a").filter((_, element) => $(element).find("img").length);
    assert(cards.length > 0 || live.length === 0, "homepage: live catalogue cards missing from initial HTML");
    cards.each((_, element) => {
      const card = $(element);
      const product = live.find(item => card.attr("href") === `/shop/${item.slug}`);
      assert(product, "homepage: demo or retired product card in initial HTML");
      assert(card.text().includes(product.name), "homepage: product name missing");
      assert(card.text().includes(product.price), "homepage: product price missing");
      assert.equal(card.find("img").first().attr("src"), cardImage(product.image), "homepage: product image does not match card");
    });
  }
  const productData = $("#lc-product-data").length ? JSON.parse($("#lc-product-data").text()).product : null;
  assert.equal($("body > #lc-account-link").length, 0, `${url.pathname}: legacy floating account link`);
  // Tools and crawlers that read only the start of a page must reach the structured data and the answers.
  const structuredAt = html.indexOf("application/ld+json");
  if (structuredAt >= 0) assert(structuredAt < 20000, `${url.pathname}: structured data starts at byte ${structuredAt}`);
  if ($("body > #main").length) {
    const answersAt = html.indexOf('class="lc-answers"');
    assert(answersAt > 0 && answersAt < 100000, `${url.pathname}: answers section starts at byte ${answersAt}`);
    assert.equal($("style[data-framer-css-ssr-minified]").text(), "", `${url.pathname}: Framer CSS is still inline`);
    const sheet = $("link[rel='stylesheet'][href^='/assets/css/framer-']").attr("href");
    assert(sheet && fs.existsSync(path.join(output, sheet)), `${url.pathname}: Framer stylesheet missing`);
  }
  if ($(".framer-149q19i-container").length) {
    assert($("link[href*='/account/nav.css']").length, `${url.pathname}: account navigation stylesheet missing`);
    const variants = $(".framer-149q19i-container > .ssr-variant").length;
    assert.equal($(".framer-149q19i-container .lc-account-nav").length, variants, `${url.pathname}: account link missing from a header variant`);
  } else {
    assert($("header .lc-account-nav, header a[href='/account']").length > 0, `${url.pathname}: account link missing from header`);
  }
  assert.equal($("input[placeholder='test@gmail.com'],input[placeholder='+123 456 789 00']").length, 0, url.pathname);
  const withoutAlt = $("img").filter((_, img) => !String($(img).attr("alt") || "").trim()).map((_, img) => $(img).attr("src")).get();
  assert.equal(withoutAlt.length, 0, `${url.pathname}: images without alt text: ${withoutAlt.slice(0, 5).join(", ")}`);
  for (const link of legalLinks) assert($(`a[href='${link.href}']`).length, `${url.pathname}: no ${link.label} link`);
  for (const node of schemas.filter(node => typesOf(node).includes("Organization"))) {
    for (const profile of [].concat(node.sameAs || [])) assert.equal(profileUrl(profile), profile, `${url.pathname}: placeholder sameAs ${profile}`);
  }
  assert(!schemas.some(node => typesOf(node).includes("WebSite") && node.potentialAction), `${url.pathname}: SearchAction without a search page`);
  for (const node of schemas.filter(node => typesOf(node).some(type => /Page$/.test(type)) && (node.datePublished || node.dateModified))) {
    assert(node.author, `${url.pathname}: dated ${typesOf(node).join("/")} without an author`);
  }
  $("script,style").remove();
  const text = $("body").text();
  if (settings?.checkout?.codNote?.includes("5-7 days")) assert(!/3-5 working days/.test(text), `${url.pathname}: stale delivery estimate`);
  assert(!/Prices start at Rs 3,400|Every LeatherCulture jacket is made from genuine leather and finished by hand/.test($(".lc-answers").text()), `${url.pathname}: stale catalogue facts`);
  assert(!/test@gmail|London, England|England, London|234 567|thirty days|USD\s*\$|\$\d[\d,.]*/.test(text), url.pathname);
  assert.equal($("h1").length, 1, url.pathname);
  assert.equal($("link[rel='canonical']").attr("href"), url.href);
  $("a[href]").each((_, anchor) => {
    const href = String($(anchor).attr("href") || "").trim();
    if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) return;
    const target = new URL(href, url.href);
    if (target.origin !== siteOrigin) return;
    if (!path.extname(target.pathname)) assert(fs.existsSync(outputFileFor(target.pathname)), `${url.pathname}: dead internal link ${href}`);
  });
  if (url.pathname.startsWith("/shop/")) {
    const product = productData || settings.products.find(product => url.pathname === `/shop/${product.slug}`);
    if (!$(".product-page").length) assert(text.includes("Quality checked"), url.pathname);
    assert.equal($("p,h2,h3,h4").filter((_, element) => $(element).text().trim() === "Genuine leather").length, 0, url.pathname);
    assert(text.includes(product.price));
    assert(text.includes(product.material));
    assert(text.includes(product.care));
    const schema = schemas.find(node => node["@type"] === "Product");
    assert.equal(schema.offers.price, String(product.price).replace(/[^\d.]/g, ""));
    assert.equal(schema.offers.priceCurrency, "PKR");
    const faq = schemas.find(node => node["@type"] === "FAQPage");
    if (faq) {
      const care = faq.mainEntity.find(question => /care for/i.test(question.name));
      assert.equal(care.acceptedAnswer.text, product.care);
    } else assert($(".product-page").length, `${url.pathname}: missing FAQ for restored template`);
  }
  if (url.pathname.startsWith("/blog/")) assert(schemas.some(node => node["@type"] === "BlogPosting"));
  if (url.pathname.startsWith("/collections/")) assert(schemas.some(node => node["@type"] === "CollectionPage"), `${url.pathname}: missing CollectionPage schema`);
  console.log(`Verified ${url.pathname}`);
}
for (const link of legalLinks) assert(urls.some(url => url.pathname === link.href), `sitemap.xml: ${link.href} missing`);
const llms = fs.readFileSync(path.join(output, "llms.txt"), "utf8");
for (const url of urls.filter(url => url.pathname.startsWith("/shop/"))) assert(llms.includes(url.href), `llms.txt: ${url.pathname} missing`);
const llmsFull = fs.readFileSync(path.join(output, "llms-full.txt"), "utf8");
for (const url of urls.filter(url => /^\/(shop|blog|collections)\//.test(url.pathname))) assert(llmsFull.includes(url.href), `llms-full.txt: ${url.pathname} missing`);
assert(fs.readFileSync(path.join(output, "llms-small.txt"), "utf8").includes("llms-full.txt"), "llms-small.txt: no link to the full reference");
assert(/^User-Agent: \*$/m.test(fs.readFileSync(path.join(output, ".well-known", "ai.txt"), "utf8")), ".well-known/ai.txt missing");
for (const name of [".env", "server.js", "package.json", ".git", ".kilo"]) assert(!fs.existsSync(path.join(output, name)));
assert.equal(publicPhone("+001 234 567 890"), "");
assert.equal(publicPhone("+92 300 9876543"), "+92 300 9876543");
const bags = CATEGORY_CATALOG.find(category => category.id === "leather-bags");
assert(bags, "catalogue: leather-bags category missing");
assert.equal(categoryIsIndexable({ products: [] }, bags), false, "catalogue: empty future category must remain noindex");
assert.equal(categoryIsIndexable({ products: [{ category: "leather-bags", enabled: true }] }, bags), true, "catalogue: stocked future category must become indexable");
const fixture = { products: [], footer: { phone: "+92 300 9876543", email: "info@leatherculture.shop" }, checkout: { returnsPolicy: "Exchange within 14 days with original tags." }, content: { values: {} } };
const result = cheerio.load(materialize('<html><head></head><body><p>+001 234 567 890</p><a href="tel:001234567890">Call</a><section id="faq"><details><summary>Can I exchange an item?</summary><p>Old policy</p></details></section></body></html>', fixture, "/contact", [], "https://www.leatherculture.shop"));
assert.equal(result("a[href^='tel:']").text(), fixture.footer.phone);
assert.equal(result("#faq p").text(), fixture.checkout.returnsPolicy);
// Placeholder social links are hidden with their heading; real profiles keep their link.
const footer = '<html><head></head><body><div><div><p>Follow us:</p></div><div><div><a href="https://instagram.com">Instagram</a></div><div><a href="https://x.com">Twitter</a></div></div></div></body></html>';
const placeholders = cheerio.load(materialize(footer, { ...fixture, footer: { ...fixture.footer, socials: { instagram: "https://instagram.com", twitter: "https://x.com" } } }, "/", [], "https://www.leatherculture.shop"));
assert.equal(placeholders("a[href='https://instagram.com']").parent().css("display"), "none");
assert.equal(placeholders("p").filter((_, p) => placeholders(p).text() === "Follow us:").parent().css("display"), "none");
const profiles = cheerio.load(materialize(footer, { ...fixture, footer: { ...fixture.footer, socials: { instagram: "https://www.instagram.com/leatherculture.pk/" } } }, "/", [], "https://www.leatherculture.shop"));
assert.equal(profiles("a").filter((_, a) => profiles(a).text() === "Instagram").attr("href"), "https://www.instagram.com/leatherculture.pk/");
assert.notEqual(profiles("p").filter((_, p) => profiles(p).text() === "Follow us:").parent().css("display"), "none");
console.log(`All ${urls.length} pages, schema consistency, privacy and backend-setting checks passed.`);
