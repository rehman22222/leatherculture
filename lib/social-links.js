"use strict";
const { profileUrl } = require("./seo");

// Saved in Admin under footer.socials. Placeholders such as https://instagram.com fail profileUrl and show nothing.
const NETWORKS = [
  { key: "instagram", label: "Instagram", icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>' },
  { key: "facebook", label: "Facebook", icon: '<path d="M14.2 21v-7.6h2.6l.5-3.1h-3.1V8.4c0-.9.4-1.6 1.7-1.6h1.5V4.1c-.7-.1-1.5-.2-2.3-.2-2.5 0-4.1 1.5-4.1 4.2v2.2H8.2v3.1H11V21" fill="currentColor" stroke="none"/>' }
];

function socialLinks(settings) {
  return NETWORKS.map(network => ({ ...network, url: profileUrl(settings?.footer?.socials?.[network.key]) })).filter(network => network.url);
}

const escapeAttr = value => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const anchors = (links, brand) => links.map(link => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener me" aria-label="${brand} on ${link.label}"><svg viewBox="0 0 24 24" aria-hidden="true">${link.icon}</svg></a>`).join("");

// Round outline icons, a little dull until touched, in whatever colour the footer around them uses.
function socialIcons(settings, brand = "LeatherCulture") {
  const links = socialLinks(settings);
  return links.length ? `<div class="lc-social-icons">${anchors(links, brand)}</div>` : "";
}

const STYLES = `<style data-lc-social>
.lc-social-icons{display:flex;justify-content:inherit;gap:10px;margin:12px 0}
.lc-site-footer .lc-social-icons{justify-content:center}
.lc-social-icons a{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid currentColor;border-radius:50%;color:inherit;opacity:.6;transition:opacity .2s,transform .2s}
.lc-social-icons a:hover,.lc-social-icons a:focus-visible{opacity:1;transform:translateY(-2px)}
.lc-social-icons svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.6}
.lc-social-rail{display:none}
@media (max-width:900px){
.lc-social-rail{display:flex;align-items:center;position:fixed;right:0;top:50%;z-index:70;transform:translate(var(--lc-rail-shift,0),-50%);transition:transform .32s cubic-bezier(.2,.8,.2,1);font-family:Inter,Arial,sans-serif}
.lc-social-tab{display:flex;align-items:center;justify-content:center;width:26px;height:58px;padding:0;border:1px solid rgba(255,255,255,.45);border-right:0;border-radius:12px 0 0 12px;background:rgba(0,0,0,.62);color:#fff;opacity:.72;cursor:pointer;transition:opacity .2s;-webkit-tap-highlight-color:transparent}
.lc-social-tab svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .32s}
.lc-social-panel{display:flex;flex-direction:column;gap:8px;padding:10px 8px;background:#000;border-radius:0 0 0 14px;visibility:hidden}
.lc-social-panel a{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid rgba(255,255,255,.34);border-radius:50%;color:#fff}
.lc-social-panel svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6}
.lc-social-rail{--lc-rail-shift:60px}
.lc-social-rail[data-open="true"]{--lc-rail-shift:0px}
.lc-social-rail[data-open="true"] .lc-social-tab{opacity:1;background:#000}
.lc-social-rail[data-open="true"] .lc-social-tab svg{transform:rotate(180deg)}
.lc-social-rail[data-open="true"] .lc-social-panel{visibility:visible}
}
@media (prefers-reduced-motion:reduce){.lc-social-rail,.lc-social-tab svg,.lc-social-icons a{transition:none}}
</style>`;

// The homepage footer belongs to React, so its icons are added only once React has finished with that element.
const SCRIPT = `<script data-lc-social-script>(function(){var rail=document.querySelector(".lc-social-rail");if(rail){var tab=rail.querySelector(".lc-social-tab");function set(open){rail.dataset.open=String(open);tab.setAttribute("aria-expanded",String(open));tab.setAttribute("aria-label",open?"Hide social links":"Show social links")}tab.addEventListener("click",function(e){e.stopPropagation();set(rail.dataset.open!=="true")});document.addEventListener("click",function(e){if(rail.dataset.open==="true"&&!rail.contains(e.target))set(false)});document.addEventListener("keydown",function(e){if(e.key==="Escape")set(false)})}var slot=document.querySelector(".foot-touch"),tpl=document.getElementById("lc-social-footer");if(!slot||!tpl)return;var tries=0;(function wait(){var ready=Object.keys(slot).some(function(k){return k.indexOf("__reactFiber")===0});if(ready)slot.appendChild(tpl.content.cloneNode(true));else if(++tries<60)setTimeout(wait,250)})()})();</script>`;

// Added to every public page at the end of the build. The side tab shows on phones and tablets only.
function socialWidget(settings, brand = "LeatherCulture") {
  const links = socialLinks(settings);
  if (!links.length) return "";
  const rail = `<aside class="lc-social-rail" data-open="false" aria-label="Follow ${brand}"><button class="lc-social-tab" type="button" aria-expanded="false" aria-label="Show social links"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div class="lc-social-panel">${anchors(links, brand)}</div></aside>`;
  return `${STYLES}${rail}<template id="lc-social-footer">${socialIcons(settings, brand)}</template>${SCRIPT}`;
}

module.exports = { socialLinks, socialIcons, socialWidget };
