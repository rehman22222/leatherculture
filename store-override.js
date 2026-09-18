(function () {
  const textBindings = [
    ["Black friday sale 50% off", "announcement.text"],
    ["Shop all items", "header.shopButton"],
    ["Soft", "hero.tag"],
    ["Wearix", "hero.tag"],
    ["Warm Winter Layers", "hero.eyebrow"],
    ["Premium wear for modern living", "hero.title"],
    ["Discover our new range of soft clothes made for your daily look and your best days with the finest fabrics.", "hero.subtitle"],
    ["See all collections", "hero.primaryCta"],
    ["Contact us", "hero.secondaryCta"],
    ["New Collection", "sections.bestSellers.kicker"],
    ["Our signature best selling pieces", "sections.bestSellers.title"],
    ["View all items", "sections.bestSellers.button"],
    ["Style video", "sections.video.tag"],
    ["Defining modern style", "sections.video.title"],
    ["Minimal layers, confident proportions, and tactile textures made for daily luxury.", "sections.video.subtitle"],
    ["Shop this look", "sections.video.primaryCta"],
    ["Our story", "sections.video.secondaryCta"],
    ["Collection", "sections.collections.kicker"],
    ["Modern collections defined by simplicity", "sections.collections.title"],
    ["View all", "sections.collections.button"],
    ["Testimonials", "sections.testimonials.kicker"],
    ["The voice of quality", "sections.testimonials.title"],
    ["Real words from customers, stylists, and buyers who trust LeatherCulture.", "sections.testimonials.subtitle"],
    ["Our Journal", "sections.blogs.kicker"],
    ["Elevating your daily style journey", "sections.blogs.title"],
    ["All blogs", "sections.blogs.button"],
    ["Our community", "sections.community.kicker"],
    ["See our community in modern silhouettes", "sections.community.title"],
    ["Explore community", "sections.community.button"],
    ["Subscribe to our news letter", "footer.newsletterHeading"],
    ["Subscribe to our news later", "footer.newsletterHeading"],
    ["Subscribe", "footer.newsletterButton"],
    ["A sophisticated e-commerce template designed for modern and minimalist brands.", "footer.description"],
    ["Contact LeatherCulture", "footer.contactButton"],
    ["Contact Wearix", "footer.contactButton"],
    ["Quick Links", "footer.quickLinksTitle"],
    ["Follow us:", "footer.followTitle"],
    ["Get in touch", "footer.getInTouchTitle"],
    ["test@gmail.com", "footer.email"],
    ["hello@leatherculture.com", "footer.email"],
    ["+001 234 567 890", "footer.phone"],
    ["London, England", "footer.address"],
  ];

  const navFallbacks = ["Home", "About", "Shop", "Blog", "Contact"];
  const productFallbacks = {
    "structured-trench-coat": { name: "Structured Trench Coat", price: "$220.00" },
    "heavyweight-oversized-hoodie": { name: "Heavyweight Oversized Hoodie", price: "$180.00" },
    "pleated-smart-trousers": { name: "Pleated Smart Trousers", price: "$160.00" },
    "riviera-collar-shirt": { name: "Riviera Collar Shirt", price: "$145.00" },
    "classic-boxy-tee": { name: "Classic Boxy Tee", price: "$90.00" },
    "stretch-jersey-tee": { name: "Stretch Jersey Tee", price: "$85.00" },
    "urban-utility-cargo": { name: "Urban Utility Cargo", price: "$135.00" },
    "textured-knitted-shirt": { name: "Textured Knitted Shirt", price: "$115.00" },
  };
  const heroImageFallbacks = [
    "premium-wear-for-modern-living-3.jpg",
    "premium-wear-for-modern-living-2.jpg",
    "young-man-in-black-leather-double-breasted-jacket--1.png",
    "woman-in-greenish-shirt-3.jpg",
    "blue-t-shirt-3.png",
    "boy-in-black-hoodie-1.png",
    "hooded-puffer-vest-1.png",
    "man-having-tatto-on-neck.png",
    "shot-of-the-person-s-legs-wearing-the-brownish-pai-1.png",
  ];
  let settings = null;
  let previousSettings = null;
  const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileViewport = window.matchMedia && window.matchMedia("(max-width: 809px)").matches;

  function apiUrl(path) {
    return `${apiBase}${path}`;
  }

  function mediaUrl(value) {
    if (!value) return value;
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (apiBase && value.startsWith("/assets/uploads/")) return `${apiBase}${value}`;
    return value;
  }

  let videoObserver = null;

  function optimizeMedia() {
    document.querySelectorAll("img").forEach((image, index) => {
      image.decoding = "async";
      if (index > 4) {
        image.loading = "lazy";
        image.fetchPriority = "low";
      }
    });

    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((video) => {
      video.preload = mobileViewport ? "none" : "metadata";
      video.muted = true;
      video.playsInline = true;
      video.removeAttribute("autoplay");
      if (!video.dataset.lcVideoOptimized) {
        video.pause();
        video.dataset.lcVideoOptimized = "true";
      }
    });

    if (mobileViewport || prefersReducedMotion) return;
    if (!("IntersectionObserver" in window)) return;
    if (!videoObserver) {
      videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.55 }
      );
    }
    videos.forEach((video) => {
      if (!video.dataset.lcVideoObserved) {
        video.dataset.lcVideoObserved = "true";
        videoObserver.observe(video);
      }
    });
  }

  const hiddenTexts = [
    "Children's Wear",
    "Mini Denim Overalls",
    "Patterned Knit Sweater",
  ];

  function get(path, source = settings) {
    return path.split(".").reduce((current, key) => current && current[key], source);
  }

  function walkTextNodes(callback) {
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(callback);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  const BLOCK_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, a, button, label";

  // Replace text in text nodes first; fall back to whole elements whose visible text matches
  // (Framer splits animated headings into one <span> per word, so text nodes alone can't match).
  function replaceText(candidates, next) {
    if (!next) return;
    const lookup = new Set(candidates.filter(Boolean).map((value) => normalizeText(value)));
    lookup.delete(normalizeText(next));
    if (!lookup.size) return;
    let hit = false;
    walkTextNodes((node) => {
      const current = node.nodeValue.trim();
      if (lookup.has(current)) {
        node.nodeValue = node.nodeValue.replace(current, next);
        hit = true;
      }
    });
    document.querySelectorAll(BLOCK_SELECTOR).forEach((element) => {
      if (element.querySelector("p, h1, h2, h3, h4, h5, h6, li, button, div, label")) return;
      if (!lookup.has(normalizeText(element.textContent))) return;
      element.textContent = next;
      hit = true;
    });
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((input) => {
      if (lookup.has(normalizeText(input.placeholder))) input.placeholder = next;
    });
    return hit;
  }

  function contentGroupsForPage() {
    const groups = (settings && settings.content && settings.content.groups) || [];
    const pathname = location.pathname.replace(/\/$/, "") || "/";
    return groups.filter((group) => {
      if (group.match === "all") return true;
      if (group.match === "/shop/*") return /^\/shop\/[^/]+$/.test(pathname);
      return group.match === pathname;
    });
  }

  function applyPageContent() {
    if (!settings || !settings.content) return;
    const values = settings.content.values || {};
    const previousValues = (previousSettings && previousSettings.content && previousSettings.content.values) || {};
    contentGroupsForPage().forEach((group) => {
      (group.items || []).forEach((item) => {
        const next = normalizeText(values[item.key]);
        if (!next) return;
        replaceText([item.original, previousValues[item.key]], next);
      });
    });
  }

  function replaceBoundText() {
    if (!settings) return;

    for (const [fallback, path] of textBindings) {
      replaceText([fallback, get(path, previousSettings)], get(path));
    }

    const nav = get("header.nav") || [];
    nav.forEach((item, index) => {
      replaceText([navFallbacks[index], previousSettings && previousSettings.header && previousSettings.header.nav && previousSettings.header.nav[index] && previousSettings.header.nav[index].label], item.label);
    });
  }

  function parseRgb(value) {
    const match = String(value || "").match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some((part, index) => index < 3 && Number.isNaN(part))) return null;
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1,
    };
  }

  function readableBackgroundAtLogo() {
    const header = document.querySelector(".framer-149q19i-container");
    const logo = document.querySelector(".framer-16gypsd, .framer-jt1lle-container");
    const rect = (logo || header)?.getBoundingClientRect();
    const x = rect ? Math.min(Math.max(rect.left + Math.min(rect.width * 0.45, 160), 1), window.innerWidth - 1) : Math.min(180, window.innerWidth / 2);
    const y = rect ? Math.min(Math.max(rect.top + rect.height / 2, 1), window.innerHeight - 1) : 72;
    const stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];

    for (const element of stack) {
      if (!(element instanceof Element)) continue;
      if (header && header.contains(element)) continue;

      let node = element;
      while (node && node !== document.documentElement) {
        const style = window.getComputedStyle(node);
        const color = parseRgb(style.backgroundColor);
        if (color && color.a > 0.55) {
          return color;
        }
        node = node.parentElement;
      }
    }

    return null;
  }

  function updateHeaderContrast() {
    if (!document.body) return;
    const pathname = location.pathname.replace(/\/$/, "") || "/";
    let useBlackLogo = pathname !== "/";

    if (pathname === "/" && window.scrollY < window.innerHeight * 0.58) {
      useBlackLogo = false;
    } else {
      const color = readableBackgroundAtLogo();
      if (color) {
        const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;
        useBlackLogo = luminance > 0.62;
      }
    }

    document.body.classList.toggle("lc-light-header", useBlackLogo);
  }

  function setLogoBrand() {
    const brand = get("brand.name") || "LeatherCulture";
    const favicon = "/assets/brand/leather-culture-mark.png";
    updateHeaderContrast();
    document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((link) => {
      link.setAttribute("href", favicon);
      link.removeAttribute("media");
    });
    document.querySelectorAll("link[rel='apple-touch-icon']").forEach((link) => {
      link.setAttribute("href", "/assets/brand/apple-touch-icon.png");
      link.setAttribute("sizes", "180x180");
      link.removeAttribute("media");
    });
    if (!document.querySelector("link[rel='icon']")) {
      const link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.setAttribute("href", favicon);
      document.head.appendChild(link);
    }
    if (!document.querySelector("link[rel='apple-touch-icon']")) {
      const link = document.createElement("link");
      link.setAttribute("rel", "apple-touch-icon");
      link.setAttribute("href", "/assets/brand/apple-touch-icon.png");
      link.setAttribute("sizes", "180x180");
      document.head.appendChild(link);
    }
    document
      .querySelectorAll(".framer-16gypsd a, .framer-jt1lle-container a, .framer-f9mt9f-container a")
      .forEach((link) => {
        link.setAttribute("data-brand", brand);
        link.setAttribute("aria-label", brand);
      });
    updateHeaderContrast();
  }

  function setPageMeta() {
    const currentPage = currentPageSettings();
    const title = currentPage?.metaTitle || get("brand.title") || `${get("brand.name") || "LeatherCulture"} - Premium Store`;
    const description = currentPage?.metaDescription || get("brand.description");
    document.title = title.replace(/Wearix/gi, get("brand.name") || "LeatherCulture").replace(/Framer Template/gi, "Premium Store");
    document.querySelectorAll("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']").forEach((meta) => {
      if (description) meta.setAttribute("content", description);
    });
    let keywords = document.querySelector("meta[name='keywords']");
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    if (currentPage?.keywords) keywords.setAttribute("content", currentPage.keywords);
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", new URL(currentPage?.canonicalPath || location.pathname || "/", location.origin).toString());
    document.querySelectorAll("meta[property='og:title'], meta[name='twitter:title']").forEach((meta) => {
      meta.setAttribute("content", title);
    });
  }

  function currentPageSettings() {
    if (!settings || !settings.pages) return null;
    const pathname = location.pathname.replace(/\/$/, "") || "/";
    return settings.pages.find((page) => {
      const path = (page.path || page.canonicalPath || "/").replace(/\/$/, "") || "/";
      return path === pathname;
    });
  }

  function setLinksAndInputs() {
    if (!settings) return;

    const nav = get("header.nav") || [];
    nav.forEach((item, index) => {
      const oldHref = ["./", "./about", "./shop", "./blog", "./contact"][index];
      document.querySelectorAll(`a[href='${oldHref}'], a[href='../${oldHref.replace("./", "")}']`).forEach((link) => {
        if (item.href) link.setAttribute("href", item.href);
      });
    });

    document.querySelectorAll("input[placeholder='Enter your email']").forEach((input) => {
      input.setAttribute("placeholder", get("footer.newsletterPlaceholder") || "Enter your email");
    });

    const email = get("footer.email");
    const phone = get("footer.phone");
    if (email) document.querySelectorAll("a[href^='mailto:']").forEach((link) => link.setAttribute("href", `mailto:${email}`));
    if (phone) document.querySelectorAll("a[href^='tel:']").forEach((link) => link.setAttribute("href", `tel:${phone}`));

    const socialLinks = {
      Instagram: get("footer.socials.instagram"),
      Facebook: get("footer.socials.facebook"),
      Twitter: get("footer.socials.twitter"),
      Youtube: get("footer.socials.youtube"),
    };
    document.querySelectorAll("a").forEach((link) => {
      const label = (link.textContent || "").trim();
      if (socialLinks[label]) link.setAttribute("href", socialLinks[label]);
    });
  }

  function basename(value) {
    try {
      return new URL(value, window.location.origin).pathname.split("/").pop();
    } catch (error) {
      return String(value || "").split("/").pop();
    }
  }

  function setImageData() {
    if (!settings) return;

    const heroImages = (get("hero.images") || []).filter((item) => item.enabled !== false && item.image);
    const heroImage = get("hero.backgroundImage") || heroImages[0]?.image;
    const heroAlt = get("hero.backgroundAlt") || heroImages[0]?.alt || get("hero.title");
    if (heroImage) {
      const hero = Array.from(document.querySelectorAll("img")).find((img) => (img.getAttribute("src") || "").includes("premium-wear-for-modern-living"));
      if (hero) {
        hero.setAttribute("src", mediaUrl(heroImage));
        hero.setAttribute("alt", heroAlt || "");
      }
    }

    setHeroGalleryImages(heroImages);

    const mediaItems = [
      ...heroImages.map((item) => ({ image: item.image, alt: item.alt || item.label })),
      ...(settings.products || []).map((item) => ({ image: item.image, alt: item.alt || item.name })),
      ...(settings.products || []).flatMap((item) => (item.variants || []).map((variant) => ({ image: variant.image, alt: variant.alt || `${item.name} ${variant.name}` }))),
      ...(settings.categories || []).map((item) => ({ image: item.image, alt: item.alt || item.name })),
      ...(settings.blogPosts || []).map((item) => ({ image: item.coverImage, alt: item.coverAlt || item.title })),
    ];

    mediaItems.forEach((item) => {
      const file = basename(item.image);
      if (!file || !item.alt) return;
      document.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.includes(file)) img.setAttribute("alt", item.alt);
      });
    });
  }

  function setHeroGalleryImages(heroImages) {
    if (!heroImages.length) return;
    const candidates = Array.from(document.querySelectorAll("img")).filter((img) => {
      const src = img.getAttribute("src") || "";
      return heroImageFallbacks.some((file) => src.includes(file));
    });

    candidates.forEach((img, index) => {
      const item = heroImages[index % heroImages.length];
      if (!item?.image) return;
      img.setAttribute("src", mediaUrl(item.image));
      img.setAttribute("alt", item.alt || item.label || "");
    });
  }

  function productById(source, id) {
    return (source && source.products || []).find((item) => item.id === id || item.slug === id);
  }

  function currentProductFromPath() {
    if (!settings?.products) return null;
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] !== "shop" || !parts[1]) return null;
    return settings.products.find((item) => item.slug === parts[1] || item.id === parts[1]) || null;
  }

  function productMediaItems(product) {
    const items = [];
    const add = (item) => {
      if (!item?.image) return;
      const url = mediaUrl(item.image);
      if (items.some((existing) => existing.url === url)) return;
      items.push({
        url,
        alt: item.alt || item.name || item.label || product.name || "Product image",
        label: item.name || item.label || product.name || "Product"
      });
    };
    add({ image: product.image, alt: product.alt, name: product.name });
    (product.variants || [])
      .filter((variant) => variant.enabled !== false)
      .forEach(add);
    return items;
  }

  function findMainProductImage(product) {
    const mediaNames = productMediaItems(product).map((item) => basename(item.url)).filter(Boolean);
    const images = Array.from(document.querySelectorAll("img")).filter((image) => {
      const rect = image.getBoundingClientRect();
      const src = image.getAttribute("src") || "";
      return rect.width > 150 && rect.height > 150 && !src.includes("leather-culture-logo") && !src.includes("leather-culture-mark");
    });
    const matched = images.find((image) => mediaNames.some((name) => (image.getAttribute("src") || "").includes(name)));
    if (matched) return matched;
    return images.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.top - br.top || (br.width * br.height) - (ar.width * ar.height);
    })[0] || null;
  }

  function setProductDetailFields(product) {
    const heading = document.querySelector("h1");
    if (!heading) return;
    // Climb to the product info column: the ancestor that holds title, pricing, description and specs.
    let info = heading.parentElement;
    while (info && info !== document.body && !info.querySelector("[data-framer-name='Product Specs']")) info = info.parentElement;
    if (!info || info === document.body) return;

    const pricing = info.querySelector("[data-framer-name='Pricing']");
    if (pricing) {
      const priceNodes = Array.from(pricing.querySelectorAll("p"));
      const compare = pricing.querySelector("[data-framer-name='Compared price']");
      const main = priceNodes.find((node) => !compare || !compare.contains(node));
      if (main && product.price) main.textContent = product.price;
      if (compare) {
        const compareText = normalizeText(product.compareAtPrice);
        compare.style.display = compareText ? "" : "none";
        const node = compare.querySelector("p") || compare;
        if (compareText) node.textContent = compareText;
      }
    }

    const description = info.querySelector("[data-framer-name='Description text wrapper'] p");
    if (description && normalizeText(product.description)) description.textContent = product.description;

    const specs = { material: product.material, care: product.care, warranty: product.warranty };
    info.querySelectorAll("[data-framer-name='Product Specs'] [data-framer-name='Wrapper']").forEach((row) => {
      const [label, value] = row.querySelectorAll("p");
      const key = normalizeText(label && label.textContent).toLowerCase();
      if (value && specs[key]) value.textContent = specs[key];
    });

    const category = (settings.categories || []).find((item) => item.id === product.category || item.slug === product.category);
    if (category && category.name) {
      const tag = Array.from(info.querySelectorAll("[data-framer-name='Text wrapper'] p")).find((node) => /wear$/i.test(normalizeText(node.textContent)));
      if (tag) tag.textContent = category.name;
    }
  }

  function enhanceProductDetail() {
    const product = currentProductFromPath();
    if (!product) return;
    setProductDetailFields(product);
    const mediaItems = productMediaItems(product);
    if (mediaItems.length < 2) return;

    const mainImage = findMainProductImage(product);
    if (!mainImage) return;

    mainImage.classList.add("lc-product-main-image");
    const first = mediaItems[0];
    mainImage.removeAttribute("srcset");
    mainImage.setAttribute("src", first.url);
    mainImage.setAttribute("alt", first.alt);

    let gallery = document.querySelector(".lc-variant-gallery");
    if (!gallery) {
      gallery = document.createElement("div");
      gallery.className = "lc-variant-gallery";
      gallery.setAttribute("aria-label", "Product variant images");
      const imageBox = mainImage.closest("[data-framer-name='Image']") || mainImage.closest("[data-framer-background-image-wrapper]")?.parentElement || mainImage;
      imageBox.insertAdjacentElement("afterend", gallery);
    }

    gallery.innerHTML = "";
    mediaItems.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `lc-variant-thumb${index === 0 ? " is-active" : ""}`;
      button.setAttribute("aria-label", item.label);
      button.innerHTML = `<img src="${item.url}" alt="${item.alt}" loading="lazy" decoding="async">`;
      button.addEventListener("click", () => {
        gallery.querySelectorAll(".lc-variant-thumb").forEach((node) => node.classList.remove("is-active"));
        button.classList.add("is-active");
        mainImage.removeAttribute("srcset");
        mainImage.setAttribute("src", item.url);
        mainImage.setAttribute("alt", item.alt);
      });
      gallery.appendChild(button);
    });
  }

  function productLinks(product) {
    const keys = [product.id, product.slug].filter(Boolean);
    const links = [];
    keys.forEach((key) => {
      document.querySelectorAll(`a[href*="/shop/${key}"], a[href$="${key}"], a[href$="${key}/"]`).forEach((link) => {
        if (!links.includes(link)) links.push(link);
      });
    });
    return links;
  }

  function setProductData() {
    if (!settings || !settings.products) return;

    settings.products.forEach((product) => {
      const fallback = productFallbacks[product.id] || productFallbacks[product.slug] || {};
      const previous = productById(previousSettings, product.id || product.slug) || {};

      productLinks(product).forEach((link) => {
        link.setAttribute("href", `/shop/${product.slug || product.id}`);
        link.style.display = product.enabled === false ? "none" : "";

        const card = link.closest("a[href*='/shop/'], article, [data-framer-name*='Card'], [class*='container']") || link;
        if (card) {
          card.querySelectorAll("img").forEach((img) => {
            if (product.image) img.setAttribute("src", mediaUrl(product.image));
            img.setAttribute("alt", product.alt || product.name || "");
          });
        }
      });

      replaceText([fallback.name, previous.name], product.name);
      replaceText([fallback.price, previous.price], product.price);
    });

    enhanceProductDetail();
  }

  function syncProductSchema() {
    const product = currentProductFromPath();
    const script = document.querySelector("script[type='application/ld+json'][data-lc-seo]");
    if (!product || !script) return;
    try {
      const data = JSON.parse(script.textContent);
      const node = (data["@graph"] || []).find((item) => item["@type"] === "Product");
      if (!node) return;
      const amount = String(product.price || "").replace(/[^0-9.]/g, "");
      node.name = product.name || node.name;
      node.description = product.description || node.description;
      if (product.image) node.image = [new URL(mediaUrl(product.image), location.origin).toString()];
      node.offers = node.offers || {};
      node.offers.priceCurrency = "PKR";
      if (amount) node.offers.price = amount;
      node.offers.availability = (product.variants || []).some((v) => v.enabled !== false && Number(v.stock) > 0) || !(product.variants || []).length
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";
      script.textContent = JSON.stringify(data);
    } catch (error) {
      /* leave static schema untouched */
    }
  }

  function applySettings() {
    setLogoBrand();
    setPageMeta();
    replaceBoundText();
    applyPageContent();
    setLinksAndInputs();
    setImageData();
    setProductData();
    syncProductSchema();
  }

  async function loadSettings() {
    try {
      const response = await fetch(apiUrl("/api/storefront/settings"), { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      previousSettings = settings;
      settings = await response.json();
      applySettings();
    } catch (error) {
      console.error("LeatherCulture: could not apply store settings", error);
      setLogoBrand();
    }
  }

  function hideByText() {
    const nodes = Array.from(document.querySelectorAll("a, button, div, section, article"));
    for (const node of nodes) {
      const text = (node.textContent || "").trim();
      if (!text) continue;

      if (text === "Children's Wear") {
        const target = node.closest("a, button") || node;
        target.style.display = "none";
      }

      if (hiddenTexts.some((value) => text.includes(value))) {
        const card = node.closest("a[href*='/shop/'], article, [data-framer-name*='Card'], [class*='container']");
        if (card && card !== document.body) card.style.display = "none";
      }
    }
  }

  function moveVideoAfterBestSellers() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, p, div"));
    const bestHeading = headings.find((node) => (node.textContent || "").trim() === "Our signature best selling pieces");
    const videoHeading = headings.find((node) => (node.textContent || "").trim() === "Defining modern style");
    if (!bestHeading || !videoHeading) return;

    const bestSection = bestHeading.closest("section, header");
    const videoSection = videoHeading.closest("section, header");
    if (!bestSection || !videoSection || bestSection === videoSection) return;

    let section = bestSection;
    while (section.parentElement && section.parentElement !== document.body) {
      if (section.parentElement.contains(videoSection)) break;
      section = section.parentElement;
    }

    const parent = bestSection.parentElement;
    if (parent && videoSection.parentElement === parent && bestSection.nextElementSibling !== videoSection) {
      parent.insertBefore(videoSection, bestSection.nextElementSibling);
    }
  }

  function retag(element, tag) {
    const next = document.createElement(tag);
    Array.from(element.attributes).forEach((attr) => next.setAttribute(attr.name, attr.value));
    while (element.firstChild) next.appendChild(element.firstChild);
    element.replaceWith(next);
    return next;
  }

  function isRendered(element) {
    return element.getClientRects().length > 0;
  }

  // Keep exactly one <h1> per page: promote the product title on product pages,
  // demote any duplicate hero headings Framer renders for other breakpoints.
  function enforceSingleH1() {
    if (!document.body) return;
    let headings = Array.from(document.querySelectorAll("h1"));

    if (!headings.some(isRendered)) {
      const product = currentProductFromPath();
      const name = (product && product.name) || (productFallbacks[location.pathname.split("/").filter(Boolean)[1]] || {}).name;
      const candidate = Array.from(document.querySelectorAll("h2, h3")).find((node) => {
        const text = (node.textContent || "").trim();
        return isRendered(node) && (node.classList.contains("framer-styles-preset-17m6oxo") || (name && text === name));
      });
      if (candidate) retag(candidate, "h1");
      headings = Array.from(document.querySelectorAll("h1"));
    }

    const primary = headings.find(isRendered) || headings[0];
    headings.forEach((node) => {
      if (node !== primary) retag(node, "h2");
    });
  }

  function cleanVisibleBranding() {
    document.title = document.title.replace(/Wearix/gi, "LeatherCulture").replace(/Framer Template/gi, "Premium Store");
    document.querySelectorAll("iframe[id*='framer'], [class*='__framer-badge']").forEach((node) => node.remove());
  }

  // Header visibility: hidden while scrolling down, shown again on scroll up.
  const HIDE_HEADER_ON_SCROLL_DOWN = true;
  const HEADER_SCROLL_THRESHOLD = 8;
  let lastScrollY = window.scrollY || 0;
  function updateHeaderVisibility() {
    if (!document.body) return;
    const y = window.scrollY || 0;
    const delta = y - lastScrollY;
    if (Math.abs(delta) < HEADER_SCROLL_THRESHOLD) return;
    const scrollingDown = delta > 0;
    const hide = y > 80 && (HIDE_HEADER_ON_SCROLL_DOWN ? scrollingDown : !scrollingDown);
    document.body.classList.toggle("lc-header-hidden", hide);
    lastScrollY = y;
  }

  let timer = 0;
  let contrastFrame = 0;
  function scheduleHeaderContrast() {
    if (contrastFrame) return;
    contrastFrame = window.requestAnimationFrame(() => {
      contrastFrame = 0;
      updateHeaderVisibility();
      updateHeaderContrast();
    });
  }

  function apply() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      optimizeMedia();
      hideByText();
      moveVideoAfterBestSellers();
      cleanVisibleBranding();
      applySettings();
      enforceSingleH1();
    }, 80);
  }

  document.addEventListener("DOMContentLoaded", () => {
    optimizeMedia();
    setLogoBrand();
    loadSettings();
    apply();
    scheduleHeaderContrast();
  });
  window.addEventListener("load", apply);
  window.addEventListener("scroll", scheduleHeaderContrast, { passive: true });
  window.addEventListener("resize", scheduleHeaderContrast);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
})();
