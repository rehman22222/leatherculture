const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const cheerio = require("cheerio");
const { profileUrl, organization, verificationTags, analyticsTags, displayImage, cardImage, legalLinks } = require("../lib/seo");
const { renderPolicyPage, policyPaths, POLICY_UPDATED } = require("../lib/policy-pages");
const { renderProductPage } = require("../lib/product-renderer");
const { renderCategoryPage, categoryDirectory, categoryStyles } = require("../lib/category-renderer");
const { normalizeStoreCategories, categoryIsIndexable } = require("../lib/category-catalog");
const { shippingDetails, returnPolicy } = require("../shop/commerce-schema");
const { sourcesFor } = require("../lib/citations");

const root = path.resolve(__dirname, "..");
const normalize = value => String(value || "").replace(/\s+/g, " ").trim();
const get = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const publicPhone = value => /234\s*567|123456789|3XX|XXXXX/i.test(value || "") ? "" : String(value || "").trim();
const fallbackPolicy = "Contact contact@leatherculture.shop for the current returns and exchange policy before ordering.";

// Product pages are generated only for enabled products. Old Framer content and older journal
// articles can retain a product URL after an item is retired; send those visitors to the live shop.
function repairRetiredProductLinks($, settings) {
  const activeSlugs = new Set((settings.products || []).filter(product => product.enabled !== false).map(product => product.slug));
  $("a[href]").each((_, element) => {
    const link = $(element);
    const match = /(?:^|\/)shop\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:[/?#]|$)/i.exec(link.attr("href") || "");
    if (match && !activeSlugs.has(match[1])) link.attr("href", "/shop").removeAttr("data-lc-template-slug");
  });
}

const assetId = src => (/\/assets\/cdn\/images\/([A-Za-z0-9]+)-[0-9a-f]{8}\./.exec(src || "") || [])[1] || "";
const priceValue = value => { const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/); return match ? Number(match[0]) : 0; };
// Order, review and password-reset links carry private tokens in the URL, so analytics stays off there.
const privatePage = pathname => /^\/(account|order|review)(\/|$)/.test(pathname);

// Framer renders "fade in on scroll" layers (product and journal cards) at opacity 0 and relies on its
// runtime to reveal them. That runtime is deferred until the visitor interacts (or 15 s on inner
// pages), which left whole sections blank on phones. Those layers are marked here and kept visible;
// they lose the fade, nothing else. Intentionally hidden layers (search bar, menu, arrows) use other
// styles and are untouched.
function revealScrollAnimatedContent($) {
  let marked = 0;
  $("[style]").each((_, element) => {
    const style = String($(element).attr("style")).replace(/\s+/g, "");
    if (/(?:^|;)will-change:transform;/.test(style) && /(?:^|;)opacity:0;/.test(style) && /(?:^|;)transform:translateY\(/.test(style)) {
      $(element).attr("data-lc-reveal", "");
      marked += 1;
    }
  });
  if (marked && !$("style[data-lc-reveal-style]").length) {
    $("head").append("<style data-lc-reveal-style>[data-lc-reveal]{opacity:1!important;transform:none!important}</style>");
  }
}

// The source template has a fixed Men/Women/Children collection component. Replace it at build
// time with the product-led directory, which remains valid as bags, shoes and accessories launch.
function injectCategoryDirectory($, settings, pathname) {
  if (pathname !== "/" && pathname !== "/shop") return;
  if ($(".lc-collection-directory").length) return;
  const directory = categoryDirectory(settings);
  if (!directory) return;
  if (!$("style[data-lc-category-style]").length) $("head").append(categoryStyles());

  const legacyTitle = normalize(settings.sections?.collections?.title || "Modern collections defined by simplicity");
  $("h1,h2,h3,h4,p,span").filter((_, element) => normalize($(element).text()) === legacyTitle).each((_, element) => {
    const section = $(element).closest("section");
    if (section.length) section.attr("data-lc-legacy-collections", "").css("display", "none");
  });

  if (pathname === "/") {
    // Categories belong directly below the in-page lookbook reel, before the next homepage block.
    const video = $("section[data-framer-name='Video']").first();
    if (video.length) {
      video.after(directory);
      return;
    }
  }

  if (pathname === "/shop") {
    // The exported Shop template still has non-functional Men/Women/Children tabs. The product-led
    // collection directory takes their place and links to the real collection URLs.
    $("section[data-framer-name='Shop'] [data-framer-name='Tabs']").attr("data-lc-legacy-category-tabs", "").attr("aria-hidden", "true").css("display", "none");
    const shop = $("section[data-framer-name='Shop']").first();
    if (shop.length) {
      shop.before(directory);
      return;
    }
  }

  const answers = $(".lc-answers .lc-answers-inner").first();
  if (answers.length) {
    answers.append(directory);
    return;
  }
  const main = $("#main").first();
  if (!main.length) return;
  const footer = main.find("footer").last();
  if (footer.length) footer.before(directory);
  else main.append(directory);
}

// The exported Journal template has visual-only demo tabs and placeholder story links.
// Replace that block with the published journal, real filters and valid article URLs.
function journalGroups(post) {
  const context = [normalize(post.category), normalize(post.title), String(post.slug || "")].join(" ").toLowerCase();
  const groups = ["all"];
  if (/style|wear|outfit|minimal/.test(context)) groups.push("style");
  if (/buying|online|price|real.leather|choose|gift/.test(context)) groups.push("buying");
  if (/care|size/.test(context)) groups.push("care");
  return groups;
}

function journalDirectoryStyles() {
  return '<style data-lc-journal-style>' +
    '.lc-journal-directory{max-width:1440px;margin:0 auto;padding:clamp(56px,8vw,112px) clamp(18px,4vw,64px);background:#f8f8f8;color:#0d0d0d}' +
    '.lc-journal-directory *{box-sizing:border-box}.lc-journal-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin:0 0 30px}.lc-journal-eyebrow{margin:0 0 8px;color:#735d3e;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.lc-journal-heading h2{margin:0;font-size:clamp(34px,4vw,62px);line-height:.98;letter-spacing:-.055em}.lc-journal-count{margin:0;color:#666;font-size:14px;white-space:nowrap}' +
    '.lc-journal-filters{display:flex;gap:8px;overflow-x:auto;padding:9px;margin:0 0 34px;border-radius:999px;background:#e9e8e5;scrollbar-width:none}.lc-journal-filters::-webkit-scrollbar{display:none}.lc-journal-filter{appearance:none;flex:1 0 max(150px,22%);min-height:50px;border:0;border-radius:999px;background:transparent;color:#111;cursor:pointer;font:700 15px/1 Inter,Arial,sans-serif;transition:background-color .2s ease,color .2s ease,transform .2s ease}.lc-journal-filter:hover{background:#fff}.lc-journal-filter:focus-visible{outline:3px solid #a77b38;outline-offset:2px}.lc-journal-filter[aria-pressed="true"]{background:#090909;color:#fff}' +
    '.lc-journal-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.lc-journal-card{display:flex;min-width:0;overflow:hidden;border:1px solid #e5e2dc;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(24,18,12,.05);transition:transform .22s ease,box-shadow .22s ease}.lc-journal-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px rgba(24,18,12,.12)}.lc-journal-card a{display:flex;flex-direction:column;width:100%;color:inherit;text-decoration:none}.lc-journal-card img{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;background:#ebe8e1}.lc-journal-card-copy{display:flex;min-height:206px;flex-direction:column;padding:20px}.lc-journal-card-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 15px;color:#775e3d;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.lc-journal-card h3{margin:0 0 12px;font-size:22px;line-height:1.14;letter-spacing:-.035em}.lc-journal-card p{margin:0;color:#5a5752;font-size:14px;line-height:1.55}.lc-journal-read{margin-top:auto;padding-top:18px;color:#111;font-size:13px;font-weight:800}.lc-journal-empty{margin:0;padding:54px 22px;border:1px dashed #c9c3bb;border-radius:18px;color:#5a5752;text-align:center}.lc-journal-empty button{border:0;background:none;color:#111;cursor:pointer;font:inherit;font-weight:800;text-decoration:underline}' +
    '@media(max-width:900px){.lc-journal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.lc-journal-directory{padding:54px 18px}.lc-journal-heading{align-items:start;flex-direction:column;gap:8px}.lc-journal-filters{margin-right:-18px;border-radius:18px 0 0 18px}.lc-journal-filter{flex-basis:136px}.lc-journal-grid{grid-template-columns:1fr;gap:14px}.lc-journal-card{border-radius:14px}.lc-journal-card a{display:grid;grid-template-columns:38% 1fr}.lc-journal-card img{height:100%;min-height:178px;aspect-ratio:auto}.lc-journal-card-copy{min-height:178px;padding:16px}.lc-journal-card h3{font-size:18px}.lc-journal-card p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.lc-journal-read{padding-top:10px}}' +
    '</style>';
}

function journalDirectory(posts) {
  const filters = [["all", "All Blogs"], ["style", "Style Guides"], ["buying", "Buying Guides"], ["care", "Care & Fit"]];
  const sorted = [...posts].sort((a, b) => String(b.dateModified || b.date || "").localeCompare(String(a.dateModified || a.date || "")));
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? new Date(String(value) + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
  const cards = sorted.map(post => {
    const category = normalize(post.category) || "Leather guide";
    return '<article class="lc-journal-card" data-lc-journal-card data-lc-groups="' + escape(journalGroups(post).join(" ")) + '"><a href="/blog/' + escape(post.slug) + '"><img src="' + escape(cardImage(post.coverImage)) + '" alt="' + escape(post.coverAlt || post.title) + '" width="800" height="600" loading="lazy" decoding="async"><div class="lc-journal-card-copy"><div class="lc-journal-card-meta"><span>' + escape(category) + '</span><time datetime="' + escape(post.date || "") + '">' + escape(date(post.date)) + '</time></div><h3>' + escape(post.title) + '</h3><p>' + escape(post.excerpt || "") + '</p><span class="lc-journal-read">Read guide <span aria-hidden="true">&#8594;</span></span></div></a></article>';
  }).join("");
  const buttons = filters.map((filter, index) => '<button class="lc-journal-filter" type="button" data-lc-journal-filter="' + filter[0] + '" aria-pressed="' + String(index === 0) + '">' + filter[1] + '</button>').join("");
  const script = '<script data-lc-journal-filter-script>(function(){const root=document.currentScript.closest("[data-lc-journal-directory]");if(!root)return;const buttons=[...root.querySelectorAll("[data-lc-journal-filter]")],cards=[...root.querySelectorAll("[data-lc-journal-card]")],count=root.querySelector("[data-lc-journal-count]"),empty=root.querySelector("[data-lc-journal-empty]");function select(group){let visible=0;cards.forEach(card=>{const show=group==="all"||card.dataset.lcGroups.split(" ").includes(group);card.hidden=!show;if(show)visible+=1});buttons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.lcJournalFilter===group)));count.textContent=visible===1?"1 guide":visible+" guides";empty.hidden=visible!==0}buttons.forEach(button=>button.addEventListener("click",()=>select(button.dataset.lcJournalFilter)));root.querySelector("[data-lc-journal-reset]").addEventListener("click",()=>select("all"));select("all")})();</script>';
  return '<section class="lc-journal-directory" data-lc-journal-directory aria-labelledby="lc-journal-title"><div class="lc-journal-heading"><div><p class="lc-journal-eyebrow">LeatherCulture journal</p><h2 id="lc-journal-title">Guides worth keeping</h2></div><p class="lc-journal-count" data-lc-journal-count>' + sorted.length + ' guides</p></div><div class="lc-journal-filters" role="group" aria-label="Filter journal guides">' + buttons + '</div><div class="lc-journal-grid" data-lc-journal-grid>' + cards + '</div><p class="lc-journal-empty" data-lc-journal-empty hidden>No guides in this section yet. <button type="button" data-lc-journal-reset>Show all guides</button></p>' + script + '</section>';
}

function injectJournalDirectory($, settings, pathname) {
  if (pathname !== "/blog" || $("[data-lc-journal-directory]").length) return;
  const posts = (settings.blogPosts || []).filter(post => post.status === "published" && post.slug);
  if (!posts.length) return;
  if (!$("style[data-lc-journal-style]").length) $("head").append(journalDirectoryStyles());
  const legacy = $("section#animate,section[data-framer-name='Blog']").filter((_, element) => $(element).find("[data-framer-name='Tabs']").length).first();
  if (legacy.length) legacy.replaceWith(journalDirectory(posts));
  else $("#main footer").first().before(journalDirectory(posts));
}

function materialize(html, settings, pathname, bindings, site, imageAlts = {}, assets = null) {
  site = String(site).replace(/\/+$/, "");
  const $ = cheerio.load(html);
  const brandStylesheet = [...(assets?.keys() || [])].find(file => file.startsWith("/assets/css/brand-"));
  if (brandStylesheet && $("style[data-lc-brand]").length) {
    $("style[data-lc-brand]").remove();
    $("head").append(`<link rel="stylesheet" href="${brandStylesheet}" data-lc-brand>`);
  }
  if (!$("link[href*='/account/nav.css']").length) $("head").append('<link rel="stylesheet" href="/account/nav.css?v=2">');
  revealScrollAnimatedContent($);
  injectJournalDirectory($, settings, pathname);
  // Pages from the product renderer already carry these tags.
  if (!$("meta[name='author']").length) $("head").append(`<meta name="author" content="${escape(settings.brand?.name || "LeatherCulture")}">`);
  if (!$("meta[name='google-site-verification'],meta[name='msvalidate.01']").length) $("head").append(verificationTags(settings));
  if (!privatePage(pathname) && !$("script[src*='googletagmanager.com/gtag/js']").length) $("head").append(analyticsTags(settings));
  const product = settings.products?.find(item => pathname === `/shop/${item.slug}`);
  if (product && $("script[src*='store-override.js']").length) $("head").append('<script src="/shop/commerce-schema.js?v=1"></script>');
  const pageSeo = product || settings.pages?.find(page => page.path === pathname);
  if (pageSeo?.metaTitle) {
    $("title").text(pageSeo.metaTitle);
    $("meta[property='og:title'],meta[name='twitter:title']").attr("content", pageSeo.metaTitle);
  }
  if (pageSeo?.metaDescription) $("meta[name='description'],meta[property='og:description'],meta[name='twitter:description']").attr("content", pageSeo.metaDescription);
  if (pageSeo?.keywords) $("meta[name='keywords']").attr("content", pageSeo.keywords);
  const policy = settings.checkout?.returnsPolicy?.trim() || fallbackPolicy;
  const deliveryEstimate = (String(settings.checkout?.codNote || "").match(/\d+\s*[-–]\s*\d+\s*(?:working\s+)?days/i) || [])[0];
  const prices = (settings.products || []).filter(item => item.enabled !== false).map(item => priceValue(item.price)).filter(Boolean);
  const priceText = prices.length ? ` Current collection prices start at Rs ${Math.min(...prices).toLocaleString("en-US")}.` : "";
  const deliveryText = deliveryEstimate ? ` Estimated delivery across Pakistan takes ${escape(deliveryEstimate)}.` : "";
  const leadCopy = {
    "/": `Explore the current <a href="/shop">LeatherCulture leather collection</a> in Pakistan.${escape(priceText)}${deliveryText} Jackets are available now, with bags, shoes and accessories planned for future releases. For sizing, materials or order questions, <a href="/contact">contact our team</a>.`,
    "/shop": `Browse the current LeatherCulture leather collection and choose a style for your wardrobe.${escape(priceText)}${deliveryText} Jackets are available now; bags, shoes and accessories are being prepared for future releases. Read the <a href="/blog/leather-jacket-price-pakistan">jacket buying guide</a> and <a href="/contact">ask our team</a> about measurements or materials before ordering.`,
    "/about": 'LeatherCulture is building a leather-goods collection for Pakistan, beginning with jackets and expanding to bags, shoes and accessories. Explore the <a href="/shop">current collection</a>, or <a href="/contact">contact the team</a> for product measurements, material details and order support.',
    "/contact": `Contact LeatherCulture at <a href="mailto:${escape(settings.footer?.email || "contact@leatherculture.shop")}">${escape(settings.footer?.email || "contact@leatherculture.shop")}</a> for sizing, product details, order updates and returns.${deliveryText} See our <a href="/terms#returns">returns and refund policy</a> before sending an item back.`,
    "/blog": 'Practical jacket buying, sizing, styling and care guides from the LeatherCulture team. Browse the guides below and explore the <a href="/shop">current jacket collection</a>.'
  };
  if (leadCopy[pathname]) $(".lc-answers .lc-lede").first().html(leadCopy[pathname]);
  injectCategoryDirectory($, settings, pathname);
  $(".lc-answers p").each((_, element) => {
    const node = $(element);
    if (/Every LeatherCulture jacket is made from genuine leather and finished by hand/i.test(node.text())) node.html('Check the individual product details and <a href="/contact">ask our team to confirm the shell material, lining and construction</a> before ordering.');
  });
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
  replacements.set("info@leatherculture.shop", settings.footer?.email || "contact@leatherculture.shop");
  replacements.set("test@gmail.com", settings.footer?.email || "contact@leatherculture.shop");
  replacements.set("Change your mind? Return any item easily within thirty days.", policy);
  replacements.set("Easy Returns", "Returns and exchanges");
  replacements.set("Trusted Quality", "Quality checked");
  replacements.set("Secure Payments", "Cash on delivery");
  replacements.set("Shop confidently with our secure, encrypted checkout.", settings.checkout?.codNote || "Pay in cash when your order arrives.");
  // Keep the SSR hero copy identical to the settings snapshot that hydrates later.
  // A different build-time title makes the above-the-fold heading re-wrap once Framer
  // takes over, which is a guaranteed mobile layout shift.
  if (pathname === "/") replacements.set("Premium wear for modern living", settings.hero?.title || "Premium Leather Jackets Made in Pakistan");
  $("p,h1,h2,h3,h4,h5,h6,span").each((_, element) => {
    const node = $(element);
    if (node.find("p,h1,h2,h3,h4,h5,h6").length) return;
    if (normalize(node.text()) === "+001 234 567 890") node.attr("data-lc-phone", "true");
    const value = replacements.get(normalize(node.text()));
    if (typeof value === "string" && value) node.text(value);
    if (deliveryEstimate && !node.children().length && /3[-–]5 working days/i.test(node.text())) node.text(node.text().replace(/3[-–]5 working days/gi, deliveryEstimate));
  });
  $("a[href^='mailto:']").attr("href", `mailto:${settings.footer?.email || "contact@leatherculture.shop"}`);
  $("a[href^='mailto:']").each((_, element) => {
    const node = $(element);
    if (["info@leatherculture.shop", "test@gmail.com"].includes(normalize(node.text()))) node.text(settings.footer?.email || "contact@leatherculture.shop");
  });
  const placeholders = { "test@gmail.com": "you@example.com", "+123 456 789 00": "Enter your phone number", "Nasir": "Your first name", "Nawaz": "Your last name", "Enquiry ....": "What can we help you with?" };
  $("input[placeholder],textarea[placeholder]").each((_, element) => {
    const node = $(element), value = placeholders[node.attr("placeholder")];
    if (value) node.attr("placeholder", value);
  });
  $("a[href^='tel:']").each((_, element) => {
    const node = $(element);
    node.attr("data-lc-phone", "true");
    const label = node.find("p").last();
    (label.length ? label : node).text(phone || "Email our team");
    node.attr("href", phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : `mailto:${settings.footer?.email || "contact@leatherculture.shop"}`);
    if (node.closest("footer").length && !phone) node.parent().attr("data-lc-phone-row", "true").attr("hidden", "");
  });
  $("a[href*='google.com/maps']").attr("href", `https://www.google.com/maps/search/${encodeURIComponent(settings.footer?.address || "Pakistan")}`);
  $("footer a[href^='mailto:'],footer a[href^='tel:'],footer a[href*='google.com/maps']").each((_, element) => {
    const link = $(element);
    if (!link.find("svg").length) return;
    link.addClass("lc-contact-link");
    link.parent().addClass("lc-contact-row").parent().addClass("lc-contact-list");
    link.parent().parent().parent().addClass("lc-contact-column").parent().addClass("lc-contact-columns");
    const icon = link.find("svg").first();
    const kind = link.attr("href").startsWith("mailto:") ? "email" : link.attr("href").startsWith("tel:") ? "phone" : "location";
    const shapes = { email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>', phone: '<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z"/>', location: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>' };
    icon.attr({ class: "lc-contact-icon", "aria-hidden": "true", fill: "none", stroke: "currentColor", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round" }).html(shapes[kind]);
  });
  // Resolve demo catalogue slots before rewriting retired links. Keep one assignment per
  // template slug so desktop/mobile copies show the same live product without hydration.
  const liveProducts = (settings.products || []).filter(item => item.enabled !== false);
  const catalogSlots = $("a[data-lc-template-slug],a[href*='/shop/']").filter((_, element) => {
    const node = $(element);
    return node.find("img").length && /(?:^|\/)shop(?:\/|$)/.test(node.attr("href") || "");
  });
  const slotSlug = node => node.attr("data-lc-template-slug") || (node.attr("href") || "").split("/").pop();
  const resolveProduct = slug => {
    const destination = redirects.find(r => r.source === `/shop/${slug}`)?.destination;
    return liveProducts.find(item => item.slug === slug || item.id === slug || `/shop/${item.slug}` === destination);
  };
  const groups = new Map();
  catalogSlots.each((_, element) => {
    const node = $(element), slug = slotSlug(node);
    const section = node.closest("section")[0] || $.root()[0];
    if (!groups.has(section)) {
      const reserved = new Set(catalogSlots.toArray()
        .filter(element => ($(element).closest("section")[0] || $.root()[0]) === section)
        .map(element => resolveProduct(slotSlug($(element)))).filter(Boolean));
      groups.set(section, { assignments: new Map(), spareProducts: liveProducts.filter(item => !reserved.has(item)) });
    }
    const { assignments, spareProducts } = groups.get(section);
    if (!assignments.has(slug)) assignments.set(slug, resolveProduct(slug) || spareProducts.shift() || null);
    const item = assignments.get(slug);
    if (item) node.attr("data-lc-template-slug", item.slug);
    else node.remove();
  });
  // Resolve template cards before crawling, including all responsive variants.
  $("a[data-lc-template-slug],a[href*='/shop/']").each((_, element) => {
    const node = $(element);
    const slug = node.attr("data-lc-template-slug") || (node.attr("href") || "").split("/").pop();
    const destination = redirects.find(r => r.source === `/shop/${slug}`)?.destination;
    const item = settings.products?.find(item => item.enabled !== false && (item.slug === slug || item.id === slug || `/shop/${item.slug}` === destination));
    if (!item) {
      if (node.attr("data-lc-template-slug") && !node.attr("href")?.includes("/blog") && node.find("img").length) node.remove();
      // Retired Framer cards can still be present in the source HTML. Keep the card's
      // collection intent, but never publish a link to a product page that no longer exists.
      else if ((node.attr("href") || "").includes("/shop/")) node.attr("href", "/shop").removeAttr("data-lc-template-slug");
      return;
    }
    node.attr("href", `/shop/${item.slug}`);
    node.removeAttr("data-lc-template-slug");
    const name = node.find("h2,h3,h4").first();
    if (name.length) name.text(item.name);
    else node.find("p").filter((_, p) => !/^(?:USD\s*)?\$[\d,.]+/.test(normalize($(p).text())) && normalize($(p).text()).length > 12).first().text(item.name);
    node.find("[data-framer-name='Compared price']").remove();
    let priceSet = false;
    node.find("p").each((_, p) => {
      if (/^(?:USD\s*)?\$[\d,.]+/.test(normalize($(p).text()))) {
        if (!priceSet) { $(p).text(item.price); priceSet = true; }
        else $(p).remove();
      }
    });
    node.find("img").attr("src", cardImage(item.image)).attr("alt", item.alt || item.name).removeAttr("srcset");
  });
  if (pathname === "/shop") $("h1").text("Leather Goods in Pakistan");
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
  $("a[data-lc-template-slug][href*='/blog'],a[href*='/blog/']").filter((_, element) => $(element).find("img").length).each((_, element) => {
    const node = $(element), slug = node.attr("data-lc-template-slug") || (node.attr("href") || "").split("/").pop();
    if (!blogSlugs.has(slug)) blogSlugs.set(slug, settings.blogPosts?.filter(p => p.status === "published")[blogSlugs.size]);
    const post = blogSlugs.get(slug);
    if (!post) { node.remove(); return; }
    node.attr("href", `/blog/${post.slug}`).removeAttr("data-lc-template-slug");
    const heading = node.find("h2,h3,h4").first();
    if (heading.length) heading.text(post.title);
    else node.find("p").filter((_, p) => normalize($(p).text()).length > 25).first().text(post.title);
    node.find("p").each((_, element) => {
      const p = $(element), text = normalize(p.text());
      if (/^(Style guide|Leather care|Buying guide)$/i.test(text)) p.text(post.category || "Journal");
      else if (/^\d+\s*min\s*read$/i.test(text)) p.text(post.readTime || "5 min read");
      else if (/^(?:\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]{2}\s+\d{1,2},\s*\d{4})$/.test(text) && post.date) p.text(new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }));
      else if (text.length > 60 && text !== post.title) p.text(post.excerpt || "");
    });
    node.find("[data-framer-name='Description'] p").text(post.excerpt || "");
    node.find("img").attr("src", cardImage(post.coverImage)).attr("alt", post.coverAlt || post.title).removeAttr("srcset");
  });
  // Collection cards carry template prices ("$45.00"); show the live price range of each collection.
  $("p").each((_, element) => {
    if (/^(?:USD\s*)?\$[\d,.]+$/.test(normalize($(element).text()))) $(element).text("View current prices in our shop");
  });
  // The first paragraph is the answer; quotations and further-reading links can follow it.
  $("#faq details").each((_, element) => {
    const node = $(element), question = normalize(node.find("summary").text()), answer = node.children("p").first();
    if (/exchange|return|guaranteed/i.test(question)) answer.text(policy);
    if (product && /care for/i.test(question)) answer.text(product.care || "Contact our team for care instructions.");
    if (product && /made of/i.test(question)) answer.text(product.material || "Contact our team for material details.");
  });
  // Match structured data to the HTML and the current public product record.
  $("script[type='application/ld+json']").each((_, element) => {
    const data = JSON.parse($(element).text());
    const nodes = data["@graph"] || [data];
    for (const node of nodes) {
      if (node["@type"] === "BreadcrumbList" && !node.name && Array.isArray(node.itemListElement)) {
        node.name = node.itemListElement.map(item => item.name).filter(Boolean).join(" › ");
      }
      if (["WebPage", "CollectionPage", "AboutPage", "ContactPage"].includes(node["@type"]) && pageSeo) {
        if (pageSeo.metaTitle) node.name = pageSeo.metaTitle;
        if (pageSeo.metaDescription) node.description = pageSeo.metaDescription;
      }
      if (node["@type"] === "Product" && product) {
        node.name = product.name;
        node.description = product.description;
        node.image = [...new Set([product.image, ...(product.gallery || []).map(image => image.image)].filter(Boolean))].map(image => new URL(displayImage(image), site).href);
        if (product.material) node.material = product.material;
        else delete node.material;
        node.offers.price = String(priceValue(product.price));
        node.offers.priceCurrency = "PKR";
        const returns = returnPolicy(settings.checkout, site);
        if (returns) node.offers.hasMerchantReturnPolicy = returns;
        else delete node.offers.hasMerchantReturnPolicy;
        node.offers.availability = !(product.variants || []).length || product.variants.some(v => v.enabled !== false && Number(v.stock) > 0)
          ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
        node.offers.shippingDetails = shippingDetails(priceValue(product.price), settings.checkout);
      }
      if (node["@type"] === "FAQPage") {
        node.mainEntity = $("#faq details").map((_, el) => ({ "@type": "Question", name: normalize($(el).find("summary").text()), acceptedAnswer: { "@type": "Answer", text: normalize($(el).children("p").first().text()) } })).get();
      }
      const types = [].concat(node["@type"] || []);
      if (types.includes("Organization")) {
        const brand = organization(settings, site);
        node.email = brand.email;
        if (brand.hasMerchantReturnPolicy) node.hasMerchantReturnPolicy = brand.hasMerchantReturnPolicy;
        else delete node.hasMerchantReturnPolicy;
        if (brand.sameAs) node.sameAs = brand.sameAs;
        else delete node.sameAs;
        if (phone) node.telephone = phone;
        else delete node.telephone;
        for (const point of [].concat(node.contactPoint || [])) {
          point.email = brand.email;
          if (phone) point.telephone = phone;
          else delete point.telephone;
        }
      }
      // There is no search results page to point a SearchAction at.
      if (types.includes("WebSite")) delete node.potentialAction;
      // Dated pages name their author: the LeatherCulture team (the Organization node).
      if (types.some(type => /Page$/.test(type)) && (node.datePublished || node.dateModified) && !node.author) node.author = { "@id": `${site}/#organization` };
    }
    $(element).text(JSON.stringify(data).replace(/</g, "\\u003c"));
  });
  // Footer social links: real profiles only. The template's placeholders (https://instagram.com) are hidden.
  const socials = { Instagram: profileUrl(settings.footer?.socials?.instagram), Facebook: profileUrl(settings.footer?.socials?.facebook), Twitter: profileUrl(settings.footer?.socials?.twitter), Youtube: profileUrl(settings.footer?.socials?.youtube), Dribbble: "" };
  const socialLists = new Set();
  $("a").each((_, element) => {
    const link = $(element), label = normalize(link.text());
    if (!(label in socials)) return;
    const holder = link.parent().children().length === 1 ? link.parent() : link;
    const url = socials[label];
    const duplicate = url && holder.prev().find("a").first().attr("href") === url;
    if (url && !duplicate) link.attr("href", url).attr("rel", "noopener me");
    else holder.css("display", "none");
    socialLists.add(holder.parent().get(0));
  });
  for (const list of socialLists) {
    const title = $(list).prev();
    const empty = $(list).children().toArray().every(child => $(child).css("display") === "none");
    if (empty && title.length && !title.find("a").length) title.css("display", "none");
  }
  $(".lc-answers .lc-meta a[href='/about']").attr("rel", "author");
  $("#lc-business-contact").remove();
  $("#lc-account-link").remove();
  const accountMarkup = '<a class="lc-account-nav" href="/account" rel="nofollow" aria-label="My account"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg><span>My account</span></a>';
  $(".framer-149q19i-container [data-framer-name='Links wrapper']").each((_, element) => {
    if (!$(element).find(".lc-account-nav").length) $(element).append(`<div class="lc-account-nav-container">${accountMarkup}</div>`);
  });
  $(".site-header nav").each((_, element) => {
    if (!$(element).find(".lc-account-nav").length) $(element).append(accountMarkup);
  });
  const email = escape(settings.footer?.email || "contact@leatherculture.shop");
  $("body").append(`<div id="lc-business-contact" style="padding:20px;text-align:center;font:14px/1.8 Arial,sans-serif">Customer enquiries: <a href="mailto:${email}">${email}</a> · Orders: <a href="mailto:orders@leatherculture.shop">orders@leatherculture.shop</a> · ${legalLinks.map(link => `<a href="${link.href}">${escape(link.label)}</a>`).join(" · ")}</div>`);
  repairRetiredProductLinks($, settings);
  // Every image needs alt text: curated text for the template's assets, else the label of its link.
  $("img").each((_, element) => {
    const img = $(element), curated = imageAlts[assetId(img.attr("src"))];
    if (curated) return void img.attr("alt", curated);
    if (normalize(img.attr("alt"))) return;
    const link = img.closest("a");
    const label = link.attr("aria-label") || link.attr("data-brand") || normalize(link.find("h1,h2,h3,h4,h5,h6").first().text());
    if (label) img.attr("alt", label);
  });
  if (["/", "/shop", "/contact"].includes(pathname)) $(".lc-answers .lc-lede").first().after(factsTable(settings));
  addCareHowTo($);
  frontLoad($, settings, assets, pathname);
  applyAccessibilityMarkup($, pathname, phone);
  return $.html();
}

// Framer's exported markup uses visual components for a few controls. Fix the small semantic
// gaps in the generated HTML as well as at runtime, so the page remains accessible before (or
// without) hydration and the audit never depends on a timing race.
function applyAccessibilityMarkup($, pathname, phone) {
  const retag = (node, tag) => {
    const replacement = $(`<${tag}></${tag}>`).attr(node.attr()).html(node.html());
    node.replaceWith(replacement);
  };

  // The announcement ticker is visually a group, but its direct children are list items. Keep
  // the native list semantics rather than overriding them with role="group".
  $("ul[role='group']").filter((_, element) => $(element).children("li.ticker-item").length).attr("role", "list");

  $("nav[data-framer-name='Mobile']").each((index, element) => {
    const nav = $(element);
    const panel = nav.find(".framer-yf8xve").first();
    const trigger = nav.find("[data-framer-name='Menu']").first();
    if (!panel.length || !trigger.length) return;
    const panelId = panel.attr("id") || `lc-mobile-navigation-${index + 1}`;
    panel.attr("id", panelId);
    trigger.attr({
      role: "button",
      tabindex: "0",
      "aria-controls": panelId,
      "aria-expanded": "false",
      "aria-label": "Open navigation menu"
    });
  });

  $("a[data-lc-phone]").attr("aria-label", phone ? `Call LeatherCulture at ${phone}` : "Email our team at LeatherCulture");

  // At phone width Framer shows a responsive H2 hero variant. It is the primary page title, so
  // make it an H1 in the static document too. The collection-card H3s remain children of their
  // preceding Collections H2.
  if (pathname === "/") {
    // The desktop copy is hidden at phone width. Demote it first so the static DOM has exactly
    // one H1; the runtime promotes the visible desktop hero after a responsive render.
    $("h1.framer-styles-preset-16abb0u").each((_, element) => retag($(element), "h2"));
    $(".ssr-variant.hidden-a8katl.hidden-72rtr7 h2.framer-styles-preset-16abb0u").each((_, element) => retag($(element), "h1"));
  }

  if (!$("style[data-lc-a11y]").length) {
    $("head").append(`<style data-lc-a11y>
      [data-framer-name="Reviews"] .framer-styles-preset-ffjk29,
      .lc-answers .lc-meta { --framer-text-color: #6b6b6b !important; color: #6b6b6b !important; }
      footer a[data-lc-phone],
      footer a[data-lc-phone] .framer-text { --framer-text-color: #fff !important; color: #fff !important; }
      :where(a, button, input, select, textarea, summary, [role="button"]):focus-visible {
        outline: 3px solid #0a67ff !important;
        outline-offset: 3px !important;
      }
    </style>`);
  }
}

// Ordering facts as a table, from the same checkout settings the cart uses.
function factsTable(settings) {
  const checkout = settings.checkout || {};
  const currency = checkout.currency || "Rs";
  const money = value => `${currency} ${Number(value).toLocaleString("en-PK")}`;
  const fee = Number(checkout.shippingFee) || 0, free = Number(checkout.freeShippingFrom) || 0;
  const days = (String(checkout.codNote || "").match(/\d+\s*[-–]\s*\d+\s*(?:working\s+)?days/i) || [])[0];
  const prices = (settings.products || []).filter(item => item.enabled !== false).map(item => priceValue(item.price)).filter(Boolean);
  const rows = [
    ["Delivery area", "Anywhere in Pakistan"],
    days && ["Delivery time", days],
    ["Delivery fee", fee ? `${money(fee)}${free ? `, free on orders of ${money(free)} or more` : ""}` : "Free"],
    checkout.codEnabled !== false && ["Payment", "Cash on delivery"],
    prices.length && ["Prices", `${money(Math.min(...prices))} to ${money(Math.max(...prices))}`],
    ["Returns and exchanges", String(checkout.returnsPolicy || "").trim() || fallbackPolicy]
  ].filter(Boolean);
  return `<table class="lc-facts"><caption>Ordering from LeatherCulture at a glance</caption><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${escape(label)}</th><td>${escape(value)}</td></tr>`).join("")}</tbody></table>`;
}

// The care answer lists its steps; describe them as a HowTo when the page has none yet.
function addCareHowTo($) {
  const steps = $(".lc-answers details").filter((_, element) => /care for a leather jacket/i.test($(element).find("summary").text())).find("ol > li");
  const hasHowTo = $("script[type='application/ld+json']").toArray().some(element => /"HowTo"/.test($(element).text()));
  if (steps.length < 2 || hasHowTo) return;
  const howTo = {
    "@context": "https://schema.org", "@type": "HowTo", name: "How to care for a leather jacket",
    step: steps.map((index, element) => ({ "@type": "HowToStep", position: index + 1, name: normalize($(element).find("b").first().text()).replace(/\.$/, ""), text: normalize($(element).text()) })).get()
  };
  $("head").append(`<script type="application/ld+json">${JSON.stringify(howTo).replace(/</g, "\\u003c")}</script>`);
}

// Crawlers and AI tools that read only the start of a page should still reach the content:
// structured data goes right after the title, Framer's 200 KB stylesheet becomes a cached file,
// the answers section leads the body (CSS keeps it below the page content and store-override.js
// moves it above the footer), and the settings blob goes to the end, next to the script that reads it.
// The page script needs journal titles, excerpts and dates for its cards, never article bodies, and
// only the editable-text entries that change this page. Every page used to carry all six articles.
function pageSettingsSnapshot(settings, pathname) {
  const clean = String(pathname || "/").replace(/\/$/, "") || "/";
  const values = settings.content?.values || {};
  const groups = (settings.content?.groups || [])
    .filter(group => group.match === "all" || (group.match === "/shop/*" ? /^\/shop\/[^/]+$/.test(clean) : group.match === clean))
    .map(group => ({ ...group, items: (group.items || []).filter(item => String(values[item.key] || "").trim()) }))
    .filter(group => group.items.length);
  return {
    ...settings,
    content: { ...settings.content, groups },
    blogPosts: (settings.blogPosts || []).map(({ body, sources, ...post }) => post),
    products: (settings.products || []).map(({ launchNotes, ...product }) => product)
  };
}

function frontLoad($, settings, assets, pathname) {
  const title = $("head > title").first();
  const jsonLd = $("script[type='application/ld+json']");
  if (title.length) title.after(jsonLd);
  const ssr = $("style[data-framer-css-ssr-minified]").first();
  if (assets && ssr.length && ssr.text().length > 20000) {
    const css = ssr.text();
    const file = `/assets/css/framer-${crypto.createHash("sha256").update(css).digest("hex").slice(0, 16)}.css`;
    assets.set(file, css);
    ssr.before(`<link rel="stylesheet" href="${file}">`);
    // Framer's runtime only reads data-framer-components from this tag, to skip CSS that is already present.
    ssr.text("");
  }
  // Native lazy loading must be in the HTML sent to the browser (not added after JavaScript runs),
  // otherwise responsive Framer variants below the fold all begin downloading during first paint.
  // Framer renders desktop, phone and carousel copies of the same homepage hero. On the mobile
  // route we keep exactly the visible phone hero eager/high; the responsive preload and this img
  // select the same rendition. Every hidden/animated copy stays lazy so it cannot steal bandwidth.
  $("img").each((_, element) => {
    const image = $(element);
    const src = image.attr("src") || "";
    const isHomeHero = pathname === "/" && src.includes("g813yVl0fq2gEobS7kOZx537SY");
    const isPhoneHero = isHomeHero
      && image.parents(".ssr-variant.hidden-a8katl.hidden-72rtr7").length > 0
      && image.parents("[data-framer-name='Hero Carousel']").length === 0;
    image.attr("decoding", "async");
    if (isPhoneHero) {
      image.attr("fetchpriority", "high").attr("loading", "eager");
    } else if (isHomeHero) {
      image.removeAttr("fetchpriority").attr("loading", "lazy");
    } else if (image.attr("fetchpriority") !== "high") {
      image.attr("loading", "lazy");
    }
  });
  const answers = $("body > .lc-answers").first();
  if (answers.length && $("body > #main").length) {
    $("body").prepend(answers);
    $("head").append('<style data-lc-order>body{display:flex;flex-direction:column}body>.lc-answers{order:1}body>#lc-business-contact{order:2}</style>');
  }
  const overrideScript = $("script[src*='store-override.js']").first();
  if (!overrideScript.length) return;
  const settingsScript = `<script id="lc-build-settings" type="application/json">${JSON.stringify(pageSettingsSnapshot(settings, pathname)).replace(/</g, "\\u003c")}</script>`;
  const firstScript = $("body script[src*='site-config.js']").first();
  (firstScript.length ? firstScript : overrideScript).before(settingsScript);
}

async function buildStorefront(settings, posts, site) {
  settings = normalizeStoreCategories(structuredClone(settings));
  // The page text groups are defined in server.js: use the version being deployed, not whichever version
  // the backend happens to run while this build fetches its data.
  const serverSource = await fs.readFile(path.join(root, "server.js"), "utf8");
  settings.content.groups = JSON.parse(serverSource.match(/const contentGroups = (\[[\s\S]*?\n\]);/)[1]);
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
  const imageAlts = JSON.parse(source.match(/const imageAlts = (\{[\s\S]*?\n  \});/)[1].replace(/,\s*}/g, "}"));
  // The motion homepage is a static Next export. Its CSS and client runtime live in /_next,
  // so Vercel must receive that directory alongside the existing public storefront routes.
  const publicDirectories = ["_next", "assets", "about", "account", "admin", "blog", "cart", "checkout", "contact", "order", "review", "shop"];
  for (const name of publicDirectories) await fs.cp(path.join(root, name), path.join(output, name), { recursive: true });
  // The source tree contains retired Framer product templates. Do not copy them
  // into a deployment after they have been removed from the live catalogue.
  const activeSlugs = new Set((settings.products || []).filter(p => p.enabled !== false).map(p => p.slug));
  const shopOutput = path.join(output, "shop");
  for (const entry of await fs.readdir(shopOutput, { withFileTypes: true })) {
    if (!entry.isDirectory() || activeSlugs.has(entry.name)) continue;
    const retiredTemplate = path.resolve(shopOutput, entry.name);
    if (path.dirname(retiredTemplate) !== shopOutput) throw new Error("Invalid product template path");
    await fs.rm(retiredTemplate, { recursive: true, force: true });
  }
  // New products without a restored template use the backend's product renderer.
  for (const product of (settings.products || []).filter(p => p.enabled !== false)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) throw new Error(`Invalid product slug: ${product.slug}`);
    const folder = path.join(output, "shop", product.slug);
    try { await fs.access(path.join(folder, "index.html")); }
    catch {
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(path.join(folder, "index.html"), renderProductPage(product, settings));
    }
  }
  // Product-led collection pages use clean, stable URLs. Empty future categories are rendered so
  // customers can see the roadmap, but are deliberately noindex and kept out of the sitemap.
  const collectionsOutput = path.join(output, "collections");
  await fs.mkdir(collectionsOutput, { recursive: true });
  for (const category of (settings.categories || []).filter(category => category.enabled !== false)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug)) throw new Error(`Invalid category slug: ${category.slug}`);
    const folder = path.join(collectionsOutput, category.slug);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, "index.html"), renderCategoryPage(category, settings));
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
        const rendered = materialize(html, settings, pathname, bindings, site, imageAlts, assets)
          .replace(/\/store-override\.js(?:\?[^"']*)?/g, `/store-override.js?v=${crypto.createHash("sha256").update(source).digest("hex").slice(0, 12)}`);
        await fs.writeFile(file, rendered);
      }
    }
  }
  const assets = new Map();
  const brandCss = await fs.readFile(path.join(root, "brand-override.css"), "utf8");
  assets.set(`/assets/css/brand-${crypto.createHash("sha256").update(brandCss).digest("hex").slice(0, 16)}.css`, brandCss);
  await transform(output);
  // Blog snapshots are generated just before this build and intentionally skip the Framer page
  // materializer. They still receive the same retired-product link protection.
  for (const post of posts) {
    const file = path.join(output, "blog", post.slug, "index.html");
    const blog = cheerio.load(await fs.readFile(file, "utf8"));
    repairRetiredProductLinks(blog, settings);
    await fs.writeFile(file, blog.html());
  }
  for (const [file, css] of assets) {
    await fs.mkdir(path.join(output, path.dirname(file)), { recursive: true });
    await fs.writeFile(path.join(output, file), css);
  }
  for (const [kind, pathname] of Object.entries(policyPaths)) {
    await fs.mkdir(path.join(output, pathname.slice(1)), { recursive: true });
    await fs.writeFile(path.join(output, pathname.slice(1), "index.html"), renderPolicyPage(kind, settings));
  }
  const products = (settings.products || []).filter(p => p.enabled !== false);
  const pages = ["/", "/about", "/shop", "/blog", "/contact"];
  // lastmod only where the date is known: journal posts and the policies.
  const indexableCategories = (settings.categories || []).filter(category => categoryIsIndexable(settings, category));
  const entries = [...pages.map(p => [p]), ...indexableCategories.map(category => [`/collections/${category.slug}`]), ...products.map(p => [`/shop/${p.slug}`]), ...posts.map(p => [`/blog/${p.slug}`, p.dateModified || p.date]), ...Object.values(policyPaths).map(p => [p, POLICY_UPDATED])];
  const seen = new Set();
  const uniqueEntries = entries.filter(([pathname]) => !seen.has(pathname) && seen.add(pathname));
  // A sitemap URL must always resolve to a generated HTML page. Fail the deployment rather than
  // publishing a dead URL if a future product, article or page build changes unexpectedly.
  for (const [pathname] of uniqueEntries) {
    if (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/i.test(pathname)) throw new Error(`Invalid sitemap path: ${pathname}`);
    const pageFile = pathname === "/"
      ? path.resolve(output, "index.html")
      : path.resolve(output, pathname.slice(1), "index.html");
    if (path.relative(output, pageFile).startsWith("..") || !await fs.stat(pageFile).then(stat => stat.isFile()).catch(() => false)) {
      throw new Error(`Sitemap path does not have a generated page: ${pathname}`);
    }
  }
  const entriesForSitemap = uniqueEntries;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entriesForSitemap.map(([p, date]) => `  <url><loc>${escape(new URL(p, site).href)}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(date || "") ? `<lastmod>${date}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`;
  await fs.writeFile(path.join(output, "sitemap.xml"), xml);
  const brief = llmsText(settings, products, posts, site);
  await fs.writeFile(path.join(output, "llms.txt"), brief);
  await fs.writeFile(path.join(output, "llms-small.txt"), llmsSmall(settings, site));
  const home = cheerio.load(await fs.readFile(path.join(output, "index.html"), "utf8"));
  await fs.writeFile(path.join(output, "llms-full.txt"), llmsFull(brief, settings, products, posts, site, home));
  await fs.mkdir(path.join(output, ".well-known"), { recursive: true });
  await fs.writeFile(path.join(output, ".well-known", "ai.txt"), aiText(site));
  console.log("Generated storefront HTML, policies, sitemap and AI guidance files in dist/");
}

// The short version of llms.txt: who the store is and where to look.
function llmsSmall(settings, site) {
  const url = pathname => new URL(pathname, site).href;
  const checkout = settings.checkout || {};
  return [
    `# ${settings.brand?.name || "LeatherCulture"}`,
    "",
    `> ${settings.footer?.description || settings.brand?.description || ""} Payment is cash on delivery.`,
    "",
    `- Shop: ${url("/shop")}`,
    `- Delivery and payment: ${checkout.codNote || "Cash on delivery across Pakistan."}`,
    `- Contact: ${url("/contact")} or ${settings.footer?.email || "contact@leatherculture.shop"}`,
    `- Full reference: ${url("/llms-full.txt")}`,
    ""
  ].join("\n");
}

// Everything an assistant needs to answer questions about the store, as plain text.
function llmsFull(brief, settings, products, posts, site, home) {
  const url = pathname => new URL(pathname, site).href;
  const categoryName = id => (settings.categories || []).find(item => item.id === id || item.slug === id)?.name || "";
  const text = html => {
    const $ = cheerio.load(`<div id="lc-root">${html}</div>`);
    return $("#lc-root").find("h2,h3,h4,p,li").toArray().map(element => {
      const value = normalize($(element).text());
      if (!value || (element.tagName === "p" && $(element).parent().is("li"))) return "";
      return element.tagName === "li" ? `- ${value}` : /^h/.test(element.tagName) ? `\n#### ${value}` : value;
    }).filter(Boolean).join("\n");
  };
  const faq = home(".lc-answers details").toArray().map(element => {
    const node = home(element);
    const steps = node.find("ol > li").toArray().map(item => `- ${normalize(home(item).text())}`);
    return [`### ${normalize(node.find("summary").text())}`, normalize(node.children("p").first().text()), ...steps].join("\n");
  });
  const policies = Object.entries(policyPaths).map(([kind, pathname]) => {
    const page = cheerio.load(renderPolicyPage(kind, settings));
    page("main .crumbs").remove();
    return `### ${normalize(page("h1").text())} (${url(pathname)})\n${text(page("main").html())}`;
  });
  return [
    brief.replace(/^# (.*)$/m, "# $1: full reference"),
    "## Frequently asked questions",
    ...faq.map(entry => `${entry}\n`),
    "## Product details",
    ...products.map(p => [
      `### ${p.name}`,
      `- Price: ${p.price}`,
      categoryName(p.category) && `- Category: ${categoryName(p.category)}`,
      (p.variants || []).length && `- Options: ${(p.variants || []).filter(v => v.enabled !== false).map(v => `${v.name}${Number(v.stock) > 0 ? "" : " (sold out)"}`).join(", ")}`,
      p.material && `- Material: ${p.material}`,
      p.care && `- Care: ${p.care}`,
      `- Link: ${url(`/shop/${p.slug}`)}`,
      normalize(p.description),
      ""
    ].filter(Boolean).join("\n")),
    "## Policies",
    ...policies.map(entry => `${entry}\n`),
    "## Journal articles",
    ...posts.map(post => [
      `### ${post.title}`,
      `${url(`/blog/${post.slug}`)}${post.date ? ` (published ${post.date})` : ""}`,
      post.excerpt || "",
      text(post.body),
      ...sourcesFor(post).map(source => `- Source: ${source.title}${source.publisher ? `, ${source.publisher}` : ""} (${source.url})`),
      ""
    ].filter(Boolean).join("\n"))
  ].join("\n");
}

// Matches robots.txt: AI assistants may read and cite the public pages.
function aiText(site) {
  const url = pathname => new URL(pathname, site).href;
  return [
    `# ai.txt for ${url("/")}`,
    "# LeatherCulture allows AI assistants and search engines to read, summarise and cite its public pages.",
    "# Please link to the page you quote. Private customer pages are excluded.",
    `# Summary for AI systems: ${url("/llms.txt")} (full version: ${url("/llms-full.txt")})`,
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /account",
    "Allow: /account/nav.css",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /order",
    "Disallow: /review",
    ""
  ].join("\n");
}

// A plain-text brief for AI assistants, built from the same live data as the pages.
function llmsText(settings, products, posts, site) {
  const url = pathname => new URL(pathname, site).href;
  const checkout = settings.checkout || {};
  const currency = checkout.currency || "Rs";
  const money = value => `${currency} ${Number(value || 0).toLocaleString("en-US")}`;
  const firstSentence = text => (String(text || "").replace(/\s+/g, " ").trim().match(/^.*?[.!?](?=\s|$)/) || [String(text || "").trim()])[0];
  const prices = products.map(p => priceValue(p.price)).filter(Boolean);
  const pageInfo = Object.fromEntries((settings.pages || []).map(page => [page.path, page.metaDescription || page.excerpt || ""]));
  const categories = (settings.categories || []).filter(category => category.enabled !== false);
  const fee = Number(checkout.shippingFee) || 0, free = Number(checkout.freeShippingFrom) || 0;
  return [
    `# ${settings.brand?.name || "LeatherCulture"}`,
    "",
    `> ${firstSentence(settings.footer?.description || settings.brand?.description)} Orders are placed online and paid cash on delivery.`,
    "",
    "## Key facts",
    "- Country: Pakistan. Delivers nationwide.",
    "- Payment: cash on delivery only.",
    `- Delivery: ${fee ? `${money(fee)}, free on orders of ${money(free)} or more` : "free"}. ${checkout.codNote || ""}`.trim(),
    `- Returns and exchanges: ${checkout.returnsPolicy || fallbackPolicy}`,
    ...(prices.length ? [`- Price range: ${money(Math.min(...prices))} to ${money(Math.max(...prices))}.`] : []),
    "- Currency: PKR.",
    `- Contact: ${settings.footer?.email || "contact@leatherculture.shop"}`,
    "",
    "## Collections",
    ...categories.map(category => {
      const count = products.filter(product => product.category === category.id).length;
      return `- [${category.name}](${url(`/collections/${category.slug}`)}): ${count ? `${count} product${count === 1 ? "" : "s"} available.` : "Coming soon."}`;
    }),
    "",
    "## Pages",
    ...[["/", "Home"], ["/shop", "Shop"], ["/about", "About"], ["/blog", "Journal"], ["/contact", "Contact"]].map(([pathname, label]) => `- [${label}](${url(pathname)})${pageInfo[pathname] ? `: ${firstSentence(pageInfo[pathname])}` : ""}`),
    ...legalLinks.map(link => `- [${link.label}](${url(link.href)})`),
    `- [Full reference for AI assistants](${url("/llms-full.txt")}): every product, policy and journal article in plain text`,
    "",
    "## Products",
    ...products.map(p => `- [${p.name}](${url(`/shop/${p.slug}`)}): ${p.price}. ${firstSentence(p.description || p.metaDescription)}`),
    "",
    "## Journal",
    ...posts.map(p => `- [${p.title}](${url(`/blog/${p.slug}`)}): ${p.excerpt || ""}`.trim()),
    "",
    `Last updated: ${new Date().toISOString().slice(0, 10)}`,
    ""
  ].join("\n");
}

module.exports = { buildStorefront, materialize, publicPhone, fallbackPolicy };
