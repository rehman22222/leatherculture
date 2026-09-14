const editor = document.getElementById("editor");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");
const logoutButton = document.getElementById("logout");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const passwordInput = document.getElementById("password");

let settings = null;
const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function mediaUrl(value) {
  if (!value) return value;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (apiBase && value.startsWith("/assets/uploads/")) return `${apiBase}${value}`;
  return value;
}

const simpleGroups = [
  {
    id: "brand",
    title: "Brand",
    fields: [
      ["brand.name", "Store name"],
      ["brand.title", "Browser title"],
      ["brand.description", "SEO description", "textarea"],
      ["announcement.text", "Announcement text"],
    ],
  },
  {
    id: "header",
    title: "Header",
    fields: [["header.shopButton", "Shop button"]],
    nav: true,
  },
  {
    id: "hero",
    title: "Hero Section",
    fields: [
      ["hero.tag", "Small pill"],
      ["hero.eyebrow", "Pill text"],
      ["hero.title", "Hero heading"],
      ["hero.subtitle", "Hero subtitle", "textarea"],
      ["hero.primaryCta", "Primary button"],
      ["hero.secondaryCta", "Secondary button"],
      ["hero.backgroundImage", "Hero background image URL"],
      ["hero.backgroundAlt", "Hero background alt text"],
    ],
  },
  {
    id: "sections",
    title: "Homepage Sections",
    fields: [
      ["sections.bestSellers.kicker", "Best sellers kicker"],
      ["sections.bestSellers.title", "Best sellers heading"],
      ["sections.bestSellers.button", "Best sellers button"],
      ["sections.video.tag", "Video tag"],
      ["sections.video.title", "Video heading"],
      ["sections.video.subtitle", "Video subtitle", "textarea"],
      ["sections.video.primaryCta", "Video primary button"],
      ["sections.video.secondaryCta", "Video secondary button"],
      ["sections.collections.kicker", "Collections kicker"],
      ["sections.collections.title", "Collections heading"],
      ["sections.collections.button", "Collections button"],
      ["sections.testimonials.kicker", "Testimonials kicker"],
      ["sections.testimonials.title", "Testimonials heading"],
      ["sections.testimonials.subtitle", "Testimonials subtitle", "textarea"],
      ["sections.blogs.kicker", "Blog kicker"],
      ["sections.blogs.title", "Blog heading"],
      ["sections.blogs.button", "Blog button"],
      ["sections.community.kicker", "Community kicker"],
      ["sections.community.title", "Community heading"],
      ["sections.community.button", "Community button"],
    ],
  },
  {
    id: "footer",
    title: "Footer",
    fields: [
      ["footer.newsletterHeading", "Newsletter heading"],
      ["footer.newsletterPlaceholder", "Newsletter input placeholder"],
      ["footer.newsletterButton", "Newsletter button"],
      ["footer.description", "Footer description", "textarea"],
      ["footer.contactButton", "Footer contact button"],
      ["footer.quickLinksTitle", "Quick links title"],
      ["footer.followTitle", "Follow title"],
      ["footer.getInTouchTitle", "Get in touch title"],
      ["footer.email", "Email"],
      ["footer.phone", "Phone"],
      ["footer.address", "Address"],
      ["footer.socials.instagram", "Instagram URL"],
      ["footer.socials.facebook", "Facebook URL"],
      ["footer.socials.twitter", "Twitter/X URL"],
      ["footer.socials.youtube", "Youtube URL"],
    ],
  },
];

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
}

function field(path, label, type = "input", options = []) {
  if (type === "textarea") {
    return `<label>${label}<textarea data-path="${path}">${escapeHtml(get(path))}</textarea></label>`;
  }
  if (type === "select") {
    return `<label>${label}<select data-path="${path}">${options
      .map((option) => `<option value="${escapeHtml(option.value)}" ${get(path) === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("")}</select></label>`;
  }
  if (type === "checkbox") {
    return `<label class="check"><input type="checkbox" data-path="${path}" ${get(path) ? "checked" : ""}> ${label}</label>`;
  }
  return `<label>${label}<input data-path="${path}" value="${escapeHtml(get(path))}"></label>`;
}

function itemField(path, label, value, type = "input", options = []) {
  if (type === "textarea") return `<label>${label}<textarea data-path="${path}">${escapeHtml(value)}</textarea></label>`;
  if (type === "select") {
    return `<label>${label}<select data-path="${path}">${options
      .map((option) => `<option value="${escapeHtml(option.value)}" ${value === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("")}</select></label>`;
  }
  if (type === "checkbox") return `<label class="check"><input type="checkbox" data-path="${path}" ${value ? "checked" : ""}> ${label}</label>`;
  return `<label>${label}<input data-path="${path}" value="${escapeHtml(value)}"></label>`;
}

function imageField(path, altPath, image, alt) {
  return `
    <div class="image-row">
      <img src="${escapeHtml(mediaUrl(image) || "/assets/images/image-bundle-45.png")}" alt="">
      <div class="grid">
        ${itemField(path, "Image URL", image)}
        ${itemField(altPath, "Alt text", alt)}
        <label class="upload-line">Upload image<input type="file" accept="image/*" data-upload="${path}"></label>
      </div>
    </div>
  `;
}

function seoFields(basePath, item) {
  return `
    <div class="seo-grid">
      <h3>SEO</h3>
      <div class="grid">
        ${itemField(`${basePath}.metaTitle`, "Meta title", item.metaTitle)}
        ${itemField(`${basePath}.metaDescription`, "Meta description", item.metaDescription, "textarea")}
        ${itemField(`${basePath}.keywords`, "Keywords", item.keywords, "textarea")}
        ${itemField(`${basePath}.canonicalPath`, "Canonical URL path", item.canonicalPath)}
      </div>
    </div>
  `;
}

function renderPages() {
  return `
    <section id="pages">
      <div class="section-head"><h2>Pages & SEO</h2><button type="button" class="add-button" data-add="page">Add page</button></div>
      ${(settings.pages || [])
        .map(
          (page, index) => `
            <div class="item-card">
              <div class="item-top"><strong>${escapeHtml(page.name || "Page")}</strong><button type="button" class="danger" data-remove="pages.${index}">Remove</button></div>
              <div class="grid">
                ${itemField(`pages.${index}.name`, "Page name", page.name)}
                ${itemField(`pages.${index}.slug`, "Slug", page.slug)}
                ${itemField(`pages.${index}.path`, "URL path", page.path)}
                ${itemField(`pages.${index}.enabled`, "Enabled", page.enabled, "checkbox")}
                ${itemField(`pages.${index}.heading`, "Page heading", page.heading)}
                ${itemField(`pages.${index}.excerpt`, "Page excerpt", page.excerpt, "textarea")}
              </div>
              ${seoFields(`pages.${index}`, page)}
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function renderHeroImages() {
  const images = settings.hero?.images || [];
  return `
    <div class="variants-editor">
      <div class="section-head compact">
        <h3>Hero Images</h3>
        <button type="button" class="add-button" data-add-hero-image>Add hero image</button>
      </div>
      ${images
        .map(
          (item, index) => `
            <div class="variant-card">
              <div class="item-top">
                <strong>${escapeHtml(item.label || `Hero image ${index + 1}`)}</strong>
                <button type="button" class="danger" data-remove-hero-image="${index}">Remove image</button>
              </div>
              <div class="grid">
                ${itemField(`hero.images.${index}.label`, "Admin label", item.label)}
                ${itemField(`hero.images.${index}.enabled`, "Enabled", item.enabled, "checkbox")}
              </div>
              ${imageField(`hero.images.${index}.image`, `hero.images.${index}.alt`, item.image, item.alt)}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderVariants(product, productIndex) {
  const variants = product.variants || [];
  return `
    <div class="variants-editor">
      <div class="section-head compact">
        <h3>Variants / Colors</h3>
        <button type="button" class="add-button" data-add-variant="${productIndex}">Add variant</button>
      </div>
      ${variants
        .map(
          (variant, variantIndex) => `
            <div class="variant-card">
              <div class="item-top">
                <strong><span class="swatch-preview" style="background:${escapeHtml(variant.color || "#111111")}"></span>${escapeHtml(variant.name || "Variant")}</strong>
                <button type="button" class="danger" data-remove-variant="${productIndex}.${variantIndex}">Remove variant</button>
              </div>
              <div class="grid three">
                ${itemField(`products.${productIndex}.variants.${variantIndex}.name`, "Color / variant name", variant.name)}
                ${itemField(`products.${productIndex}.variants.${variantIndex}.color`, "Color hex", variant.color)}
                <label>Color picker<input type="color" data-path="products.${productIndex}.variants.${variantIndex}.color" value="${escapeHtml(variant.color || "#111111")}"></label>
                ${itemField(`products.${productIndex}.variants.${variantIndex}.sku`, "SKU", variant.sku)}
                ${itemField(`products.${productIndex}.variants.${variantIndex}.stock`, "Stock", variant.stock)}
                ${itemField(`products.${productIndex}.variants.${variantIndex}.enabled`, "Enabled", variant.enabled, "checkbox")}
              </div>
              ${imageField(`products.${productIndex}.variants.${variantIndex}.image`, `products.${productIndex}.variants.${variantIndex}.alt`, variant.image, variant.alt)}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSimpleGroup(group) {
  const fields = group.fields.map(([path, label, type]) => field(path, label, type)).join("");
  const nav = group.nav
    ? `
      <h3>Navigation</h3>
      ${settings.header.nav
        .map(
          (item, index) => `
            <div class="nav-row">
              <label>Label<input data-path="header.nav.${index}.label" value="${escapeHtml(item.label)}"></label>
              <label>Link<input data-path="header.nav.${index}.href" value="${escapeHtml(item.href)}"></label>
            </div>
          `
        )
        .join("")}
    `
    : "";

  const heroImages = group.id === "hero" ? renderHeroImages() : "";
  return `<section id="${group.id}"><h2>${group.title}</h2><div class="grid">${fields}</div>${heroImages}${nav}</section>`;
}

function renderBanners() {
  return `
    <section id="banners">
      <div class="section-head"><h2>Banners</h2><button type="button" class="add-button" data-add="banner">Add banner</button></div>
      ${(settings.banners || [])
        .map(
          (banner, index) => `
            <div class="item-card">
              <div class="item-top"><strong>${escapeHtml(banner.label || banner.title || "Banner")}</strong><button type="button" class="danger" data-remove="banners.${index}">Remove</button></div>
              <div class="grid">
                ${itemField(`banners.${index}.label`, "Admin label", banner.label)}
                ${itemField(`banners.${index}.title`, "Banner text", banner.title)}
                ${itemField(`banners.${index}.href`, "Link", banner.href)}
                ${itemField(`banners.${index}.enabled`, "Enabled", banner.enabled, "checkbox")}
              </div>
              ${imageField(`banners.${index}.image`, `banners.${index}.alt`, banner.image, banner.alt)}
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function renderCategories() {
  return `
    <section id="categories">
      <div class="section-head"><h2>Categories</h2><button type="button" class="add-button" data-add="category">Add category</button></div>
      ${(settings.categories || [])
        .map(
          (category, index) => `
            <div class="item-card">
              <div class="item-top"><strong>${escapeHtml(category.name || "Category")}</strong><button type="button" class="danger" data-remove="categories.${index}">Remove</button></div>
              <div class="grid">
                ${itemField(`categories.${index}.name`, "Category name", category.name)}
                ${itemField(`categories.${index}.slug`, "Slug", category.slug)}
                ${itemField(`categories.${index}.description`, "Description", category.description, "textarea")}
                ${itemField(`categories.${index}.enabled`, "Enabled", category.enabled, "checkbox")}
              </div>
              ${imageField(`categories.${index}.image`, `categories.${index}.alt`, category.image, category.alt)}
              ${seoFields(`categories.${index}`, category)}
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function renderProducts() {
  const categoryOptions = (settings.categories || []).map((category) => ({ value: category.id, label: category.name }));
  return `
    <section id="products">
      <div class="section-head"><h2>Products</h2><button type="button" class="add-button" data-add="product">Add product</button></div>
      ${(settings.products || [])
        .map(
          (product, index) => `
            <div class="item-card">
              <div class="item-top"><strong>${escapeHtml(product.name || "Product")}</strong><button type="button" class="danger" data-remove="products.${index}">Remove</button></div>
              <div class="grid">
                ${itemField(`products.${index}.name`, "Product name", product.name)}
                ${itemField(`products.${index}.slug`, "Slug", product.slug)}
                ${itemField(`products.${index}.category`, "Category", product.category, "select", categoryOptions)}
                ${itemField(`products.${index}.price`, "Price", product.price)}
                ${itemField(`products.${index}.badge`, "Badge", product.badge)}
                ${itemField(`products.${index}.enabled`, "Enabled", product.enabled, "checkbox")}
                ${itemField(`products.${index}.description`, "Description", product.description, "textarea")}
              </div>
              ${imageField(`products.${index}.image`, `products.${index}.alt`, product.image, product.alt)}
              ${seoFields(`products.${index}`, product)}
              ${renderVariants(product, index)}
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function renderBlogs() {
  return `
    <section id="blogs">
      <div class="section-head"><h2>Blog Posts</h2><button type="button" class="add-button" data-add="blog">Add blog</button></div>
      ${(settings.blogPosts || [])
        .map(
          (post, index) => `
            <div class="item-card">
              <div class="item-top"><strong>${escapeHtml(post.title || "Blog post")}</strong><button type="button" class="danger" data-remove="blogPosts.${index}">Remove</button></div>
              <div class="grid">
                ${itemField(`blogPosts.${index}.title`, "Title", post.title)}
                ${itemField(`blogPosts.${index}.slug`, "Slug", post.slug)}
                ${itemField(`blogPosts.${index}.excerpt`, "Excerpt", post.excerpt, "textarea")}
                ${itemField(`blogPosts.${index}.author`, "Author", post.author)}
                ${itemField(`blogPosts.${index}.date`, "Date", post.date)}
                ${itemField(`blogPosts.${index}.status`, "Status", post.status, "select", [
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                ])}
              </div>
              ${imageField(`blogPosts.${index}.coverImage`, `blogPosts.${index}.coverAlt`, post.coverImage, post.coverAlt)}
              ${seoFields(`blogPosts.${index}`, post)}
              <label>
                Body
                <div class="rich-toolbar" data-toolbar="${index}">
                  <button type="button" data-command="bold">Bold</button>
                  <button type="button" data-command="italic">Italic</button>
                  <button type="button" data-command="formatBlock" data-value="h2">H2</button>
                  <button type="button" data-command="formatBlock" data-value="h3">H3</button>
                  <button type="button" data-command="insertUnorderedList">List</button>
                  <button type="button" data-command="createLink">Link</button>
                </div>
                <div class="rich-editor" contenteditable="true" data-rich="blogPosts.${index}.body">${post.body || ""}</div>
              </label>
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function bindInputs() {
  editor.querySelectorAll("input[data-path], textarea[data-path], select[data-path]").forEach((el) => {
    el.addEventListener("input", () => {
      set(el.dataset.path, el.type === "checkbox" ? el.checked : el.value);
      if (el.dataset.path.endsWith(".name") || el.dataset.path.endsWith(".title")) {
        const slugPath = el.dataset.path.replace(/\.(name|title)$/, ".slug");
        const slugInput = editor.querySelector(`[data-path="${slugPath}"]`);
        if (slugInput && !slugInput.value) {
          slugInput.value = slugify(el.value);
          set(slugPath, slugInput.value);
        }
      }
    });
    el.addEventListener("change", () => set(el.dataset.path, el.type === "checkbox" ? el.checked : el.value));
  });

  editor.querySelectorAll("[data-rich]").forEach((el) => {
    el.addEventListener("input", () => set(el.dataset.rich, el.innerHTML));
  });

  editor.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.command;
      const value = button.dataset.value || null;
      if (command === "createLink") {
        const url = prompt("Paste link URL");
        if (url) document.execCommand(command, false, url);
        return;
      }
      document.execCommand(command, false, value);
    });
  });

  editor.querySelectorAll("[data-upload]").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      status.textContent = "Uploading image...";
      const url = await uploadImage(file);
      const imagePath = input.dataset.upload;
      set(imagePath, url);
      render();
      status.textContent = "Image uploaded. Remember to save changes.";
    });
  });

  editor.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addItem(button.dataset.add);
      render();
    });
  });

  editor.querySelectorAll("[data-add-variant]").forEach((button) => {
    button.addEventListener("click", () => {
      const productIndex = Number(button.dataset.addVariant);
      settings.products[productIndex].variants ||= [];
      settings.products[productIndex].variants.push({
        id: makeId("variant"),
        name: "New Color",
        color: "#111111",
        sku: "",
        stock: 0,
        image: settings.products[productIndex].image || "",
        alt: settings.products[productIndex].alt || "",
        enabled: true,
      });
      render();
    });
  });

  editor.querySelectorAll("[data-add-hero-image]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.hero ||= {};
      settings.hero.images ||= [];
      settings.hero.images.push({
        id: makeId("hero-image"),
        label: "New hero image",
        image: "",
        alt: "",
        enabled: true,
      });
      render();
    });
  });

  editor.querySelectorAll("[data-remove-hero-image]").forEach((button) => {
    button.addEventListener("click", () => {
      settings.hero.images.splice(Number(button.dataset.removeHeroImage), 1);
      render();
    });
  });

  editor.querySelectorAll("[data-remove-variant]").forEach((button) => {
    button.addEventListener("click", () => {
      const [productIndex, variantIndex] = button.dataset.removeVariant.split(".").map(Number);
      settings.products[productIndex].variants.splice(variantIndex, 1);
      render();
    });
  });

  editor.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const [arrayName, index] = button.dataset.remove.split(".");
      settings[arrayName].splice(Number(index), 1);
      render();
    });
  });
}

function render() {
  editor.innerHTML = [
    ...simpleGroups.slice(0, 3).map(renderSimpleGroup),
    renderPages(),
    renderBanners(),
    renderProducts(),
    renderCategories(),
    renderBlogs(),
    ...simpleGroups.slice(3).map(renderSimpleGroup),
  ].join("");
  bindInputs();
}

function addItem(type) {
  if (type === "page") {
    settings.pages ||= [];
    settings.pages.push({
      id: makeId("page"),
      name: "New Page",
      slug: "new-page",
      path: "/new-page",
      heading: "New Page",
      excerpt: "",
      metaTitle: "New Page Pakistan | LeatherCulture",
      metaDescription: "",
      keywords: "",
      canonicalPath: "/new-page",
      enabled: true,
    });
  }
  if (type === "banner") {
    settings.banners ||= [];
    settings.banners.push({ id: makeId("banner"), label: "New Banner", title: "New banner", image: "", alt: "", href: "/shop", enabled: true });
  }
  if (type === "category") {
    settings.categories ||= [];
    settings.categories.push({ id: makeId("category"), name: "New Category", slug: "new-category", description: "", image: "", alt: "", metaTitle: "", metaDescription: "", keywords: "", canonicalPath: "/shop?category=new-category", enabled: true });
  }
  if (type === "product") {
    settings.products ||= [];
    settings.products.push({
      id: makeId("product"),
      name: "New Product",
      slug: "new-product",
      category: settings.categories?.[0]?.id || "men",
      price: "$0.00",
      badge: "",
      image: "",
      alt: "",
      enabled: true,
      description: "",
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      canonicalPath: "/shop/new-product",
      variants: [
        { id: makeId("variant"), name: "Black", color: "#111111", sku: "", stock: 0, image: "", alt: "", enabled: true },
      ],
    });
  }
  if (type === "blog") {
    settings.blogPosts ||= [];
    settings.blogPosts.push({ id: makeId("blog"), title: "New Blog Post", slug: "new-blog-post", excerpt: "", metaTitle: "", metaDescription: "", keywords: "", canonicalPath: "/blog/new-blog-post", body: "<p>Start writing here.</p>", author: settings.brand?.name || "LeatherCulture", date: new Date().toISOString().slice(0, 10), coverImage: "", coverAlt: "", status: "draft" });
  }
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
  render();
}

async function save() {
  status.textContent = "Saving...";
  normalizeBeforeSave();
  const response = await fetch(apiUrl("/api/storefront/settings"), {
    method: "PUT",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error((await response.json()).message || "Save failed");
  settings = await response.json();
  status.textContent = "Saved. Refresh the store to see changes.";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginStatus.textContent = "Checking...";
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

logoutButton.addEventListener("click", async () => {
  await fetch(apiUrl("/api/admin/logout"), { method: "POST", credentials: "include" });
  document.body.classList.add("locked");
});

saveButton.addEventListener("click", async (event) => {
  event.preventDefault();
  try {
    await save();
  } catch (error) {
    status.textContent = error.message;
    status.style.color = "#9b111e";
  }
});

document.body.classList.add("locked");
requireLogin().catch((error) => {
  loginStatus.textContent = error.message;
});
