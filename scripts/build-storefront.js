const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");

const root = path.resolve(__dirname, "..");
const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
const get = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const publicPhone = value => /234\s*567|123456789|3XX|XXXXX/i.test(value || "") ? "" : String(value || "").trim();
const fallbackPolicy = "Contact info@leatherculture.shop for the current returns and exchange policy before ordering.";

function materialize(html, settings, pathname, bindings, site) {
  const $ = cheerio.load(html);
  const product = settings.products?.find(item => pathname === `/shop/${item.slug}`);
  const policy = settings.checkout?.returnsPolicy?.trim() || fallbackPolicy;
  const phone = publicPhone(settings.footer?.phone);
  const redirects = require("../vercel.json").redirects || [];
  const replacements = new Map(bindings.map(([original, key]) => [normalize(original), get(settings, key)]));
  for (const group of settings.content?.groups || []) {
    if (group.match !== "all" && group.match !== pathname && !(group.match === "/shop/*" && product)) continue;
    for (const item of group.items || []) {
      const value = settings.content?.values?.[item.key];
      if (value) replacements.set(normalize(item.original), value);
    }
  }
  replacements.set("+001 234 567 890", phone || "Email our team");
  replacements.set("England, London", settings.footer?.address || "Pakistan");
  replacements.set("London, England", settings.footer?.address || "Pakistan");
  replacements.set("test@gmail.com", settings.footer?.email || "info@leatherculture.shop");
  replacements.set("Change your mind? Return any item easily within thirty days.", policy);
  replacements.set("Easy Returns", "Returns and exchanges");
  replacements.set("Trusted Quality", "Quality checked");
  replacements.set("Secure Payments", "Cash on delivery");
  replacements.set("Shop confidently with our secure, encrypted checkout.", settings.checkout?.codNote || "Pay in cash when your order arrives.");
  if (pathname === "/") replacements.set("Premium wear for modern living", "Premium Leather Jackets Made in Pakistan");
  $("p,h1,h2,h3,h4,h5,h6,span").each((_, element) => {
    const node = $(element);
    if (node.find("p,h1,h2,h3,h4,h5,h6").length) return;
    if (normalize(node.text()) === "+001 234 567 890") node.attr("data-lc-phone", "true");
    const value = replacements.get(normalize(node.text()));
    if (typeof value === "string" && value) node.text(value);
  });
  $("a[href^='mailto:']").attr("href", `mailto:${settings.footer?.email || "info@leatherculture.shop"}`);
  const placeholders = { "test@gmail.com": "you@example.com", "+123 456 789 00": "Enter your phone number", "Nasir": "Your first name", "Nawaz": "Your last name", "Enquiry ....": "What can we help you with?" };
  $("input[placeholder],textarea[placeholder]").each((_, element) => {
    const node = $(element), value = placeholders[node.attr("placeholder")];
    if (value) node.attr("placeholder", value);
  });
  $("a[href^='tel:']").each((_, element) => {
    const node = $(element);
    node.attr("data-lc-phone", "true");
    if (phone) node.attr("href", `tel:${phone.replace(/[^+\d]/g, "")}`).text(phone);
    else node.attr("href", "mailto:info@leatherculture.shop").text("Email our team");
  });
  $("a[href*='google.com/maps']").attr("href", `https://www.google.com/maps/search/${encodeURIComponent(settings.footer?.address || "Pakistan")}`);
  // Resolve template cards before crawling, including all responsive variants.
  $("a[data-lc-template-slug],a[href*='/shop/']").each((_, element) => {
    const node = $(element);
    const slug = node.attr("data-lc-template-slug") || (node.attr("href") || "").split("/").pop();
    const destination = redirects.find(r => r.source === `/shop/${slug}`)?.destination;
    const item = settings.products?.find(item => item.enabled !== false && (item.slug === slug || item.id === slug || `/shop/${item.slug}` === destination));
    if (!item) {
      if (node.attr("data-lc-template-slug") && !node.attr("href")?.includes("/blog") && node.find("img").length) node.remove();
      return;
    }
    node.attr("href", `/shop/${item.slug}`);
    node.removeAttr("data-lc-template-slug");
    node.find("h2,h3,h4").first().text(item.name);
    node.find("[data-framer-name='Compared price']").remove();
    let priceSet = false;
    node.find("p").each((_, p) => {
      if (/^(?:USD\s*)?\$[\d,.]+/.test(normalize($(p).text()))) {
        if (!priceSet) { $(p).text(item.price); priceSet = true; }
        else $(p).remove();
      }
    });
    node.find("img").attr("src", item.image).attr("alt", item.alt || item.name).removeAttr("srcset");
  });
  if (pathname === "/shop") $("h1").text("Leather Jackets and Modern Wear in Pakistan");
  if (product) {
    $("h1").text(product.name);
    $("[data-framer-name='Pricing']").each((_, element) => {
      const pricing = $(element);
      pricing.find("[data-framer-name='Compared price']").remove();
      pricing.find("p").first().text(product.price);
    });
    $("[data-framer-name='Description text wrapper'] p").text(product.description);
    $("[data-framer-name='Product Specs'] [data-framer-name='Wrapper']").each((_, element) => {
      const row = $(element).parent();
      const nodes = row.find("p");
      const key = normalize(nodes.first().text()).toLowerCase();
      if (["material", "care", "warranty"].includes(key)) nodes.last().text(product[key] || "Contact our team for details.");
    });
  }
  const blogSlugs = new Map();
  $("a[data-lc-template-slug][href*='/blog']").each((_, element) => {
    const node = $(element), slug = node.attr("data-lc-template-slug");
    if (!blogSlugs.has(slug)) blogSlugs.set(slug, settings.blogPosts?.filter(p => p.status === "published")[blogSlugs.size]);
    const post = blogSlugs.get(slug);
    if (!post) { node.remove(); return; }
    node.attr("href", `/blog/${post.slug}`).removeAttr("data-lc-template-slug");
    node.find("h2,h3,h4").first().text(post.title);
    node.find("img").attr("src", post.coverImage).attr("alt", post.coverAlt || post.title).removeAttr("srcset");
  });
  $("p").each((_, element) => {
    if (/^(?:USD\s*)?\$[\d,.]+$/.test(normalize($(element).text()))) $(element).text("View current prices in our shop");
  });
  $("#faq details").each((_, element) => {
    const node = $(element), question = normalize(node.find("summary").text());
    if (/exchange|return|guaranteed/i.test(question)) node.find("p").text(policy);
    if (product && /care for/i.test(question)) node.find("p").text(product.care || "Contact our team for care instructions.");
    if (product && /made of/i.test(question)) node.find("p").text(product.material || "Contact our team for material details.");
  });
  // Match structured data to the HTML and the current public product record.
  $("script[type='application/ld+json']").each((_, element) => {
    const data = JSON.parse($(element).text());
    const nodes = data["@graph"] || [data];
    for (const node of nodes) {
      if (node["@type"] === "Product" && product) {
        node.name = product.name;
        node.description = product.description;
        node.image = [new URL(product.image, site).href];
        node.material = product.material;
        node.offers.price = String(product.price).replace(/[^\d.]/g, "");
        node.offers.priceCurrency = "PKR";
        delete node.offers.hasMerchantReturnPolicy;
        node.offers.availability = !(product.variants || []).length || product.variants.some(v => v.enabled !== false && Number(v.stock) > 0)
          ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
        if (node.offers.shippingDetails?.shippingRate) node.offers.shippingDetails.shippingRate.value = Number(settings.checkout?.shippingFee) || 0;
      }
      if (node["@type"] === "FAQPage") {
        node.mainEntity = $("#faq details").map((_, el) => ({ "@type": "Question", name: normalize($(el).find("summary").text()), acceptedAnswer: { "@type": "Answer", text: normalize($(el).find("p").text()) } })).get();
      }
      if ([].concat(node["@type"] || []).includes("Organization")) {
        node.email = settings.footer?.email || "info@leatherculture.shop";
        if (phone) node.telephone = phone;
        else delete node.telephone;
      }
    }
    $(element).text(JSON.stringify(data).replace(/</g, "\\u003c"));
  });
  $("#lc-business-contact").remove();
  $("body").append(`<div id="lc-business-contact" style="padding:20px;text-align:center;font:14px Arial,sans-serif">Customer enquiries: <a href="mailto:info@leatherculture.shop">info@leatherculture.shop</a> · Orders: <a href="mailto:orders@leatherculture.shop">orders@leatherculture.shop</a></div>`);
  $("head").append(`<script id="lc-build-settings" type="application/json">${JSON.stringify(settings).replace(/</g, "\\u003c")}</script>`);
  return $.html();
}

async function buildStorefront(settings, posts, site) {
  settings = structuredClone(settings);
  settings.footer.phone = publicPhone(settings.footer.phone);
  settings.checkout.returnsPolicy = settings.checkout.returnsPolicy?.trim() || fallbackPolicy;
  settings.content.values.a496f4bd68 = settings.checkout.returnsPolicy;
  settings.content.values["6f2c3442a7"] = "Quality checked";
  const output = path.join(root, "dist");
  if (path.dirname(output) !== root || path.basename(output) !== "dist") throw new Error("Invalid output path");
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  const source = await fs.readFile(path.join(root, "store-override.js"), "utf8");
  const bindings = JSON.parse(source.match(/const textBindings = (\[[\s\S]*?\n  \]);/)[1].replace(/,\s*]/g, "]"));
  const publicDirectories = ["assets", "about", "admin", "blog", "cart", "checkout", "contact", "order", "review", "shop"];
  for (const name of publicDirectories) await fs.cp(path.join(root, name), path.join(output, name), { recursive: true });
  // New products without a restored template use the backend's product renderer.
  for (const product of (settings.products || []).filter(p => p.enabled !== false)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) throw new Error(`Invalid product slug: ${product.slug}`);
    const folder = path.join(output, "shop", product.slug);
    try { await fs.access(path.join(folder, "index.html")); }
    catch {
      const api = process.env.BLOG_API_BASE || "https://leatherculture-backend.onrender.com";
      const response = await fetch(`${api}/shop/${product.slug}`, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`Product page ${product.slug}: HTTP ${response.status}`);
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, "index.html"), await response.text());
    }
  }
  for (const name of ["index.html", "404.html", "brand-override.css", "store.css", "store-override.js", "cart.js", "site-config.js", "robots.txt", "sitemap.xml", "llms.txt"]) {
    await fs.copyFile(path.join(root, name), path.join(output, name));
  }
  async function transform(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "assets" && entry.name !== "admin") await transform(file); }
      else if (entry.name === "index.html") {
        const relative = path.relative(output, path.dirname(file)).split(path.sep).join("/");
        const pathname = relative ? `/${relative}` : "/";
        if (pathname.startsWith("/blog/")) continue;
        const html = await fs.readFile(file, "utf8");
        await fs.writeFile(file, materialize(html, settings, pathname, bindings, site));
      }
    }
  }
  await transform(output);
  const pages = ["/", "/about", "/shop", "/blog", "/contact"];
  const urls = [...pages, ...(settings.products || []).filter(p => p.enabled !== false).map(p => `/shop/${p.slug}`), ...posts.map(p => `/blog/${p.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(p => `  <url><loc>${escape(new URL(p, site).href)}</loc></url>`).join("\n")}\n</urlset>\n`;
  await fs.writeFile(path.join(output, "sitemap.xml"), xml);
  console.log("Generated storefront HTML and sitemap in dist/");
}

module.exports = { buildStorefront, materialize, publicPhone, fallbackPolicy };
