const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const cheerio = require("cheerio");
const { materialize, publicPhone } = require("./build-storefront");
const { legalLinks, profileUrl } = require("../lib/seo");
const typesOf = node => [].concat(node["@type"] || []);

const output = path.join(__dirname, "..", "dist");
const xml = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
for (const url of urls) {
  const html = fs.readFileSync(path.join(output, url.pathname, "index.html"), "utf8");
  const $ = cheerio.load(html);
  const schemas = $("script[type='application/ld+json']").map((_, element) => JSON.parse($(element).text())).get().flatMap(data => data["@graph"] || [data]);
  const settings = $("#lc-build-settings").length ? JSON.parse($("#lc-build-settings").text()) : null;
  assert.equal($("body > #lc-account-link").length, 0, `${url.pathname}: legacy floating account link`);
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
  assert(!/test@gmail|London, England|England, London|234 567|thirty days|USD\s*\$|\$\d[\d,.]*/.test(text), url.pathname);
  assert.equal($("h1").length, 1, url.pathname);
  assert.equal($("link[rel='canonical']").attr("href"), url.href);
  if (url.pathname.startsWith("/shop/")) {
    const product = settings.products.find(product => url.pathname === `/shop/${product.slug}`);
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
  console.log(`Verified ${url.pathname}`);
}
for (const link of legalLinks) assert(urls.some(url => url.pathname === link.href), `sitemap.xml: ${link.href} missing`);
const llms = fs.readFileSync(path.join(output, "llms.txt"), "utf8");
for (const url of urls.filter(url => url.pathname.startsWith("/shop/"))) assert(llms.includes(url.href), `llms.txt: ${url.pathname} missing`);
for (const name of [".env", "server.js", "package.json", ".git", ".kilo"]) assert(!fs.existsSync(path.join(output, name)));
assert.equal(publicPhone("+001 234 567 890"), "");
assert.equal(publicPhone("+92 300 9876543"), "+92 300 9876543");
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
