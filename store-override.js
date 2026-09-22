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

  function parkVideo(video) {
    if (video.dataset.lcActive === "true") return;
    video.removeAttribute("autoplay");
    video.preload = "none";
    video.muted = true;
    video.playsInline = true;
    let changed = false;
    const src = video.getAttribute("src");
    if (src) {
      video.dataset.lcSrc = src;
      video.removeAttribute("src");
      changed = true;
    }
    const poster = video.getAttribute("poster");
    if (poster) {
      video.dataset.lcPoster = poster;
      video.removeAttribute("poster");
    }
    video.querySelectorAll("source[src]").forEach((source) => {
      source.dataset.lcSrc = source.getAttribute("src");
      source.removeAttribute("src");
      changed = true;
    });
    if (changed) {
      try {
        video.pause();
        video.load();
      } catch (error) {
        /* ignore */
      }
    }
    video.dataset.lcParked = "true";
  }

  function wakeVideo(video) {
    video.dataset.lcActive = "true";
    if (video.dataset.lcPoster && !video.getAttribute("poster")) video.setAttribute("poster", video.dataset.lcPoster);
    if (video.dataset.lcSrc && !video.getAttribute("src")) video.setAttribute("src", video.dataset.lcSrc);
    video.querySelectorAll("source[data-lc-src]").forEach((source) => {
      if (!source.getAttribute("src")) source.setAttribute("src", source.dataset.lcSrc);
    });
  }

  // Runs synchronously on every DOM change touching media, so a re-rendered <video autoplay>
  // is disarmed before the browser starts downloading it.
  const mediaObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes") {
        const target = record.target;
        const video = target.tagName === "VIDEO" ? target : target.tagName === "SOURCE" ? target.closest("video") : null;
        if (video && video.dataset.lcActive !== "true" && (target.getAttribute("src") || target.getAttribute("autoplay") !== null)) parkVideo(video);
        return;
      }
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.tagName === "VIDEO") parkVideo(node);
        else if (node.firstElementChild) node.querySelectorAll("video").forEach(parkVideo);
      });
    });
  });
  // Only needed once Framer's runtime starts re-rendering (after load); during HTML parsing the
  // static <video preload="none"> is handled by optimizeMedia, and observing parse-time inserts costs paint time.
  window.addEventListener("load", () => {
    mediaObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "autoplay", "poster"] });
  });

  function optimizeMedia() {
    const fold = window.innerHeight * 1.25;
    document.querySelectorAll("img").forEach((image) => {
      image.decoding = "async";
      if (image.dataset.lcMediaOptimized || image.getAttribute("fetchpriority") === "high") return;
      const rect = image.getBoundingClientRect();
      const aboveFold = rect.width > 0 && rect.top + window.scrollY < fold;
      if (!aboveFold) image.loading = "lazy";
      image.dataset.lcMediaOptimized = "true";
    });

    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((video) => {
      if (!video.dataset.lcParked) parkVideo(video);
    });

    if (prefersReducedMotion) return;
    if (!("IntersectionObserver" in window)) return;
    if (!videoObserver) {
      videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
              wakeVideo(video);
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        { rootMargin: "360px 0px", threshold: 0.01 }
      );
    }
    videos.forEach((video) => {
      if (!video.dataset.lcVideoObserved) {
        video.dataset.lcVideoObserved = "true";
        videoObserver.observe(video);
      }
    });
  }

  const hiddenTexts = ["Children's Wear"];

  function get(path, source = settings) {
    return path.split(".").reduce((current, key) => current && current[key], source);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  const BLOCK_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, a, button, label";
  const BLOCK_CHILD_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, button, div, label";

  // One DOM walk per apply pass: every text node, leaf block and placeholder keyed by its
  // normalized text. All replacements then run as map lookups instead of full-document scans.
  let textIndex = null;

  function pushIndex(map, key, value) {
    if (!key) return;
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  }

  function buildTextIndex() {
    const index = { nodes: new Map(), blocks: new Map(), inputs: new Map() };
    if (!document.body) return index;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) pushIndex(index.nodes, walker.currentNode.nodeValue.trim(), walker.currentNode);
    document.querySelectorAll(BLOCK_SELECTOR).forEach((element) => {
      if (element.querySelector(BLOCK_CHILD_SELECTOR)) return;
      pushIndex(index.blocks, normalizeText(element.textContent), element);
    });
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((input) => {
      pushIndex(index.inputs, normalizeText(input.placeholder), input);
    });
    return index;
  }

  function getTextIndex() {
    if (!textIndex) textIndex = buildTextIndex();
    return textIndex;
  }

  function invalidateTextIndex() {
    textIndex = null;
  }

  function findBlocks(text) {
    return getTextIndex().blocks.get(normalizeText(text)) || [];
  }

  // Replace text in text nodes first; fall back to whole elements whose visible text matches
  // (Framer splits animated headings into one <span> per word, so text nodes alone can't match).
  function replaceText(candidates, next) {
    if (!next) return false;
    const target = normalizeText(next);
    const lookup = new Set(candidates.filter(Boolean).map((value) => normalizeText(value)));
    lookup.delete(target);
    if (!lookup.size) return false;
    const index = getTextIndex();
    let hit = false;
    lookup.forEach((key) => {
      (index.nodes.get(key) || []).forEach((node) => {
        if (!node.isConnected || node.nodeValue.trim() !== key) return;
        // only whole blocks: never rewrite one word-span of a longer heading or sentence
        const block = node.parentElement && node.parentElement.closest(BLOCK_SELECTOR);
        if (block && normalizeText(block.textContent) !== key) return;
        node.nodeValue = node.nodeValue.replace(key, next);
        hit = true;
      });
      (index.blocks.get(key) || []).forEach((element) => {
        if (!element.isConnected || normalizeText(element.textContent) !== key) return;
        element.textContent = next;
        hit = true;
      });
      (index.inputs.get(key) || []).forEach((input) => {
        if (input.isConnected) input.placeholder = next;
      });
      // keep the index usable for later lookups of the new value
      (index.nodes.get(key) || []).forEach((node) => pushIndex(index.nodes, target, node));
      (index.blocks.get(key) || []).forEach((element) => pushIndex(index.blocks, target, element));
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

    const isPhoto = (node, style) => node.tagName === "IMG" || node.tagName === "VIDEO" || (style.backgroundImage && style.backgroundImage !== "none");
    // 1. everything painted under the logo, top-most first (overlays, photos, panels)
    for (const element of stack) {
      if (!(element instanceof Element)) continue;
      if (header && header.contains(element)) continue;
      const style = window.getComputedStyle(element);
      if (isPhoto(element, style)) return { r: 40, g: 40, b: 40, a: 1 };
      const color = parseRgb(style.backgroundColor);
      if (color && color.a > 0.55) return color;
      // a dark tint over a photo still means "dark"
      if (color && color.a >= 0.3 && (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255 < 0.4) return { r: 40, g: 40, b: 40, a: 1 };
    }
    // 2. nothing solid in the stack: inherit from the ancestors of the deepest element
    let node = stack.find((element) => element instanceof Element && !(header && header.contains(element))) || null;
    while (node && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      if (isPhoto(node, style)) return { r: 40, g: 40, b: 40, a: 1 };
      const color = parseRgb(style.backgroundColor);
      if (color && color.a > 0.55) return color;
      node = node.parentElement;
    }

    return null;
  }

  function updateHeaderContrast() {
    if (!document.body) return;
    const pathname = location.pathname.replace(/\/$/, "") || "/";
    let useBlackLogo = false;
    const scrolled = window.scrollY > 40;
    document.body.classList.toggle("lc-scrolled", scrolled);

    if (scrolled) {
      useBlackLogo = true;
    } else if (pathname === "/" && window.scrollY < window.innerHeight * 0.58) {
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
      .querySelectorAll(".framer-16gypsd a, .framer-jt1lle-container a, .framer-f9mt9f-container a, .framer-agjbad-container a")
      .forEach((link) => {
        link.setAttribute("data-brand", brand);
        link.setAttribute("aria-label", brand);
        if (!link.getAttribute("href")) link.setAttribute("href", "/");
      });

    // template links the footer address to a hard-coded London map
    const address = get("footer.address");
    if (address) {
      document.querySelectorAll("a[href*='google.com/maps']").forEach((link) => {
        link.setAttribute("href", `https://www.google.com/maps/search/${encodeURIComponent(address)}`);
        link.setAttribute("rel", "noopener");
      });
    }
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

    const images = Array.from(document.querySelectorAll("img")).map((img) => [img, img.getAttribute("src") || ""]);
    mediaItems.forEach((item) => {
      const file = basename(item.image);
      if (!file || !item.alt) return;
      images.forEach(([img, src]) => {
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
    const heading = document.querySelector("h1, .framer-styles-preset-17m6oxo");
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
    info.querySelectorAll("[data-framer-name='Product Specs'] [data-framer-name='Wrapper']").forEach((wrapper) => {
      const row = wrapper.parentElement || wrapper;
      const [label, value] = row.querySelectorAll("p");
      const key = normalizeText(label && label.textContent).toLowerCase();
      if (value && specs[key]) value.textContent = specs[key];
    });

    // "Order Now" (a template link to framer.com) becomes the add-to-cart button
    const orderButton = Array.from(info.querySelectorAll("a[href]")).find((link) => /framer\.com/i.test(link.getAttribute("href") || "") || /^(order now|add to cart)/i.test(normalizeText(link.textContent)) || link.dataset.lcCartBound);
    if (orderButton && window.LeatherCultureCart) {
      window.LeatherCultureCart.bindProductButton(orderButton, product, () => {
        const card = document.querySelector("[data-lc-active-media]");
        const index = card ? Number(card.dataset.lcActiveMedia) - 1 : -1;
        const variants = (product.variants || []).filter((variant) => variant.enabled !== false);
        return index >= 0 ? variants[index] || null : variants[0] || null;
      });
    }

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
    if (!mediaItems.length) return;

    const mainImage = findMainProductImage(product);
    if (!mainImage) return;
    mainImage.classList.add("lc-product-main-image");

    // Framer's product card has its own thumbnail strip ("Images wrapper"); feed it the store's images
    const card = mainImage.closest("[data-framer-name='01'], [class*='-container']") || mainImage.parentElement;
    const strip = (card && card.querySelector("[data-framer-name='Images wrapper']")) || (card && card.parentElement && card.parentElement.querySelector("[data-framer-name='Images wrapper']"));
    const thumbs = strip ? Array.from(strip.querySelectorAll("img")).filter((img) => img.getClientRects().length) : [];
    const current = Number(card && card.dataset.lcActiveMedia) || 0;
    const show = mediaItems[current] || mediaItems[0];
    if (!mainImage.dataset.lcLocked || mainImage.getAttribute("src") !== show.url) {
      mainImage.removeAttribute("srcset");
      mainImage.setAttribute("src", show.url);
      mainImage.setAttribute("alt", show.alt);
      mainImage.dataset.lcLocked = "true";
    }

    thumbs.forEach((thumb, index) => {
      const cell = thumb.closest("[data-framer-name='Active large'], [data-framer-name='Inactive'], [class*='-container']") || thumb;
      const item = mediaItems[index];
      if (!item) {
        cell.style.display = "none";
        return;
      }
      cell.style.display = "";
      if (thumb.getAttribute("src") !== item.url) {
        thumb.removeAttribute("srcset");
        thumb.setAttribute("src", item.url);
        thumb.setAttribute("alt", item.alt);
      }
      cell.classList.toggle("lc-thumb-active", index === current);
    });

    if (strip && !strip.dataset.lcBound) {
      strip.dataset.lcBound = "true";
      strip.addEventListener(
        "click",
        (event) => {
          const thumb = event.target instanceof Element ? event.target.closest("img") : null;
          const list = Array.from(strip.querySelectorAll("img")).filter((img) => img.getClientRects().length);
          const index = thumb ? list.indexOf(thumb) : -1;
          if (index < 0 || !mediaItems[index]) return;
          event.preventDefault();
          event.stopPropagation();
          if (card) card.dataset.lcActiveMedia = String(index);
          mainImage.removeAttribute("srcset");
          mainImage.setAttribute("src", mediaItems[index].url);
          mainImage.setAttribute("alt", mediaItems[index].alt);
          list.forEach((img, i) => {
            const cell = img.closest("[data-framer-name='Active large'], [data-framer-name='Inactive'], [class*='-container']") || img;
            cell.classList.toggle("lc-thumb-active", i === index);
          });
        },
        true
      );
    }

    if (strip) {
      strip.style.display = mediaItems.length < 2 ? "none" : "";
    }
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

  function linkPath(link) {
    try {
      return new URL(link.getAttribute("href") || "", location.href).pathname.replace(/\/$/, "");
    } catch (error) {
      return "";
    }
  }

  // Re-point a template product card at one of the store's products.
  function fillProductCard(link, product, imageInfo) {
    link.setAttribute("href", `/shop/${product.slug || product.id}`);
    const texts = Array.from(link.querySelectorAll("p, h2, h3, h4, h5")).filter((node) => !node.querySelector("p, h2, h3, h4, h5"));
    const isPrice = (text) => /^(rs\.?|pkr|\$|€|£)?\s*[\d.,]+(\.\d{2})?$/i.test(text) || /^(usd|pkr|rs)\s/i.test(text);
    const prices = texts.filter((node) => isPrice(normalizeText(node.textContent)));
    const name = texts.find((node) => !isPrice(normalizeText(node.textContent)) && normalizeText(node.textContent).length > 12);
    if (name && product.name) name.textContent = product.name;
    if (prices[0] && product.price) prices[0].textContent = product.price;
    if (prices[1]) {
      const compare = normalizeText(product.compareAtPrice);
      prices[1].textContent = compare;
      prices[1].style.display = compare ? "" : "none";
    }
    const images = imageInfo || Array.from(link.querySelectorAll("img")).map((img) => [img, true]);
    const variants = (product.variants || []).filter((variant) => variant.enabled !== false && variant.image);
    let swatch = 0;
    const cardImage = (url) => (/^\/assets\/images\/.+\.webp$/.test(url || "") && !/-card\.webp$/.test(url) ? url.replace(/\.webp$/, "-card.webp") : url);
    images.forEach(([img, large]) => {
      const source = cardImage(large ? product.image : (variants[swatch++] || {}).image);
      const holder = img.closest("[data-framer-background-image-wrapper]") || img;
      if (!source) {
        if (!large) (holder.parentElement || holder).style.display = "none";
        return;
      }
      img.removeAttribute("srcset");
      const original = large ? product.image : source.replace(/-card\.webp$/, ".webp");
      if (source !== original) img.onerror = () => { img.onerror = null; img.setAttribute("src", mediaUrl(original)); };
      img.setAttribute("src", mediaUrl(source));
      img.setAttribute("alt", product.alt || product.name || "");
    });
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // The template ships demo products and blog posts from Framer's CMS. Cards that point at
  // items the store doesn't have are hidden; blog cards are re-pointed at real posts in order.
  function syncCatalogLinks() {
    if (!settings) return;
    const live = (settings.products || []).filter((item) => item.enabled !== false && (item.slug || item.id));
    const products = new Set(live.flatMap((item) => [item.slug, item.id]).filter(Boolean));
    // Read all layout first (one reflow), then write.
    const cards = Array.from(document.querySelectorAll("a[href*='/shop/']"))
      .map((link) => {
        const slug = (linkPath(link).match(/^\/shop\/([^/]+)$/) || [])[1];
        const rendered = link.getClientRects().length > 0;
        const images = Array.from(link.querySelectorAll("img")).map((img) => {
          const width = img.getBoundingClientRect().width;
          return [img, width > 80 || width === 0];
        });
        return [link, slug, rendered, images];
      })
      .filter(([, slug]) => slug)
      // rendered cards decide the mapping; hidden breakpoint variants follow it
      .sort(([, , a], [, , b]) => (b ? 1 : 0) - (a ? 1 : 0));
    const bySlug = new Map(live.flatMap((item) => [[item.slug, item], [item.id, item]]).filter(([key]) => key));
    const shown = new Set(cards.filter(([, slug, rendered]) => products.has(slug) && rendered).map(([, slug]) => (bySlug.get(slug) || {}).slug || slug));
    const spare = live.filter((item) => !shown.has(item.slug));
    const assigned = new Map();
    cards.forEach(([link, slug, , images]) => {
      if (products.has(slug)) {
        fillProductCard(link, bySlug.get(slug), images);
        return;
      }
      if (!assigned.has(slug)) assigned.set(slug, spare.shift() || null);
      const product = assigned.get(slug);
      if (!product) {
        hideCard(link);
        return;
      }
      fillProductCard(link, product, images);
    });

    const posts = (settings.blogPosts || []).filter((post) => post.status === "published" && post.slug);
    const order = [];
    document.querySelectorAll("a[href*='/blog/']").forEach((link) => {
      const match = linkPath(link).match(/^\/blog\/([^/]+)$/);
      if (!match) return;
      const slug = match[1];
      if (posts.some((post) => post.slug === slug)) return;
      if (!order.includes(slug)) order.push(slug);
      const post = posts[order.indexOf(slug)];
      if (!post) {
        hideCard(link);
        return;
      }
      link.setAttribute("href", `/blog/${post.slug}`);
      const texts = Array.from(link.querySelectorAll("h1, h2, h3, h4, h5, h6, p")).filter((node) => !node.querySelector("p, h1, h2, h3, h4, h5, h6"));
      const title = texts.find((node) => /^h[1-6]$/i.test(node.tagName)) || texts.slice().sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
      if (title && post.title) title.textContent = post.title;
      const excerpt = texts.find((node) => node !== title && normalizeText(node.textContent).length > 40);
      if (excerpt && post.excerpt) excerpt.textContent = post.excerpt;
      const date = texts.find((node) => /^(\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]{2} \d{1,2}, \d{4})$/.test(normalizeText(node.textContent)));
      if (date && post.date) date.textContent = formatDate(post.date);
      if (post.coverImage) {
        link.querySelectorAll("img").forEach((img) => {
          img.removeAttribute("srcset");
          img.setAttribute("src", mediaUrl(post.coverImage));
          img.setAttribute("alt", post.coverAlt || post.title || "");
        });
      }
    });
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
    if (window.LeatherCultureCart) window.LeatherCultureCart.configure(settings);
    setLogoBrand();
    setPageMeta();
    replaceBoundText();
    applyPageContent();
    setLinksAndInputs();
    setImageData();
    setProductData();
    syncCatalogLinks();
    syncProductSchema();
  }

  async function loadSettings() {
    try {
      const response = await fetch(apiUrl("/api/storefront/settings"), { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      previousSettings = settings;
      settings = await response.json();
      apply();
    } catch (error) {
      console.error("LeatherCulture: could not apply store settings", error);
      setLogoBrand();
    }
  }

  // Hide a whole card including its grid wrapper so the layout closes the gap.
  function hideCard(node) {
    const link = node.closest("a[href*='/shop/'], a[href*='/blog/']") || node;
    const cell = link.parentElement && /-container$/.test((link.parentElement.className || "").split(" ")[0] || "") ? link.parentElement : link;
    cell.style.display = "none";
  }

  function hideByText() {
    findBlocks("Children's Wear").forEach((node) => {
      const target = node.closest("a, button") || node;
      target.style.display = "none";
    });
    hiddenTexts.forEach((text) => {
      findBlocks(text).forEach((node) => hideCard(node));
    });
  }

  function moveVideoAfterBestSellers() {
    const bestHeading = findBlocks(get("sections.bestSellers.title") || "Our signature best selling pieces")[0] || findBlocks("Our signature best selling pieces")[0];
    const videoHeading = findBlocks(get("sections.video.title") || "Defining modern style")[0] || findBlocks("Defining modern style")[0];
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

  let applying = false;
  let pageLoaded = false;
  const runLog = [];
  function runApply() {
    runLog.push({ t: Math.round(performance.now()), settings: !!settings, product: !!(settings && currentProductFromPath()) });
    clearTimeout(timer);
    clearTimeout(maxTimer);
    maxTimer = 0;
    applying = true;
    try {
      invalidateTextIndex();
      optimizeMedia();
      hideByText();
      moveVideoAfterBestSellers();
      cleanVisibleBranding();
      enforceSingleH1();
      applySettings();
    } catch (error) {
      runLog.push({ error: String(error && error.stack || error).slice(0, 300) });
      console.error("LeatherCulture: store override failed", error);
    } finally {
      // Our own DOM writes are delivered to the observer as a microtask queued before this one,
      // so resetting here skips exactly that batch and nothing later (e.g. React's hydration commit).
      queueMicrotask(() => {
        applying = false;
      });
    }
  }

  // Debounce DOM churn, but never let a busy page (Framer re-rendering, tickers, galleries)
  // starve the pass: a max-wait timer guarantees a run within 1.2s of the first request.
  let maxTimer = 0;
  function apply() {
    clearTimeout(timer);
    timer = setTimeout(runApply, pageLoaded ? 400 : 80);
    if (!maxTimer) maxTimer = setTimeout(runApply, pageLoaded ? 1200 : 300);
  }

  // Internal links always do a full page load. Framer's client-side router swaps pages in place,
  // which fights the DOM changes made here (and its route data loader 404s on this host).
  document.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.dataset.lcCartBound) return;
      const href = link.getAttribute("href") || "";
      if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
      let url;
      try {
        url = new URL(href, location.href);
      } catch (error) {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      event.preventDefault();
      event.stopPropagation();
      location.href = url.href;
    },
    true
  );

  // Debug hook: window.LeatherCultureStore.apply() re-runs the pass; .settings() shows the loaded data.
  window.LeatherCultureStore = { apply: runApply, settings: () => settings, product: currentProductFromPath, runs: () => runLog };

  // Framer's runtime is started only after the first frame is on screen. When the network is fast
  // its ~1.5s of hydration work would otherwise run before first paint and push LCP behind it.
  function startFramerRuntime() {
    const holder = document.querySelector("script[data-lc-framer-main]");
    if (!holder || holder.dataset.lcStarted) return;
    holder.dataset.lcStarted = "true";
    const script = document.createElement("script");
    script.type = "module";
    script.async = true;
    script.setAttribute("data-framer-bundle", "main");
    script.src = holder.dataset.lcFramerMain;
    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    requestAnimationFrame(() => requestAnimationFrame(startFramerRuntime));
    setTimeout(startFramerRuntime, 1500);
    optimizeMedia();
    setLogoBrand();
    loadSettings();
    apply();
    scheduleHeaderContrast();
  });
  window.addEventListener("load", () => {
    pageLoaded = true;
    apply();
  });
  window.addEventListener("scroll", scheduleHeaderContrast, { passive: true });
  window.addEventListener("resize", scheduleHeaderContrast);
  new MutationObserver(() => {
    if (!applying) apply();
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
