(function () {
  const textBindings = [
    ["Black friday sale 50% off", "announcement.text"],
    ["Shop all items", "header.shopButton"],
    ["Soft", "hero.tag"],
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
    ["Subscribe", "footer.newsletterButton"],
    ["A sophisticated e-commerce template designed for modern and minimalist brands.", "footer.description"],
    ["Contact LeatherCulture", "footer.contactButton"],
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

  function replaceText(candidates, next) {
    if (!next) return;
    const lookup = new Set(candidates.filter(Boolean).map((value) => String(value).trim()));
    walkTextNodes((node) => {
      const current = node.nodeValue.trim();
      if (lookup.has(current)) node.nodeValue = node.nodeValue.replace(current, next);
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

  function setLogoBrand() {
    const brand = get("brand.name") || "LeatherCulture";
    document
      .querySelectorAll(".framer-16gypsd a, .framer-jt1lle-container a, .framer-f9mt9f-container a")
      .forEach((link) => link.setAttribute("data-brand", brand));
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
        hero.setAttribute("src", heroImage);
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
      img.setAttribute("src", item.image);
      img.setAttribute("alt", item.alt || item.label || "");
    });
  }

  function productById(source, id) {
    return (source && source.products || []).find((item) => item.id === id || item.slug === id);
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
            if (product.image) img.setAttribute("src", product.image);
            img.setAttribute("alt", product.alt || product.name || "");
          });
        }
      });

      replaceText([fallback.name, previous.name], product.name);
      replaceText([fallback.price, previous.price], product.price);
    });
  }

  function applySettings() {
    setLogoBrand();
    setPageMeta();
    replaceBoundText();
    setLinksAndInputs();
    setImageData();
    setProductData();
  }

  async function loadSettings() {
    try {
      const response = await fetch("/api/storefront/settings", { cache: "no-store" });
      if (!response.ok) return;
      previousSettings = settings;
      settings = await response.json();
      applySettings();
    } catch (error) {
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

  function cleanVisibleBranding() {
    document.title = document.title.replace(/Wearix/gi, "LeatherCulture").replace(/Framer Template/gi, "Premium Store");
    document.querySelectorAll("iframe[id*='framer'], [class*='__framer-badge']").forEach((node) => node.remove());
  }

  let timer = 0;
  function apply() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      hideByText();
      moveVideoAfterBestSellers();
      cleanVisibleBranding();
      applySettings();
    }, 80);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setLogoBrand();
    loadSettings();
    apply();
  });
  window.addEventListener("load", apply);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
})();
