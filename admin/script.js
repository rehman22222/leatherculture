/* LeatherCulture admin — a small WordPress-style dashboard over the storefront settings API. */

const view = document.getElementById("view");
const pageTitle = document.getElementById("page-title");
const crumbs = document.getElementById("crumbs");
const saveButton = document.getElementById("save");
const dirtyBadge = document.getElementById("dirty");
const toast = document.getElementById("toast");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const passwordInput = document.getElementById("password");

let settings = null;
let dirty = false;
const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");

/* ---------- helpers ---------- */

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function mediaUrl(value) {
  if (!value) return value;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (apiBase && value.startsWith("/assets/uploads/")) return `${apiBase}${value}`;
  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function get(path) {
  return path.split(".").reduce((current, key) => current?.[key], settings) ?? "";
}

function set(path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((current, key) => {
    current[key] ||= {};
    return current[key];
  }, settings);
  target[last] = value;
  markDirty();
}

function markDirty() {
  dirty = true;
  saveButton.disabled = false;
  dirtyBadge.hidden = false;
}

function markClean() {
  dirty = false;
  saveButton.disabled = true;
  dirtyBadge.hidden = true;
}

let toastTimer = 0;
function showToast(message, kind = "ok") {
  toast.textContent = message;
  toast.className = `toast ${kind}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 3200);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------- form field builders ---------- */

function field(path, label, type = "input", options = [], extra = {}) {
  return itemField(path, label, get(path), type, options, extra);
}

function itemField(path, label, value, type = "input", options = [], extra = {}) {
  const help = extra.help ? `<small>${escapeHtml(extra.help)}</small>` : "";
  const placeholder = extra.placeholder ? ` placeholder="${escapeHtml(extra.placeholder)}"` : "";
  if (type === "textarea") return `<label>${label}<textarea data-path="${path}"${placeholder}>${escapeHtml(value)}</textarea>${help}</label>`;
  if (type === "select") {
    return `<label>${label}<select data-path="${path}">${options
      .map((option) => `<option value="${escapeHtml(option.value)}" ${value === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("")}</select>${help}</label>`;
  }
  if (type === "checkbox") return `<label class="check"><input type="checkbox" data-path="${path}" ${value ? "checked" : ""}> ${label}</label>`;
  if (type === "toggle") {
    return `<label class="toggle"><span>${label}</span><input type="checkbox" data-path="${path}" ${value ? "checked" : ""}><i></i></label>`;
  }
  return `<label>${label}<input data-path="${path}" value="${escapeHtml(value)}"${placeholder}>${help}</label>`;
}

function imageField(path, altPath, image, alt, label = "Image") {
  return `
    <div class="image-field">
      <div class="image-preview">${image ? `<img src="${escapeHtml(mediaUrl(image))}" alt="">` : `<span>No image</span>`}</div>
      <div class="stack">
        <label class="upload-btn">Upload ${label.toLowerCase()}<input type="file" accept="image/*" data-upload="${path}"></label>
        ${itemField(path, "Image URL", image)}
        ${itemField(altPath, "Alt text", alt, "input", [], { help: "Describes the image for search engines and screen readers." })}
      </div>
    </div>
  `;
}

function seoPanel(basePath, item) {
  return `
    <section class="panel">
      <h3>Search engine listing</h3>
      <div class="serp">
        <div class="serp-title">${escapeHtml(item.metaTitle || item.name || item.title || "Page title")}</div>
        <div class="serp-url">leatherculture.shop${escapeHtml(item.canonicalPath || "")}</div>
        <div class="serp-desc">${escapeHtml(item.metaDescription || item.excerpt || item.description || "Meta description appears here.")}</div>
      </div>
      ${itemField(`${basePath}.metaTitle`, "Meta title", item.metaTitle, "input", [], { help: "Under 60 characters." })}
      ${itemField(`${basePath}.metaDescription`, "Meta description", item.metaDescription, "textarea", [], { help: "Around 150 characters." })}
      ${itemField(`${basePath}.keywords`, "Keywords", item.keywords)}
      ${itemField(`${basePath}.canonicalPath`, "Canonical URL path", item.canonicalPath)}
    </section>
  `;
}

function badge(enabled, on = "Live", off = "Hidden") {
  return `<span class="badge ${enabled ? "on" : "off"}">${enabled ? on : off}</span>`;
}

function thumb(src) {
  return src ? `<img class="thumb" src="${escapeHtml(mediaUrl(src))}" alt="">` : `<span class="thumb empty"></span>`;
}

/* ---------- list + editor scaffolding ---------- */

function listView({ title, addLabel, addType, items, columns, rowHref, emptyText, removeKey, searchKey }) {
  const query = (state.search || "").toLowerCase();
  const rows = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !query || String(item[searchKey] || "").toLowerCase().includes(query));
  return `
    <div class="list-head">
      <input type="search" id="search" placeholder="Search ${title.toLowerCase()}…" value="${escapeHtml(state.search || "")}">
      <button type="button" class="primary" data-add="${addType}">+ ${addLabel}</button>
    </div>
    <div class="card table-card">
      ${rows.length
        ? `<table>
            <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}<th></th></tr></thead>
            <tbody>${rows
              .map(
                ({ item, index }) => `
                <tr data-href="${rowHref(index)}">
                  ${columns.map((c) => `<td>${c.render(item, index)}</td>`).join("")}
                  <td class="row-actions">
                    <a href="${rowHref(index)}">Edit</a>
                    <button type="button" class="link danger" data-remove="${removeKey}.${index}">Delete</button>
                  </td>
                </tr>`
              )
              .join("")}</tbody>
          </table>`
        : `<div class="empty">${emptyText}</div>`}
    </div>
  `;
}

function editorLayout(main, side) {
  return `<div class="editor"><div class="editor-main">${main}</div><aside class="editor-side">${side}</aside></div>`;
}

function backLink(href, label) {
  return `<a class="back" href="${href}">← ${label}</a>`;
}

/* ---------- views ---------- */

const state = { route: "dashboard", params: [], search: "", tab: {} };

function renderDashboard() {
  const products = settings.products || [];
  const posts = settings.blogPosts || [];
  const edited = Object.values(settings.content?.values || {}).filter((v) => String(v).trim()).length;
  const live = products.filter((p) => p.enabled !== false).length;
  return `
    <div class="stats">
      <a class="stat" href="#/products"><b>${products.length}</b><span>Products <em>${live} live</em></span></a>
      <a class="stat" href="#/blog"><b>${posts.filter((p) => p.status === "published").length}</b><span>Published posts <em>${posts.length - posts.filter((p) => p.status === "published").length} drafts</em></span></a>
      <a class="stat" href="#/pages"><b>${(settings.pages || []).length}</b><span>Pages</span></a>
      <a class="stat" href="#/content"><b>${edited}</b><span>Custom texts</span></a>
    </div>
    <div class="two-col">
      <section class="card">
        <h3>Quick actions</h3>
        <div class="actions-grid">
          <a class="action" href="#/products/new">+ New product</a>
          <a class="action" href="#/blog/new">+ New blog post</a>
          <a class="action" href="#/appearance/hero">Edit hero</a>
          <a class="action" href="#/appearance/brand">Announcement bar</a>
          <a class="action" href="#/content">Edit page text</a>
          <a class="action" href="/" target="_blank" rel="noopener">View store ↗</a>
        </div>
      </section>
      <section class="card">
        <h3>Recent products</h3>
        <ul class="mini-list">
          ${products.slice(0, 6).map((p, i) => `<li><a href="#/products/edit/${i}">${thumb(p.image)}<span>${escapeHtml(p.name)}</span><small>${escapeHtml(p.price || "")}</small></a></li>`).join("") || "<li>No products yet.</li>"}
        </ul>
      </section>
    </div>
    <section class="card">
      <h3>Checklist</h3>
      <ul class="checks">
        ${checkItem(!/template/i.test(settings.footer?.description || ""), "Footer description is your own text", "#/appearance/footer")}
        ${checkItem(!/\+001/.test(settings.footer?.phone || ""), "Real phone number in footer", "#/appearance/footer")}
        ${checkItem(!/london/i.test(settings.footer?.address || ""), "Real address in footer", "#/appearance/footer")}
        ${checkItem(!products.some((p) => /^\$/.test(p.price || "")), "Prices entered in PKR (no $ prices)", "#/products")}
        ${checkItem(!/^https:\/\/(instagram|facebook|youtube)\.com\/?$|^https:\/\/x\.com\/?$/.test(settings.footer?.socials?.instagram || "") && settings.footer?.socials?.instagram, "Social links point to your profiles", "#/appearance/footer")}
        ${checkItem(posts.some((p) => p.status === "published"), "At least one published blog post", "#/blog")}
      </ul>
    </section>
  `;
}

function checkItem(ok, label, href) {
  return `<li class="${ok ? "ok" : "todo"}"><span>${ok ? "✓" : "○"}</span><a href="${href}">${label}</a></li>`;
}

function renderProductsList() {
  const cats = Object.fromEntries((settings.categories || []).map((c) => [c.id, c.name]));
  return listView({
    title: "Products",
    addLabel: "Add product",
    addType: "product",
    items: settings.products || [],
    searchKey: "name",
    removeKey: "products",
    rowHref: (i) => `#/products/edit/${i}`,
    emptyText: "No products yet. Add your first product.",
    columns: [
      { label: "Product", render: (p) => `<div class="cell-main">${thumb(p.image)}<div><b>${escapeHtml(p.name || "Untitled")}</b><small>/shop/${escapeHtml(p.slug || "")}</small></div></div>` },
      { label: "Category", render: (p) => escapeHtml(cats[p.category] || p.category || "—") },
      { label: "Price", render: (p) => `${escapeHtml(p.price || "—")}${p.compareAtPrice ? ` <s>${escapeHtml(p.compareAtPrice)}</s>` : ""}` },
      { label: "Variants", render: (p) => String((p.variants || []).length) },
      { label: "Status", render: (p) => badge(p.enabled !== false) },
    ],
  });
}

function renderProductEditor(index) {
  const product = settings.products[index];
  if (!product) return `<div class="empty">Product not found.</div>`;
  const base = `products.${index}`;
  const categoryOptions = (settings.categories || []).map((c) => ({ value: c.id, label: c.name }));
  const main = `
    ${backLink("#/products", "All products")}
    <section class="card">
      ${itemField(`${base}.name`, "Product name", product.name)}
      <div class="grid">
        ${itemField(`${base}.slug`, "Slug", product.slug, "input", [], { help: "URL: /shop/<slug>" })}
        ${itemField(`${base}.category`, "Category", product.category, "select", categoryOptions)}
        ${itemField(`${base}.price`, "Price", product.price, "input", [], { placeholder: "Rs 12,500" })}
        ${itemField(`${base}.compareAtPrice`, "Compare-at price", product.compareAtPrice, "input", [], { placeholder: "Rs 15,000", help: "Shown struck through. Leave empty to hide." })}
      </div>
      ${itemField(`${base}.description`, "Description", product.description, "textarea")}
      <div class="grid three">
        ${itemField(`${base}.material`, "Material", product.material)}
        ${itemField(`${base}.care`, "Care", product.care)}
        ${itemField(`${base}.warranty`, "Warranty", product.warranty)}
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h3>Variants / colours</h3><button type="button" class="secondary" data-add-variant="${index}">+ Add variant</button></div>
      ${(product.variants || [])
        .map(
          (variant, v) => `
          <div class="variant">
            <div class="variant-head">
              <span class="swatch" style="background:${escapeHtml(variant.color || "#111")}"></span>
              <b>${escapeHtml(variant.name || "Variant")}</b>
              <button type="button" class="link danger" data-remove-variant="${index}.${v}">Remove</button>
            </div>
            <div class="grid four">
              ${itemField(`${base}.variants.${v}.name`, "Name", variant.name)}
              <label>Colour<div class="color-row"><input type="color" data-path="${base}.variants.${v}.color" value="${escapeHtml(variant.color || "#111111")}"><input data-path="${base}.variants.${v}.color" value="${escapeHtml(variant.color || "")}"></div></label>
              ${itemField(`${base}.variants.${v}.sku`, "SKU", variant.sku)}
              ${itemField(`${base}.variants.${v}.stock`, "Stock", variant.stock)}
            </div>
            ${imageField(`${base}.variants.${v}.image`, `${base}.variants.${v}.alt`, variant.image, variant.alt, "variant image")}
            ${itemField(`${base}.variants.${v}.enabled`, "Variant enabled", variant.enabled, "toggle")}
          </div>`
        )
        .join("") || `<p class="muted">No variants. Add colours so customers can switch product images.</p>`}
    </section>
  `;
  const side = `
    <section class="panel">
      <h3>Publish</h3>
      ${itemField(`${base}.enabled`, "Visible in store", product.enabled !== false, "toggle")}
      ${itemField(`${base}.badge`, "Badge", product.badge, "input", [], { placeholder: "Best seller" })}
      <a class="secondary block" href="/shop/${escapeHtml(product.slug || "")}" target="_blank" rel="noopener">View product ↗</a>
      <button type="button" class="link danger block" data-remove="products.${index}" data-then="#/products">Delete product</button>
    </section>
    <section class="panel">
      <h3>Main image</h3>
      ${imageField(`${base}.image`, `${base}.alt`, product.image, product.alt, "image")}
    </section>
    ${seoPanel(base, product)}
  `;
  return editorLayout(main, side);
}

function renderCategoriesList() {
  return listView({
    title: "Categories",
    addLabel: "Add category",
    addType: "category",
    items: settings.categories || [],
    searchKey: "name",
    removeKey: "categories",
    rowHref: (i) => `#/categories/edit/${i}`,
    emptyText: "No categories yet.",
    columns: [
      { label: "Category", render: (c) => `<div class="cell-main">${thumb(c.image)}<div><b>${escapeHtml(c.name)}</b><small>${escapeHtml(c.slug || "")}</small></div></div>` },
      { label: "Products", render: (c) => String((settings.products || []).filter((p) => p.category === c.id).length) },
      { label: "Status", render: (c) => badge(c.enabled !== false) },
    ],
  });
}

function renderCategoryEditor(index) {
  const category = settings.categories[index];
  if (!category) return `<div class="empty">Category not found.</div>`;
  const base = `categories.${index}`;
  return editorLayout(
    `${backLink("#/categories", "All categories")}
     <section class="card">
       ${itemField(`${base}.name`, "Category name", category.name)}
       <div class="grid">${itemField(`${base}.slug`, "Slug", category.slug)}${itemField(`${base}.id`, "ID", category.id, "input", [], { help: "Used to link products to this category." })}</div>
       ${itemField(`${base}.description`, "Description", category.description, "textarea")}
     </section>`,
    `<section class="panel"><h3>Publish</h3>${itemField(`${base}.enabled`, "Visible in store", category.enabled !== false, "toggle")}<button type="button" class="link danger block" data-remove="categories.${index}" data-then="#/categories">Delete category</button></section>
     <section class="panel"><h3>Image</h3>${imageField(`${base}.image`, `${base}.alt`, category.image, category.alt)}</section>
     ${seoPanel(base, category)}`
  );
}

function renderBannersList() {
  return listView({
    title: "Banners",
    addLabel: "Add banner",
    addType: "banner",
    items: settings.banners || [],
    searchKey: "title",
    removeKey: "banners",
    rowHref: (i) => `#/banners/edit/${i}`,
    emptyText: "No banners yet.",
    columns: [
      { label: "Banner", render: (b) => `<div class="cell-main">${thumb(b.image)}<div><b>${escapeHtml(b.label || b.title || "Banner")}</b><small>${escapeHtml(b.title || "")}</small></div></div>` },
      { label: "Link", render: (b) => escapeHtml(b.href || "—") },
      { label: "Status", render: (b) => badge(b.enabled !== false) },
    ],
  });
}

function renderBannerEditor(index) {
  const banner = settings.banners[index];
  if (!banner) return `<div class="empty">Banner not found.</div>`;
  const base = `banners.${index}`;
  return editorLayout(
    `${backLink("#/banners", "All banners")}
     <section class="card">
       ${itemField(`${base}.label`, "Admin label", banner.label)}
       ${itemField(`${base}.title`, "Banner text", banner.title)}
       ${itemField(`${base}.href`, "Link", banner.href)}
     </section>`,
    `<section class="panel"><h3>Publish</h3>${itemField(`${base}.enabled`, "Enabled", banner.enabled !== false, "toggle")}<button type="button" class="link danger block" data-remove="banners.${index}" data-then="#/banners">Delete banner</button></section>
     <section class="panel"><h3>Image</h3>${imageField(`${base}.image`, `${base}.alt`, banner.image, banner.alt)}</section>`
  );
}

function renderBlogList() {
  return listView({
    title: "Blog posts",
    addLabel: "Add post",
    addType: "blog",
    items: settings.blogPosts || [],
    searchKey: "title",
    removeKey: "blogPosts",
    rowHref: (i) => `#/blog/edit/${i}`,
    emptyText: "No posts yet. Write your first article.",
    columns: [
      { label: "Post", render: (p) => `<div class="cell-main">${thumb(p.coverImage)}<div><b>${escapeHtml(p.title || "Untitled")}</b><small>/blog/${escapeHtml(p.slug || "")}</small></div></div>` },
      { label: "Author", render: (p) => escapeHtml(p.author || "—") },
      { label: "Date", render: (p) => escapeHtml(formatDate(p.date)) },
      { label: "Status", render: (p) => badge(p.status === "published", "Published", "Draft") },
    ],
  });
}

function renderBlogEditor(index) {
  const post = settings.blogPosts[index];
  if (!post) return `<div class="empty">Post not found.</div>`;
  const base = `blogPosts.${index}`;
  const main = `
    ${backLink("#/blog", "All posts")}
    <section class="card">
      ${itemField(`${base}.title`, "Title", post.title)}
      ${itemField(`${base}.excerpt`, "Excerpt", post.excerpt, "textarea", [], { help: "Shown on blog cards and in search results." })}
      <label>Body
        <div class="rich-toolbar">
          <button type="button" data-command="bold"><b>B</b></button>
          <button type="button" data-command="italic"><i>I</i></button>
          <button type="button" data-command="formatBlock" data-value="h2">H2</button>
          <button type="button" data-command="formatBlock" data-value="h3">H3</button>
          <button type="button" data-command="formatBlock" data-value="p">¶</button>
          <button type="button" data-command="insertUnorderedList">• List</button>
          <button type="button" data-command="createLink">Link</button>
        </div>
        <div class="rich-editor" contenteditable="true" data-rich="${base}.body">${post.body || ""}</div>
      </label>
    </section>
  `;
  const side = `
    <section class="panel">
      <h3>Publish</h3>
      ${itemField(`${base}.status`, "Status", post.status, "select", [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ])}
      ${itemField(`${base}.date`, "Date", post.date, "input", [], { placeholder: "YYYY-MM-DD" })}
      ${itemField(`${base}.author`, "Author", post.author)}
      ${itemField(`${base}.slug`, "Slug", post.slug)}
      <a class="secondary block" href="/blog/${escapeHtml(post.slug || "")}" target="_blank" rel="noopener">View post ↗</a>
      <button type="button" class="link danger block" data-remove="blogPosts.${index}" data-then="#/blog">Delete post</button>
    </section>
    <section class="panel"><h3>Cover image</h3>${imageField(`${base}.coverImage`, `${base}.coverAlt`, post.coverImage, post.coverAlt, "cover")}</section>
    ${seoPanel(base, post)}
  `;
  return editorLayout(main, side);
}

function renderPagesList() {
  return listView({
    title: "Pages",
    addLabel: "Add page",
    addType: "page",
    items: settings.pages || [],
    searchKey: "name",
    removeKey: "pages",
    rowHref: (i) => `#/pages/edit/${i}`,
    emptyText: "No pages.",
    columns: [
      { label: "Page", render: (p) => `<div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.path || "")}</small></div>` },
      { label: "Meta title", render: (p) => escapeHtml(p.metaTitle || "—") },
      { label: "Status", render: (p) => badge(p.enabled !== false) },
    ],
  });
}

function renderPageEditor(index) {
  const page = settings.pages[index];
  if (!page) return `<div class="empty">Page not found.</div>`;
  const base = `pages.${index}`;
  return editorLayout(
    `${backLink("#/pages", "All pages")}
     <section class="card">
       ${itemField(`${base}.name`, "Page name", page.name)}
       <div class="grid">${itemField(`${base}.path`, "URL path", page.path)}${itemField(`${base}.slug`, "Slug", page.slug)}</div>
       ${itemField(`${base}.heading`, "Heading", page.heading)}
       ${itemField(`${base}.excerpt`, "Excerpt", page.excerpt, "textarea")}
       <p class="muted">The visible text of each page is edited under <a href="#/content">Page Text</a>.</p>
     </section>`,
    `<section class="panel"><h3>Publish</h3>${itemField(`${base}.enabled`, "Enabled", page.enabled !== false, "toggle")}<a class="secondary block" href="${escapeHtml(page.path || "/")}" target="_blank" rel="noopener">View page ↗</a><button type="button" class="link danger block" data-remove="pages.${index}" data-then="#/pages">Delete page</button></section>
     ${seoPanel(base, page)}`
  );
}

function renderContent() {
  const groups = settings.content?.groups || [];
  const values = settings.content?.values || {};
  const current = state.params[0] || groups[0]?.id;
  const group = groups.find((g) => g.id === current) || groups[0];
  const edited = (g) => g.items.filter((i) => String(values[i.key] || "").trim()).length;
  const query = (state.search || "").toLowerCase();
  return `
    <div class="tabs">
      ${groups.map((g) => `<a class="tab ${g.id === group.id ? "active" : ""}" href="#/content/${g.id}">${escapeHtml(g.label)}${edited(g) ? `<span class="count">${edited(g)}</span>` : ""}</a>`).join("")}
    </div>
    <div class="list-head">
      <input type="search" id="search" placeholder="Find a text…" value="${escapeHtml(state.search || "")}">
      <span class="muted">Leave a field empty to keep the original wording.</span>
    </div>
    <section class="card">
      <div class="content-items">
        ${group.items
          .filter((item) => !query || item.original.toLowerCase().includes(query) || String(values[item.key] || "").toLowerCase().includes(query))
          .map((item) => {
            const value = values[item.key] || "";
            const long = item.original.length > 60;
            return `<label class="content-item ${value ? "is-edited" : ""}">
              <span class="original" title="${escapeHtml(item.original)}">${escapeHtml(item.original)}</span>
              ${long ? `<textarea data-path="content.values.${item.key}" placeholder="${escapeHtml(item.original)}">${escapeHtml(value)}</textarea>` : `<input data-path="content.values.${item.key}" placeholder="${escapeHtml(item.original)}" value="${escapeHtml(value)}">`}
            </label>`;
          })
          .join("") || `<div class="empty">Nothing matches.</div>`}
      </div>
    </section>
  `;
}

const appearanceTabs = [
  { id: "brand", label: "Brand & announcement", fields: [["brand.name", "Store name"], ["brand.title", "Browser title"], ["brand.description", "Default SEO description", "textarea"], ["announcement.text", "Announcement bar text"]] },
  { id: "header", label: "Header", fields: [["header.shopButton", "Shop button label"]], nav: true },
  { id: "hero", label: "Hero", fields: [["hero.tag", "Small pill"], ["hero.eyebrow", "Pill text"], ["hero.title", "Heading"], ["hero.subtitle", "Subtitle", "textarea"], ["hero.primaryCta", "Primary button"], ["hero.secondaryCta", "Secondary button"], ["hero.backgroundImage", "Background image URL"], ["hero.backgroundAlt", "Background alt text"]], hero: true },
  { id: "sections", label: "Homepage sections", fields: [
    ["sections.bestSellers.kicker", "Best sellers kicker"], ["sections.bestSellers.title", "Best sellers heading"], ["sections.bestSellers.button", "Best sellers button"],
    ["sections.video.tag", "Video tag"], ["sections.video.title", "Video heading"], ["sections.video.subtitle", "Video subtitle", "textarea"], ["sections.video.primaryCta", "Video primary button"], ["sections.video.secondaryCta", "Video secondary button"],
    ["sections.collections.kicker", "Collections kicker"], ["sections.collections.title", "Collections heading"], ["sections.collections.button", "Collections button"],
    ["sections.testimonials.kicker", "Testimonials kicker"], ["sections.testimonials.title", "Testimonials heading"], ["sections.testimonials.subtitle", "Testimonials subtitle", "textarea"],
    ["sections.blogs.kicker", "Blog kicker"], ["sections.blogs.title", "Blog heading"], ["sections.blogs.button", "Blog button"],
    ["sections.community.kicker", "Community kicker"], ["sections.community.title", "Community heading"], ["sections.community.button", "Community button"]] },
  { id: "footer", label: "Footer", fields: [
    ["footer.newsletterHeading", "Newsletter heading"], ["footer.newsletterPlaceholder", "Newsletter placeholder"], ["footer.newsletterButton", "Newsletter button"],
    ["footer.description", "Footer description", "textarea"], ["footer.contactButton", "Contact button"],
    ["footer.quickLinksTitle", "Quick links title"], ["footer.followTitle", "Follow title"], ["footer.getInTouchTitle", "Get in touch title"],
    ["footer.email", "Email"], ["footer.phone", "Phone"], ["footer.address", "Address"],
    ["footer.socials.instagram", "Instagram URL"], ["footer.socials.facebook", "Facebook URL"], ["footer.socials.twitter", "Twitter / X URL"], ["footer.socials.youtube", "YouTube URL"]] },
];

function renderAppearance() {
  const current = appearanceTabs.find((t) => t.id === state.params[0]) || appearanceTabs[0];
  const fields = current.fields.map(([path, label, type]) => field(path, label, type)).join("");
  const nav = current.nav
    ? `<h3>Navigation</h3>${(settings.header?.nav || []).map((item, i) => `<div class="grid"><label>Label<input data-path="header.nav.${i}.label" value="${escapeHtml(item.label)}"></label><label>Link<input data-path="header.nav.${i}.href" value="${escapeHtml(item.href)}"></label></div>`).join("")}`
    : "";
  const hero = current.hero
    ? `<div class="card-head"><h3>Hero images</h3><button type="button" class="secondary" data-add-hero-image>+ Add image</button></div>
       ${(settings.hero?.images || []).map((img, i) => `<div class="variant"><div class="variant-head"><b>${escapeHtml(img.label || `Image ${i + 1}`)}</b><button type="button" class="link danger" data-remove-hero-image="${i}">Remove</button></div><div class="grid">${itemField(`hero.images.${i}.label`, "Label", img.label)}${itemField(`hero.images.${i}.enabled`, "Enabled", img.enabled !== false, "toggle")}</div>${imageField(`hero.images.${i}.image`, `hero.images.${i}.alt`, img.image, img.alt)}</div>`).join("")}`
    : "";
  return `
    <div class="tabs">${appearanceTabs.map((t) => `<a class="tab ${t.id === current.id ? "active" : ""}" href="#/appearance/${t.id}">${t.label}</a>`).join("")}</div>
    <section class="card"><div class="grid">${fields}</div>${nav}</section>
    ${hero ? `<section class="card">${hero}</section>` : ""}
  `;
}

/* ---------- router ---------- */

const routes = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  products: {
    title: "Products",
    render: () => (state.params[0] === "edit" ? renderProductEditor(Number(state.params[1])) : renderProductsList()),
    crumb: () => (state.params[0] === "edit" ? settings.products?.[Number(state.params[1])]?.name || "Edit" : ""),
  },
  categories: { title: "Categories", render: () => (state.params[0] === "edit" ? renderCategoryEditor(Number(state.params[1])) : renderCategoriesList()) },
  banners: { title: "Banners", render: () => (state.params[0] === "edit" ? renderBannerEditor(Number(state.params[1])) : renderBannersList()) },
  blog: { title: "Blog Posts", render: () => (state.params[0] === "edit" ? renderBlogEditor(Number(state.params[1])) : renderBlogList()), crumb: () => (state.params[0] === "edit" ? settings.blogPosts?.[Number(state.params[1])]?.title || "Edit" : "") },
  pages: { title: "Pages & SEO", render: () => (state.params[0] === "edit" ? renderPageEditor(Number(state.params[1])) : renderPagesList()) },
  content: { title: "Page Text", render: renderContent },
  appearance: { title: "Appearance", render: renderAppearance },
};

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [route, ...params] = hash.split("/").filter(Boolean);
  state.route = routes[route] ? route : "dashboard";
  state.params = params;
}

function render() {
  if (!settings) return;
  parseRoute();
  // "new" routes create the item then jump to its editor
  if (state.params[0] === "new") {
    const map = { products: "product", categories: "category", banners: "banner", blog: "blog", pages: "page" };
    const key = { product: "products", category: "categories", banner: "banners", blog: "blogPosts", page: "pages" }[map[state.route]];
    addItem(map[state.route]);
    location.hash = `#/${state.route}/edit/${settings[key].length - 1}`;
    return;
  }
  const route = routes[state.route];
  pageTitle.textContent = route.title;
  const crumb = route.crumb ? route.crumb() : "";
  crumbs.innerHTML = `<a href="#/">Admin</a> › <a href="#/${state.route}">${route.title}</a>${crumb ? ` › <span>${escapeHtml(crumb)}</span>` : ""}`;
  document.querySelectorAll("#nav a[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === state.route));
  view.innerHTML = route.render();
  document.body.classList.remove("nav-open");
  bindInputs();
  window.scrollTo(0, 0);
}

/* ---------- bindings ---------- */

function bindInputs() {
  view.querySelectorAll("input[data-path], textarea[data-path], select[data-path]").forEach((el) => {
    const handler = () => {
      set(el.dataset.path, el.type === "checkbox" ? el.checked : el.value);
      // keep the paired colour inputs in sync
      if (el.type === "color" || (el.dataset.path.endsWith(".color") && el.type !== "color")) {
        view.querySelectorAll(`[data-path="${el.dataset.path}"]`).forEach((other) => {
          if (other !== el && /^#[0-9a-f]{6}$/i.test(el.value)) other.value = el.value;
        });
      }
      if (el.dataset.path.endsWith(".name") || el.dataset.path.endsWith(".title")) {
        const slugPath = el.dataset.path.replace(/\.(name|title)$/, ".slug");
        const slugInput = view.querySelector(`[data-path="${slugPath}"]`);
        if (slugInput && (!slugInput.value || slugInput.dataset.auto === "true")) {
          slugInput.value = slugify(el.value);
          slugInput.dataset.auto = "true";
          set(slugPath, slugInput.value);
        }
      }
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });

  view.querySelectorAll("[data-rich]").forEach((el) => el.addEventListener("input", () => set(el.dataset.rich, el.innerHTML)));

  view.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      if (button.dataset.command === "createLink") {
        const url = prompt("Link URL");
        if (url) document.execCommand("createLink", false, url);
        return;
      }
      document.execCommand(button.dataset.command, false, button.dataset.value || null);
    });
  });

  view.querySelectorAll("[data-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      showToast("Uploading image…", "info");
      try {
        const url = await uploadImage(file);
        set(input.dataset.upload, url);
        render();
        showToast("Image uploaded. Save to publish.");
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  view.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => {
    const key = { product: "products", category: "categories", banner: "banners", blog: "blogPosts", page: "pages" }[button.dataset.add];
    addItem(button.dataset.add);
    location.hash = `#/${state.route}/edit/${settings[key].length - 1}`;
  }));

  view.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => {
    const [arrayName, index] = button.dataset.remove.split(".");
    const item = settings[arrayName][Number(index)];
    if (!confirm(`Delete "${item?.name || item?.title || item?.label || "this item"}"? This cannot be undone after saving.`)) return;
    settings[arrayName].splice(Number(index), 1);
    markDirty();
    if (button.dataset.then) location.hash = button.dataset.then;
    else render();
  }));

  view.querySelectorAll("[data-add-variant]").forEach((button) => button.addEventListener("click", () => {
    const product = settings.products[Number(button.dataset.addVariant)];
    product.variants ||= [];
    product.variants.push({ id: makeId("variant"), name: "New colour", color: "#111111", sku: "", stock: 0, image: product.image || "", alt: product.alt || "", enabled: true });
    markDirty();
    render();
  }));

  view.querySelectorAll("[data-remove-variant]").forEach((button) => button.addEventListener("click", () => {
    const [p, v] = button.dataset.removeVariant.split(".").map(Number);
    settings.products[p].variants.splice(v, 1);
    markDirty();
    render();
  }));

  view.querySelectorAll("[data-add-hero-image]").forEach((button) => button.addEventListener("click", () => {
    settings.hero ||= {};
    settings.hero.images ||= [];
    settings.hero.images.push({ id: makeId("hero-image"), label: "New hero image", image: "", alt: "", enabled: true });
    markDirty();
    render();
  }));

  view.querySelectorAll("[data-remove-hero-image]").forEach((button) => button.addEventListener("click", () => {
    settings.hero.images.splice(Number(button.dataset.removeHeroImage), 1);
    markDirty();
    render();
  }));

  const search = view.querySelector("#search");
  if (search) {
    search.addEventListener("input", () => {
      state.search = search.value;
      const pos = search.selectionStart;
      render();
      const again = view.querySelector("#search");
      if (again) {
        again.focus();
        again.setSelectionRange(pos, pos);
      }
    });
  }

  view.querySelectorAll("tr[data-href]").forEach((row) => row.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    location.hash = row.dataset.href;
  }));
}

function addItem(type) {
  const brand = settings.brand?.name || "LeatherCulture";
  if (type === "page") {
    settings.pages ||= [];
    settings.pages.push({ id: makeId("page"), name: "New Page", slug: "new-page", path: "/new-page", heading: "New Page", excerpt: "", metaTitle: `New Page | ${brand}`, metaDescription: "", keywords: "", canonicalPath: "/new-page", enabled: true });
  }
  if (type === "banner") {
    settings.banners ||= [];
    settings.banners.push({ id: makeId("banner"), label: "New banner", title: "New banner", image: "", alt: "", href: "/shop", enabled: true });
  }
  if (type === "category") {
    settings.categories ||= [];
    settings.categories.push({ id: makeId("category"), name: "New category", slug: "new-category", description: "", image: "", alt: "", metaTitle: "", metaDescription: "", keywords: "", canonicalPath: "/shop?category=new-category", enabled: true });
  }
  if (type === "product") {
    settings.products ||= [];
    settings.products.push({ id: makeId("product"), name: "New product", slug: "new-product", category: settings.categories?.[0]?.id || "men", price: "Rs 0", compareAtPrice: "", material: "", care: "", warranty: "", badge: "", image: "", alt: "", enabled: false, description: "", metaTitle: "", metaDescription: "", keywords: "", canonicalPath: "/shop/new-product", variants: [{ id: makeId("variant"), name: "Black", color: "#111111", sku: "", stock: 0, image: "", alt: "", enabled: true }] });
  }
  if (type === "blog") {
    settings.blogPosts ||= [];
    settings.blogPosts.push({ id: makeId("blog"), title: "New blog post", slug: "new-blog-post", excerpt: "", metaTitle: "", metaDescription: "", keywords: "", canonicalPath: "/blog/new-blog-post", body: "<p>Start writing here.</p>", author: brand, date: new Date().toISOString().slice(0, 10), coverImage: "", coverAlt: "", status: "draft" });
  }
  markDirty();
}

function normalizeBeforeSave() {
  settings.hero ||= {};
  settings.hero.images ||= [];
  settings.hero.images.forEach((image, index) => {
    image.id = image.id || slugify(image.label || `hero-image-${index + 1}`);
  });
  (settings.pages || []).forEach((page) => {
    page.slug = page.slug ? slugify(page.slug) : "";
    page.path = page.path || (page.slug ? `/${page.slug}` : "/");
    page.canonicalPath = page.canonicalPath || page.path;
  });
  (settings.categories || []).forEach((category) => {
    category.slug = slugify(category.slug || category.name);
    category.canonicalPath = category.canonicalPath || `/shop?category=${category.slug}`;
  });
  (settings.products || []).forEach((product) => {
    product.slug = slugify(product.slug || product.name);
    product.canonicalPath = product.canonicalPath || `/shop/${product.slug}`;
    (product.variants || []).forEach((variant) => {
      variant.id = variant.id || slugify(variant.name || "variant");
    });
  });
  (settings.blogPosts || []).forEach((post) => {
    post.slug = slugify(post.slug || post.title);
    post.canonicalPath = post.canonicalPath || `/blog/${post.slug}`;
  });
}

/* ---------- API ---------- */

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file) {
  const dataUrl = await fileToDataUrl(file);
  const response = await fetch(apiUrl("/api/admin/upload"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Upload failed");
  return (await response.json()).url;
}

async function requireLogin() {
  const response = await fetch(apiUrl("/api/admin/me"), { cache: "no-store", credentials: "include" });
  document.body.classList.toggle("locked", !response.ok);
  if (response.ok) await load();
}

async function load() {
  const response = await fetch(apiUrl("/api/storefront/settings"), { cache: "no-store", credentials: "include" });
  settings = await response.json();
  markClean();
  render();
}

async function save() {
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  try {
    normalizeBeforeSave();
    const response = await fetch(apiUrl("/api/storefront/settings"), {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error((await response.json()).message || "Save failed");
    settings = await response.json();
    markClean();
    render();
    showToast("Saved. The store updates within a few seconds.");
  } catch (error) {
    saveButton.disabled = false;
    showToast(error.message, "error");
  } finally {
    saveButton.textContent = "Save changes";
  }
}

/* ---------- wiring ---------- */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Checking…";
  const response = await fetch(apiUrl("/api/admin/login"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: passwordInput.value }),
  });
  if (!response.ok) {
    loginStatus.textContent = "Wrong password";
    return;
  }
  passwordInput.value = "";
  loginStatus.textContent = "";
  document.body.classList.remove("locked");
  await load();
});

document.getElementById("logout").addEventListener("click", async () => {
  if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
  await fetch(apiUrl("/api/admin/logout"), { method: "POST", credentials: "include" });
  document.body.classList.add("locked");
});

saveButton.addEventListener("click", save);
document.getElementById("menu-toggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
window.addEventListener("hashchange", render);
window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (dirty) save();
  }
});

requireLogin().catch((error) => {
  loginStatus.textContent = error.message;
});
