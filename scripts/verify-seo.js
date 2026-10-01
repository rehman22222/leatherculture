const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const cheerio = require("cheerio");
const { materialize, publicPhone } = require("./build-storefront");

const output = path.join(__dirname, "..", "dist");
const xml = fs.readFileSync(path.join(output, "sitemap.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
for (const url of urls) {
  const html = fs.readFileSync(path.join(output, url.pathname, "index.html"), "utf8");
  const $ = cheerio.load(html);
  const schemas = $("script[type='application/ld+json']").map((_, element) => JSON.parse($(element).text())).get().flatMap(data => data["@graph"] || [data]);
  const settings = $("#lc-build-settings").length ? JSON.parse($("#lc-build-settings").text()) : null;
  $("script,style").remove();
  const text = $("body").text();
  assert(!/test@gmail|London, England|England, London|234 567|thirty days|USD\s*\$|\$\d[\d,.]*/.test(text), url.pathname);
  assert.equal($("h1").length, 1, url.pathname);
  assert.equal($("link[rel='canonical']").attr("href"), url.href);
  if (url.pathname.startsWith("/shop/")) {
    const product = settings.products.find(product => url.pathname === `/shop/${product.slug}`);
    assert(text.includes(product.price));
    assert(text.includes(product.material));
    assert(text.includes(product.care));
    const schema = schemas.find(node => node["@type"] === "Product");
    assert.equal(schema.offers.price, String(product.price).replace(/[^\d.]/g, ""));
    assert.equal(schema.offers.priceCurrency, "PKR");
    const faq = schemas.find(node => node["@type"] === "FAQPage");
    const care = faq.mainEntity.find(question => /care for/i.test(question.name));
    assert.equal(care.acceptedAnswer.text, product.care);
  }
  if (url.pathname.startsWith("/blog/")) assert(schemas.some(node => node["@type"] === "BlogPosting"));
  console.log(`Verified ${url.pathname}`);
}
for (const name of [".env", "server.js", "package.json", ".git", ".kilo"]) assert(!fs.existsSync(path.join(output, name)));
assert.equal(publicPhone("+001 234 567 890"), "");
assert.equal(publicPhone("+92 300 9876543"), "+92 300 9876543");
const fixture = { products: [], footer: { phone: "+92 300 9876543", email: "info@leatherculture.shop" }, checkout: { returnsPolicy: "Exchange within 14 days with original tags." }, content: { values: {} } };
const result = cheerio.load(materialize('<html><head></head><body><p>+001 234 567 890</p><a href="tel:001234567890">Call</a><section id="faq"><details><summary>Can I exchange an item?</summary><p>Old policy</p></details></section></body></html>', fixture, "/contact", [], "https://www.leatherculture.shop"));
assert.equal(result("a[href^='tel:']").text(), fixture.footer.phone);
assert.equal(result("#faq p").text(), fixture.checkout.returnsPolicy);
console.log(`All ${urls.length} pages, schema consistency, privacy and backend-setting checks passed.`);
