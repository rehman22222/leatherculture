"use strict";
const { socialIcons } = require("./social-links");

// One footer for every public page, replacing the separate homepage, Framer and article footers and the strips under them.
// It sits outside the React root, so the homepage still hydrates. The old React and Framer footers are hidden with CSS.
const GUIDES = [
  ["where-to-buy-original-leather-pakistan", "Where to buy original leather"],
  ["pure-leather-types-pakistan", "Pure leather types"],
  ["original-leather-vs-faux-leather-pakistan", "Original vs faux leather"],
  ["leather-jacket-price-pakistan", "Leather jacket prices"],
  ["how-to-choose-leather-jacket-pakistan", "How to choose a jacket"]
];

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const realPhone = value => (/234\s*567|123456789|3XX|XXXXX/i.test(value || "") ? "" : String(value || "").trim());
const links = items => items.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("");

const STYLES = `<style data-lc-footer>
.foot,.legal,.framer-j7hgkz-container{display:none!important}
.fab{box-shadow:0 0 0 1px rgba(255,255,255,.3),0 10px 30px rgba(0,0,0,.25)}
#lc-footer{order:9;background:#000;color:#fff;font:15px/1.6 Inter,Arial,sans-serif;width:100%;box-sizing:border-box}
#lc-footer *{box-sizing:border-box}
#lc-footer a{color:inherit;text-decoration:none}
.lc-foot-inner{max-width:1240px;margin:0 auto;padding:72px 40px 0}
.lc-foot-main{display:grid;grid-template-columns:minmax(260px,1.5fr) repeat(3,minmax(150px,1fr));gap:48px}
.lc-foot-logo{display:block;width:170px;height:auto;margin-bottom:18px}
.lc-foot-desc{margin:0 0 18px;max-width:300px;color:#b4b4b4}
.lc-foot-contact{margin:0;color:#b4b4b4}
.lc-foot-contact a{color:#fff;border-bottom:1px solid rgba(255,255,255,.28)}
.lc-foot-contact a:hover{border-color:#fff}
.lc-foot-follow{margin-top:22px}
.lc-foot-label{display:block;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8d8d8d}
#lc-footer .lc-social-icons{margin:10px 0 0}
#lc-footer .lc-social-icons a{opacity:.72;color:#fff;border-color:rgba(255,255,255,.34)}
#lc-footer .lc-social-icons a:hover,#lc-footer .lc-social-icons a:focus-visible{opacity:1;border-color:#fff}
.lc-foot-col h2{margin:0 0 14px;font-size:15px;line-height:1.3;font-weight:700;letter-spacing:0;color:#fff}
.lc-foot-col ul{list-style:none;margin:0;padding:0}
.lc-foot-col li{margin:0 0 9px}
.lc-foot-col li a{color:#b4b4b4;transition:color .15s}
.lc-foot-col li a:hover,.lc-foot-col li a:focus-visible{color:#fff}
.lc-foot-note{margin:14px 0 0;font-size:13px;color:#8d8d8d}
.lc-foot-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;margin-top:56px;padding:22px 0 26px;border-top:1px solid rgba(255,255,255,.14);font-size:13px;color:#8d8d8d}
.lc-foot-bottom p{margin:0}
.lc-foot-legal{display:flex;flex-wrap:wrap;gap:6px 20px}
.lc-foot-legal a:hover{color:#fff}
.lc-to-top{position:fixed;right:20px;bottom:var(--lc-top-gap,20px);z-index:69;display:flex;align-items:center;justify-content:center;width:46px;height:46px;padding:0;border:1px solid rgba(0,0,0,.12);border-radius:50%;background:#fff;color:#000;box-shadow:0 8px 22px rgba(0,0,0,.28);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .25s,transform .25s,visibility .25s;-webkit-tap-highlight-color:transparent}
.lc-to-top[data-show="true"]{opacity:1;visibility:visible;transform:none}
.lc-to-top:hover{transform:translateY(-2px)}
.lc-to-top svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@media (max-width:900px){.lc-foot-main{grid-template-columns:1fr 1fr 1fr;gap:40px 28px}.lc-foot-brand{grid-column:1/-1}}
@media (max-width:640px){
.lc-foot-inner{padding:48px 24px 0}
.lc-foot-main{grid-template-columns:1fr 1fr;gap:30px 18px}
.lc-foot-brand{text-align:center}
.lc-foot-logo{margin:0 auto 14px;width:150px}
.lc-foot-desc{margin:0 auto 12px}
.lc-foot-follow{margin-top:20px}
#lc-footer .lc-social-icons{justify-content:center}
.lc-foot-guides{grid-column:1/-1;grid-row:3}
.lc-foot-guides ul{columns:2;column-gap:18px}
.lc-foot-guides li{break-inside:avoid}
.lc-foot-bottom{flex-direction:column;align-items:center;text-align:center;margin-top:34px;padding-bottom:84px}
.lc-foot-legal{justify-content:center}
}
@media (prefers-reduced-motion:reduce){.lc-to-top,.lc-foot-col li a{transition:none}}
</style>`;

// Shown after some scrolling. If something fixed already sits in that corner, such as the cart button, it moves above it.
const SCRIPT = `<script data-lc-footer-script>(function(){var b=document.querySelector(".lc-to-top");if(!b)return;var placed=false;function place(){if(placed)return;placed=true;var x=innerWidth-43,y=innerHeight-43,taken=document.elementsFromPoint(x,y).some(function(e){if(e===b||b.contains(e))return false;for(var n=e;n&&n!==document.body;n=n.parentElement){if(getComputedStyle(n).position==="fixed")return true}return false});if(taken)b.style.setProperty("--lc-top-gap","90px")}function update(){var show=scrollY>600;if(show)place();b.dataset.show=String(show)}addEventListener("scroll",update,{passive:true});update();b.addEventListener("click",function(){var calm=matchMedia("(prefers-reduced-motion:reduce)").matches;scrollTo({top:0,behavior:calm?"auto":"smooth"})})})();</script>`;

function siteFooterParts(settings) {
  const brand = settings?.brand?.name || "LeatherCulture";
  const email = settings?.footer?.email || "contact@leatherculture.shop";
  const phone = realPhone(settings?.footer?.phone);
  const jackets = (settings?.products || []).filter(item => item.enabled !== false && item.slug).map(item => [`/shop/${item.slug}`, item.name]);
  const published = new Set((settings?.blogPosts || []).filter(post => post.status === "published").map(post => post.slug));
  const guides = GUIDES.filter(([slug]) => published.has(slug)).map(([slug, label]) => [`/blog/${slug}`, label]);
  const help = [["/about", "About us"], ["/contact", "Contact us"], ["/blog/leather-jacket-size-guide", "Size guide"], ["/blog/leather-jacket-care-pakistan", "Care guide"], ["/terms#returns", "Delivery & returns"]];
  const icons = socialIcons(settings, brand);
  const body = `<footer id="lc-footer"><div class="lc-foot-inner"><div class="lc-foot-main"><div class="lc-foot-brand"><a href="/" aria-label="${esc(brand)} home"><img class="lc-foot-logo" src="/assets/brand/leather-culture-logo-white-423.webp" alt="${esc(brand)}" width="170" height="60" loading="lazy" decoding="async"></a><p class="lc-foot-desc">Modern jackets, handcrafted in Pakistan and delivered nationwide.</p><p class="lc-foot-contact"><a href="mailto:${esc(email)}">${esc(email)}</a>${phone ? `<br><a href="tel:${esc(phone.replace(/\s+/g, ""))}">${esc(phone)}</a>` : ""}</p>${icons ? `<div class="lc-foot-follow"><span class="lc-foot-label">Follow us</span>${icons}</div>` : ""}</div><nav class="lc-foot-col" aria-label="Shop"><h2>Shop</h2><ul>${links([["/collections/leather-jackets", "All leather jackets"], ...jackets])}</ul><p class="lc-foot-note">Bags, shoes and accessories coming soon</p></nav><nav class="lc-foot-col lc-foot-guides" aria-label="Buying guides"><h2>Buying guides</h2><ul>${links([...guides, ["/blog", "All guides"]])}</ul></nav><nav class="lc-foot-col" aria-label="Help"><h2>Help</h2><ul>${links(help)}</ul></nav></div><div class="lc-foot-bottom"><p>&copy; ${new Date().getFullYear()} ${esc(brand)} &middot; Pakistan &middot; Cash on delivery</p><div class="lc-foot-legal"><a href="/privacy-policy">Privacy Policy</a><a href="/terms">Terms &amp; Conditions</a></div></div></div></footer><button class="lc-to-top" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/></svg></button>${SCRIPT}`;
  return { head: STYLES, body };
}

module.exports = { siteFooterParts };
