"use strict";
// Shared SEO building blocks: the head tags, schema.org nodes and footer used by the pages rendered
// outside Framer (products, journal posts, policies), and by the build step that rewrites Framer pages.
const fs = require("fs");
const path = require("path");
const DEFAULT_SITE = "https://www.leatherculture.shop";
const publicRoot = path.join(__dirname, "..");
const LOGO = "/assets/brand/leather-culture-logo-black.png";
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const jsonLd = value => JSON.stringify(value).replace(/</g, "\\u003c");
// Canonical URLs always name the public storefront, whichever host rendered the page.
const siteUrl = () => String(process.env.SITE_URL || process.env.PUBLIC_SITE_URL || DEFAULT_SITE).trim().replace(/\/+$/, "");
const absolute = (pathname, site = siteUrl()) => new URL(pathname || "/", site).href;
const brandName = settings => settings?.brand?.name || "LeatherCulture";
const contactEmail = settings => settings?.footer?.email || "info@leatherculture.shop";
const legalLinks = [{ href: "/privacy-policy", label: "Privacy Policy" }, { href: "/terms", label: "Terms & Conditions" }];

// Product records point at the original photos (the jacket PNGs are 1-3 MB each). Lighter renditions sit
// beside them: name.webp at full size, name-card.webp for cards and name.jpg for link previews.
function sibling(url, suffix) {
  const match = /^(\/assets\/[\w/.-]+?)\.(png|jpe?g|webp)$/i.exec(String(url || ""));
  if (!match || url.includes("..")) return "";
  const candidate = `${match[1]}${suffix}`;
  return fs.existsSync(path.join(publicRoot, candidate)) ? candidate : "";
}
const displayImage = url => sibling(url, ".webp") || url;
const cardImage = url => sibling(url, "-card.webp") || displayImage(url);
const shareImage = url => sibling(url, ".jpg") || url;

// The template ships "https://instagram.com" style placeholders. Only a URL that names a specific
// page counts as one of the brand's profiles, for the footer links and for schema.org sameAs.
function profileUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return /^https?:$/.test(url.protocol) && url.pathname.replace(/\/+$/, "") ? url.href : "";
  } catch (_) {
    return "";
  }
}

function socialProfiles(settings) {
  const listed = [...Object.values(settings?.footer?.socials || {}), ...String(settings?.seo?.sameAs || "").split(/\s+/)];
  return [...new Set(listed.map(profileUrl).filter(Boolean))];
}

// Admins paste either the bare code or the whole <meta> tag that Google and Bing show.
function verificationCode(value, pattern) {
  const raw = String(value || "").trim();
  const code = (raw.match(/content=["']?([^"'\s>]+)/i) || [null, raw])[1];
  return pattern.test(code) ? code : "";
}

function analyticsId(settings) {
  const id = String(settings?.seo?.googleAnalyticsId || "").trim().toUpperCase();
  return /^G-[A-Z0-9]{4,20}$/.test(id) ? id : "";
}

function verificationTags(settings) {
  const google = verificationCode(settings?.seo?.googleSiteVerification, /^[\w-]{20,120}$/);
  const bing = verificationCode(settings?.seo?.bingSiteVerification, /^[A-Fa-f0-9]{32}$/);
  return (google ? `<meta name="google-site-verification" content="${google}">` : "") + (bing ? `<meta name="msvalidate.01" content="${bing}">` : "");
}

function analyticsTags(settings) {
  const id = analyticsId(settings);
  if (!id) return "";
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${id}");</script>`;
}

function organization(settings, site = siteUrl()) {
  const sameAs = socialProfiles(settings);
  return {
    "@type": ["Organization", "OnlineStore"],
    "@id": `${site}/#organization`,
    name: brandName(settings),
    url: `${site}/`,
    logo: { "@type": "ImageObject", url: `${site}${LOGO}`, width: 962, height: 342 },
    email: contactEmail(settings),
    areaServed: { "@type": "Country", name: "Pakistan" },
    ...(sameAs.length ? { sameAs } : {})
  };
}

function breadcrumbs(items, site = siteUrl()) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, pathname], index) => ({ "@type": "ListItem", position: index + 1, name, item: absolute(pathname, site) }))
  };
}

function headTags({ settings, title, description, path, image, imageAlt, type = "website", keywords, robots = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1", analytics = true }) {
  const site = siteUrl();
  const canonical = absolute(path, site);
  const picture = absolute(image || LOGO, site);
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}">` : "",
    `<meta name="robots" content="${esc(robots)}">`,
    `<meta name="author" content="${esc(brandName(settings))}">`,
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<link rel="icon" href="/assets/brand/leather-culture-mark.png" type="image/png">`,
    `<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png" sizes="180x180">`,
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:site_name" content="${esc(brandName(settings))}">`,
    `<meta property="og:locale" content="en_PK">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${esc(picture)}">`,
    `<meta property="og:image:alt" content="${esc(imageAlt || title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(picture)}">`,
    verificationTags(settings),
    analytics ? analyticsTags(settings) : ""
  ].filter(Boolean).join("");
}

function siteHeader(settings) {
  const nav = (settings?.header?.nav || []).filter(item => item && item.href && item.label);
  const links = nav.length ? nav : [{ href: "/", label: "Home" }, { href: "/about", label: "About" }, { href: "/shop", label: "Shop" }, { href: "/blog", label: "Blog" }, { href: "/contact", label: "Contact" }];
  const account = '<a class="lc-account-nav" href="/account"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg><span>My account</span></a>';
  return `<header class="site-header"><a href="/" aria-label="${esc(brandName(settings))}"><img src="/assets/brand/leather-culture-logo-white.webp" alt="${esc(brandName(settings))}" width="124" height="44"></a><nav aria-label="Main">${links.map(item => `<a href="${esc(item.href)}">${esc(item.label)}</a>`).join("")}${account}</nav></header>`;
}

function siteFooter(settings) {
  const links = [["/shop", "Shop"], ["/about", "About"], ["/blog", "Journal"], ["/contact", "Contact"], ...legalLinks.map(link => [link.href, link.label])];
  const email = contactEmail(settings);
  return `<footer class="site-footer lc-site-footer"><nav aria-label="Footer">${links.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("")}</nav><p>&copy; ${new Date().getFullYear()} ${esc(brandName(settings))} &middot; Pakistan &middot; <a href="mailto:${esc(email)}">${esc(email)}</a></p></footer>`;
}

module.exports = { esc, jsonLd, siteUrl, absolute, brandName, contactEmail, legalLinks, displayImage, cardImage, shareImage, profileUrl, socialProfiles, analyticsId, verificationTags, analyticsTags, organization, breadcrumbs, headTags, siteHeader, siteFooter };
