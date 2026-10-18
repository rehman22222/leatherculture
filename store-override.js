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
    ["Subscribe to our news later", "footer.newsletterHeading"],
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
  // Keep Framer's original moving carousel and simply swap its stock images
  // for the live LeatherCulture jacket catalogue.
  const communityImageAssetIds = new Set([
    "3BJsJKp6d3GMb73lMFLvun3bVxE", "Q2qaxWvHcpcMDMRF6r6oA7jcK9Q",
    "jz6J8tN19rBotBJ08ib9LED2s8", "U7CtuDK0AXUNTwGdENumrlmdyk",
    "PhQ0ou5z6Mj6gzpcsLLi5rS6E0", "ftObEL64RY81LvY92K11dTejqZ4",
    "IEB9QLOzy0qlnSdGfn5jQsBFFVo"
  ]);
  // Alt text for the template's own images, keyed by Framer asset id. Framer's client render drops the
  // alt text of these images, and some template alts were misspelt. The build applies the same map.
  const imageAlts = {
    "g813yVl0fq2gEobS7kOZx537SY": "Man in an oversized black double-breasted leather jacket, white T-shirt and blue jeans",
    "HaLbFMQL3UBYnLDE5V1KjUjLbU": "Man in a black hooded zip jacket with white piping on the sleeves",
    "UqbagK5Zf6G91yyijIvdScOQDI": "Man in a navy hooded puffer jacket, grey roll-neck and blue beanie",
    "7dwU69CcPP5QPRAcGcQvWaJXm3c": "Man in a black ribbed polo shirt, black beanie and sunglasses",
    "xXRw7s77WdhR0P4zOTGGkDW2qs": "Back view of a man in a tan trucker jacket and dark brown beanie",
    "IWKuR2oZjCwRSiCZeEvdAMXZEg": "Olive crew-neck sweatshirt on a wooden hanger against a sunlit wall",
    "8sl32ni8KnyCp50kGqlisQGcL8I": "Price tag icon",
    "gpBvWinM7Lbkx2EDFzBtxqeHQ4": "Email icon",
    "iwbukaHQ1fljde6iYf5LtwGIUzw": "Phone icon",
    "YAj4FvLQ9fP1GagGQLTVIn971nw": "Location pin icon",
    "tR2xGFKMU6c8PPl8Kqup0m7DMEE": "Arrow icon",
    "JYIP0HLZZxRd5iwMgkfmFfUMAA": "Decorative logo",
    "xAiRUK2vLf9i9TqFrO0b1wRHy4c": "Decorative logo",
    "jJeX9lBksyAiRkW6RsfnlDJ4D4": "Decorative logo",
    "f8csSGuYaUBfDwfLFOysGffSY": "Decorative logo",
    "HAfe1jEmy3pyzyc9lampV2qADY": "Decorative logo",
    "DYCoyDe8REkqHEgecYVsQLUGfg": "Decorative logo",
    "4I0nUFgLGKqAqwEE0S5l6yrCXzQ": "Decorative logo",
    "K7N7aNahky7BhBGyGdXp7oSDc": "Decorative logo",
    "UsU6TSwGi1GYzawTJkBdu5BNeqg": "Decorative logo",
    "Qifbcz2UjIveHTCuImUZcqT9kZg": "Decorative logo",
    "6QEz8kJbwqWFzbNDcgcMwaBk7Jk": "Decorative logo",
    "xjBP37MgaLIT2MdXe0Kl896XmbM": "Portrait of a smiling man in an olive shirt in a workshop",
    "V6kvRnK4tvwVKtnM3SDW7g4T9I": "Portrait of a woman in a white collared shirt",
    "8Y1Vd6ysDPyE3ONSfgw125SCPw": "Portrait of a smiling woman in a sage T-shirt",
    "qL5xOqMFC6yF35qSRHaAWJGZQKU": "Portrait of a smiling man in glasses and a purple T-shirt",
    "G8RDO1PQndTWIrwwR6NkSGjho": "Portrait of a smiling woman in a tan jacket",
    "Or4CSjqekPU2Ug6V0zSDTbgtg": "Woman in a green shirt",
    "YI6OX1Ix0QFPJHufS272fscYaI": "Woman in a blue leather jacket",
    "UDfLjRvzk0xpuvTb0EisZ50R4B8": "Man with a neck tattoo",
    "ATHsoTzpbKxwwKkISL2Qfi2BQ2U": "Cyberpunk-style fashion pose",
    "o8BbZ7Bmf99hekDMhLBtBkxBoY": "Minimalist fashion look",
    "h5mjcigkuGzHUrDKNZj4VOiAg": "White sweatshirt on a clothesline",
    "3pzhLnz4BOm15P19zWPl47fJ0Mo": "White sweatshirt on a clothesline",
    "UVxenUklVk5C5hRgP2zTRqEdMPk": "Low-angle shot of a woman in a black dress",
    "UdKyQkva2vLQZ0vNuYpmKAdtzw": "Woman in a grey blazer",
    "v4WTQ9WoN7RxeC3vNiZP9SvQcQ": "Colourful shirts hanging in a wardrobe",
    "3BJsJKp6d3GMb73lMFLvun3bVxE": "Woman in a dark green dress",
    "Q2qaxWvHcpcMDMRF6r6oA7jcK9Q": "Child sitting on a stool in a stylish pose",
    "jz6J8tN19rBotBJ08ib9LED2s8": "Woman in a white and red dress",
    "U7CtuDK0AXUNTwGdENumrlmdyk": "Low-angle shot of a man in a white shirt",
    "PhQ0ou5z6Mj6gzpcsLLi5rS6E0": "Woman in dark glasses and a grey dress",
    "IEB9QLOzy0qlnSdGfn5jQsBFFVo": "Boy in a black hoodie",
    "FFAlreqmltBbtn7iNy9lIQTMI": "Person in a black suit",
    "6nknFZTNUtU9BA1FnqLy7dPrtmE": "Young man in a black double-breasted leather jacket and jeans",
    "XY7DXjHvJ7qxI2SulzDqvBiRbvw": "Young man in a black double-breasted leather jacket and jeans by a white wall",
    "DKGh82SyvtbMKZ4jbKtsf3cq42c": "Young man in a black double-breasted leather jacket and jeans",
    "Uv4VM4rvpvfRnmB5e1YXaDJXQ": "Young man in a black double-breasted leather jacket and jeans",
    "HdE6FLCHJd2VT91mYyisz2G77g8": "Young man in a black double-breasted leather jacket and jeans",
    "VW4VJmmdCt9WP6FoBGWnqDq6VS8": "Woman in a green blazer and black glasses",
    "liIxg0opfCsW1pRixs56aS3Aj4": "Woman in a black jacket standing beside white clothes",
    "imHLb05OBp3rVa7DL12JicfwlE": "Woman in a black jacket",
    "4zsYQkMwe0g61iw8T3MZGzvhak": "Woman holding a dark green bag",
    "cWQhDyWBhK2dbOvMbEutN5jO0s": "Child with curly hair in a black jacket",
    "Mpbd0iQ2COOMJArbHqRZMQoFRA": "Smartly dressed child in a black jacket",
    "FNS875X1XnR0GJd4UpTh1Zms": "Child with brown hair in a black jacket",
    "E6tqcNcNIbkMCzBYvnABQBtwcM": "Child in a black jacket",
    "MLJe7H4csZkBunu5nEk84enCjM": "Child in a green blazer and black glasses",
    "k4gwIeU3rPPXIyxSMgWszrewfy8": "Group of young men in casual streetwear",
    "gXeXEdJCGwcyaYKiWNSbF2Wf5Yg": "Woman in a stylish dress",
    "35jbjH7zEBW0GXGMbgGlejxpwB0": "Woman in a stylish pose",
    "Rgl552fnphzXIpke91z265iosU": "Close-up of a person's legs in brown trousers",
    "YRHt9c7e9X3xKQWj3EtnUpPEdcY": "Woman in a red dress posing",
    "bfKnYz5PM2SU3fPvsCyVCnuFsY": "T-shirts hanging in a wardrobe",
    "VjeS4g3bothn3ykWlAjDWS5giK0": "Woman in a stylish black dress",
    "gWNl9J30vKv4SW0ITunuKmvtfW0": "Young man in a black blazer and white high-neck top",
    "ySVxzwG1Y66iKkI0QESKXxQk8Jw": "Woman in a patterned coat",
    "qQSMjW83F8jPIOKDIIevJNTWs": "Woman in a black shirt looking back against a blue sky"
  };
  const assetId = (src) => (/\/assets\/cdn\/images\/([A-Za-z0-9]+)-[0-9a-f]{8}\./.exec(src || "") || [])[1] || "";
  // Remember the alt text the static HTML carries, before Framer's runtime re-renders the images.
  const staticAlts = new Map();
  document.querySelectorAll("img[alt]").forEach((img) => {
    const id = assetId(img.getAttribute("src"));
    const alt = (img.getAttribute("alt") || "").trim();
    if (id && alt && !staticAlts.has(id)) staticAlts.set(id, alt);
  });
  let settings = null;
  try { settings = JSON.parse(document.getElementById("lc-build-settings")?.textContent || "null"); } catch (_) { /* legacy pages use the API */ }
  let previousSettings = null;
  const apiBase = String(window.LEATHERCULTURE_API_BASE || "").replace(/\/$/, "");
  const isHomePage = location.pathname === "/" || location.pathname === "/index.html";
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
    document.querySelectorAll("img").forEach((image) => {
      image.decoding = "async";
      if (image.dataset.lcMediaOptimized || image.getAttribute("fetchpriority") === "high") return;
      // Reading each image's layout during Framer hydration caused repeated forced reflows.
      // Build output already marks the LCP image high priority, so every other visual can safely
      // wait for the browser's native lazy-loader without measuring its position in JavaScript.
      const isHeaderImage = Boolean(image.closest("header, .framer-149q19i-container"));
      if (!isHeaderImage) image.loading = "lazy";
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
    // Product and blog routes carry their own meta; only fall back to the brand defaults on the
    // home page, never on a deeper page (that would stamp the home title onto every product).
    const product = currentProductFromPath();
    const post = currentBlogPostFromPath();
    const currentPage = currentPageSettings();
    const isHome = (location.pathname.replace(/\/$/, "") || "/") === "/";
    const record = product || post || currentPage;
    const fallbackTitle = isHome ? get("brand.title") || `${get("brand.name") || "LeatherCulture"} - Premium Store` : document.title;
    const title = (record && record.metaTitle) || fallbackTitle;
    const description = (record && record.metaDescription) || (record && record.excerpt) || (isHome ? get("brand.description") : null);
    document.title = title.replace(/Framer Template/gi, "Premium Store");
    document.querySelectorAll("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']").forEach((meta) => {
      if (description) meta.setAttribute("content", description);
    });
    let keywords = document.querySelector("meta[name='keywords']");
    if (!keywords) {
      keywords = document.createElement("meta");
      keywords.setAttribute("name", "keywords");
      document.head.appendChild(keywords);
    }
    if (record && record.keywords) keywords.setAttribute("content", record.keywords);
    let canonical = document.querySelector("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", new URL((record && record.canonicalPath) || location.pathname || "/", location.origin).toString());
    document.querySelectorAll("meta[property='og:title'], meta[name='twitter:title']").forEach((meta) => {
      meta.setAttribute("content", title);
    });
  }

  function currentBlogPostFromPath() {
    if (!settings || !settings.blogPosts) return null;
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] !== "blog" || !parts[1]) return null;
    return settings.blogPosts.find((item) => item.slug === parts[1]) || null;
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

    ensureAccountNavigation();

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

    // Placeholder addresses such as https://instagram.com are hidden until a real profile is saved.
    const socialLinks = {
      Instagram: profileUrl(get("footer.socials.instagram")),
      Facebook: profileUrl(get("footer.socials.facebook")),
      Twitter: profileUrl(get("footer.socials.twitter")),
      Youtube: profileUrl(get("footer.socials.youtube")),
      Dribbble: "",
    };
    const groups = new Set();
    document.querySelectorAll("a").forEach((link) => {
      const label = normalizeText(link.textContent);
      if (!(label in socialLinks)) return;
      const url = socialLinks[label];
      const holder = link.parentElement && link.parentElement.childElementCount === 1 ? link.parentElement : link;
      const previous = holder.previousElementSibling && holder.previousElementSibling.querySelector("a");
      const duplicate = url && previous && previous.getAttribute("href") === url;
      if (url && !duplicate) {
        link.setAttribute("href", url);
        link.setAttribute("rel", "noopener me");
      }
      setHidden(holder, !url || duplicate);
      if (holder.parentElement) groups.add(holder.parentElement);
    });
    // With no profiles at all, the "Follow us" heading goes too.
    groups.forEach((list) => {
      const empty = Array.from(list.children).every((child) => child.style.display === "none");
      const title = list.previousElementSibling;
      if (title && !title.querySelector("a")) setHidden(title, empty);
    });
  }

  // Hide an element, and only ever undo a hide made here (Framer's own inline styles stay untouched).
  function setHidden(element, hidden) {
    if (hidden) {
      element.style.display = "none";
      element.dataset.lcHidden = "true";
    } else if (element.dataset.lcHidden) {
      element.style.display = "";
      delete element.dataset.lcHidden;
    }
  }

  function profileUrl(value) {
    try {
      const url = new URL(String(value || "").trim());
      return /^https?:$/.test(url.protocol) && url.pathname.replace(/\/+$/, "") ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function accountLink() {
    const link = document.createElement("a");
    link.className = "lc-account-nav";
    link.href = "/account";
    link.setAttribute("aria-label", "My account");
    link.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg><span>My account</span>';
    return link;
  }

  function ensureAccountNavigation() {
    if (!document.querySelector('link[href*="/account/nav.css"]')) {
      const style = document.createElement("link");
      style.rel = "stylesheet"; style.href = "/account/nav.css?v=2";
      document.head.appendChild(style);
    }
    // Framer outputs separate desktop, tablet and mobile header variants. Add the
    // link inside each variant so it follows the existing responsive menu.
    document.querySelectorAll(".framer-149q19i-container [data-framer-name='Links wrapper']").forEach((wrapper) => {
      if (wrapper.querySelector(".lc-account-nav")) return;
      const holder = document.createElement("div");
      holder.className = "lc-account-nav-container";
      holder.appendChild(accountLink());
      wrapper.appendChild(holder);
    });
    document.querySelectorAll(".site-header nav").forEach((nav) => {
      if (!nav.querySelector(".lc-account-nav")) nav.appendChild(accountLink());
    });
    // Clean up the temporary fixed link used before the account was integrated.
    document.querySelectorAll("body > #lc-account-link").forEach((link) => link.remove());
  }

  // Small renditions sit next to the originals: name-card.webp beside /assets/images/name.webp and beside
  // the large jacket photos (/assets/jackets/name.png). A missing file falls back via onerror.
  function cardImage(url) {
    if (/^\/assets\/images\/.+\.webp$/.test(url || "") && !/-card\.webp$/.test(url)) return url.replace(/\.webp$/, "-card.webp");
    if (/^\/assets\/jackets\/[a-z0-9-]+\.png$/.test(url || "")) return url.replace(/\.png$/, "-card.webp");
    return url;
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
    setCommunityProductImages();

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

  function setCommunityProductImages() {
    const products = (settings?.products || []).filter((product) => product.enabled !== false && product.image);
    if (!products.length) return;

    const images = Array.from(document.querySelectorAll("img")).filter((img) => communityImageAssetIds.has(assetId(img.getAttribute("src") || "")));
    images.forEach((img, index) => {
      const product = products[index % products.length];
      // Used by the performance scheduler: the real carousel can hydrate when a visitor
      // reaches it instead of making the hero compete with Framer's whole runtime.
      img.dataset.lcCommunityCarousel = "true";
      img.setAttribute("src", mediaUrl(cardImage(product.image)));
      img.removeAttribute("srcset");
      img.setAttribute("alt", product.alt || product.name);
      const link = img.closest("a");
      if (link) link.setAttribute("href", `/shop/${product.slug}`);
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

  // Every image gets alt text: the curated text for the template's assets, else the alt the static HTML
  // carried before Framer re-rendered it, else the label of the link or card around it.
  function applyImageAlts() {
    const brand = get("brand.name") || "LeatherCulture";
    document.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      const id = assetId(src);
      const curated = (id && imageAlts[id]) || (src.includes("/assets/brand/leather-culture-logo") ? brand : "");
      const alt = curated || ((img.getAttribute("alt") || "").trim() ? "" : (id && staticAlts.get(id)) || contextAlt(img));
      if (alt && img.getAttribute("alt") !== alt) img.setAttribute("alt", alt);
    });
  }

  function contextAlt(img) {
    const link = img.closest("a");
    const label = link && (link.getAttribute("aria-label") || link.getAttribute("data-brand"));
    if (label) return label;
    const heading = link && link.querySelector("h1, h2, h3, h4, h5, h6");
    return heading ? normalizeText(heading.textContent) : "";
  }

  function parsePrice(value) {
    const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  // The collection cards ship template prices ("$45.00"); show the live range of each collection instead.
  // The template's "Children's wear" card is used as a winter jackets card, so it covers jackets and coats.
  const collectionCards = [
    ["Men's wear", (product) => product.category === "men"],
    ["Women's wear", (product) => product.category === "women"],
    ["Children's wear", (product) => /jacket|coat/i.test(product.name || "")],
  ];

  function syncCollectionPrices() {
    if (!settings || !settings.products) return;
    const currency = get("checkout.currency") || "Rs";
    collectionCards.forEach(([name, includes]) => {
      const prices = settings.products
        .filter((product) => product.enabled !== false && includes(product))
        .map((product) => parsePrice(product.price))
        .filter(Boolean);
      if (!prices.length) return;
      const low = Math.min(...prices);
      const high = Math.max(...prices);
      document.querySelectorAll(`[data-framer-name="${name}"]`).forEach((card) => {
        if (name === "Children's wear" && !/jacket|coat/i.test(card.textContent || "")) return;
        const pricing = card.querySelector("[data-framer-name='Pricing']");
        if (!pricing) return;
        const [first, second] = pricing.querySelectorAll("p");
        const line = pricing.querySelector("[data-framer-name='Line']");
        const lowText = `${currency} ${low.toLocaleString("en-PK")}`;
        const highText = `${currency} ${high.toLocaleString("en-PK")}`;
        if (first && first.textContent !== lowText) first.textContent = lowText;
        if (second && second.textContent !== highText) second.textContent = highText;
        if (second) (second.closest("[data-framer-component-type='RichTextContainer']") || second).style.display = low === high ? "none" : "";
        if (line) line.style.display = low === high ? "none" : "";
      });
    });
  }

  // Privacy and terms links sit in the contact strip at the very bottom of every page (the build adds
  // them; this covers pages served without the build, such as local development).
  function ensureLegalLinks() {
    if (!document.body || document.querySelector("a[href='/privacy-policy']")) return;
    const strip = document.getElementById("lc-business-contact") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "lc-business-contact" }));
    strip.style.cssText = strip.style.cssText || "padding:20px;text-align:center;font:14px Arial,sans-serif";
    strip.insertAdjacentHTML("beforeend", `${strip.childNodes.length ? " · " : ""}<a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms &amp; Conditions</a>`);
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
    images.forEach(([img, large]) => {
      const original = large ? product.image : (variants[swatch++] || {}).image;
      const holder = img.closest("[data-framer-background-image-wrapper]") || img;
      if (!original) {
        if (!large) (holder.parentElement || holder).style.display = "none";
        return;
      }
      img.removeAttribute("srcset");
      setCardImage(img, original);
      img.setAttribute("alt", product.alt || product.name || "");
    });
  }

  // Point an image at the card rendition; if that file is missing, fall back to the original for good
  // (every apply pass re-runs this, so the failure is remembered instead of retried).
  function setCardImage(img, original) {
    const card = cardImage(original);
    const source = card === original || img.dataset.lcCardFailed === original ? original : card;
    if (source !== original) {
      img.onerror = () => {
        img.onerror = null;
        img.dataset.lcCardFailed = original;
        img.setAttribute("src", mediaUrl(original));
      };
    }
    if (img.getAttribute("src") !== mediaUrl(source)) img.setAttribute("src", mediaUrl(source));
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
    const cards = Array.from(document.querySelectorAll("a[href*='/shop/'], a[data-lc-template-slug][href='/shop']"))
      .map((link) => {
        const slug = link.dataset.lcTemplateSlug || (linkPath(link).match(/^\/shop\/([^/]+)$/) || [])[1];
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
    const groups = new Map();
    cards.forEach(([link, slug, , images]) => {
      const section = link.closest("section") || document.body;
      if (!groups.has(section)) {
        const shown = new Set(cards.filter(([card, key]) => (card.closest("section") || document.body) === section && products.has(key)).map(([, key]) => bySlug.get(key)?.slug || key));
        groups.set(section, { spare: live.filter(item => !shown.has(item.slug)), assigned: new Map() });
      }
      const { spare, assigned } = groups.get(section);
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
    document.querySelectorAll("a[href*='/blog/'], a[data-lc-template-slug][href='/blog']").forEach((link) => {
      const match = linkPath(link).match(/^\/blog\/([^/]+)$/);
      const slug = link.dataset.lcTemplateSlug || (match && match[1]);
      if (!slug) return;
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
      const category = texts.find(node => /^(Style guide|Leather care|Buying guide)$/i.test(normalizeText(node.textContent)));
      if (category) category.textContent = post.category || "Journal";
      const readTime = texts.find(node => /^\d+\s*min\s*read$/i.test(normalizeText(node.textContent)));
      if (readTime) readTime.textContent = post.readTime || "5 min read";
      if (post.coverImage) {
        link.querySelectorAll("img").forEach((img) => {
          img.removeAttribute("srcset");
          setCardImage(img, post.coverImage);
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
            if (product.image) setCardImage(img, product.image);
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
    if (!settings) return;
    if (settings.content?.values) settings.content.values["6f2c3442a7"] = "Quality checked";
    if (window.LeatherCultureCart) window.LeatherCultureCart.configure(settings);
    setLogoBrand();
    setPageMeta();
    replaceBoundText();
    applyPageContent();
    setLinksAndInputs();
    setImageData();
    setProductData();
    syncCatalogLinks();
    syncCollectionPrices();
    syncProductSchema();
    syncBusinessDetails();
    applyCustomerReviews();
  }

  function syncBusinessDetails() {
    if (currentProductFromPath()) replaceText(["Trusted Quality", "Genuine leather"], "Quality checked");
    const placeholders = { "test@gmail.com": "you@example.com", "+123 456 789 00": "Enter your phone number", "Nasir": "Your first name", "Nawaz": "Your last name", "Enquiry ....": "What can we help you with?" };
    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(node => {
      const value = placeholders[node.getAttribute("placeholder")];
      if (value) node.setAttribute("placeholder", value);
    });
    const policy = settings.checkout?.returnsPolicy?.trim() || "Contact info@leatherculture.shop for the current returns and exchange policy before ordering.";
    const phone = settings.footer?.phone || "";
    const placeholder = /234\s*567|123456789|3XX|XXXXX/i.test(phone);
    document.querySelectorAll("[data-lc-phone], a[href^='tel:']").forEach(node => {
      const label = phone && !placeholder ? phone : "Email our team";
      const text = node.querySelector("p") || node;
      if (text.textContent !== label) text.textContent = label;
      if (node.tagName === "A") {
        node.dataset.lcPhone = "true";
        node.href = phone && !placeholder ? `tel:${phone.replace(/[^+\d]/g, "")}` : `mailto:${settings.footer?.email || "info@leatherculture.shop"}`;
        node.setAttribute("aria-label", phone && !placeholder ? `Call LeatherCulture at ${phone}` : "Email our team at LeatherCulture");
        if (node.closest("footer")) {
          node.parentElement.dataset.lcPhoneRow = "true";
          node.parentElement.hidden = !phone || placeholder;
        }
      }
    });
    document.querySelectorAll("footer a[href^='mailto:'],footer a[href^='tel:'],footer a[href*='google.com/maps']").forEach(link => {
      if (!link.querySelector("svg")) return;
      link.classList.add("lc-contact-link");
      link.parentElement.classList.add("lc-contact-row");
      link.parentElement.parentElement.classList.add("lc-contact-list");
      link.parentElement.parentElement.parentElement.classList.add("lc-contact-column");
      link.parentElement.parentElement.parentElement.parentElement.classList.add("lc-contact-columns");
      const icon = link.querySelector("svg:has(use)");
      if (icon) {
        const kind = link.getAttribute("href").startsWith("mailto:") ? "email" : link.getAttribute("href").startsWith("tel:") ? "phone" : "location";
        const shapes = { email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>', phone: '<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z"/>', location: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>' };
        icon.setAttribute("class", "lc-contact-icon");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = shapes[kind];
      }
    });
    const product = currentProductFromPath();
    document.querySelectorAll("#faq details").forEach(detail => {
      const question = detail.querySelector("summary")?.textContent || "";
      const answer = detail.querySelector("p");
      if (!answer) return;
      let next = answer.textContent;
      if (/exchange|return|guaranteed/i.test(question)) next = policy;
      if (product && /care for/i.test(question)) next = product.care || "Contact our team for care instructions.";
      if (product && /made of/i.test(question)) next = product.material || "Contact our team for material details.";
      if (answer.textContent !== next) answer.textContent = next;
    });
    replaceText(["Change your mind? Return any item easily within thirty days.", "Wrong size? Exchange within 7 days of delivery, no questions asked.", "Contact info@leatherculture.shop for the current returns and exchange policy before ordering.", previousSettings?.checkout?.returnsPolicy], policy);
    document.querySelectorAll("script[type='application/ld+json']").forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        const nodes = data["@graph"] || [data];
        nodes.forEach(node => {
          if (node["@type"] === "FAQPage") node.mainEntity = Array.from(document.querySelectorAll("#faq details")).map(detail => ({ "@type": "Question", name: detail.querySelector("summary")?.textContent.trim(), acceptedAnswer: { "@type": "Answer", text: detail.querySelector("p")?.textContent.trim() } }));
          if (node["@type"] === "Product" && product) {
            node.offers.price = String(product.price || "").replace(/[^0-9.]/g, "");
            node.offers.priceCurrency = "PKR";
            delete node.offers.hasMerchantReturnPolicy;
          }
        });
        const updated = JSON.stringify(data);
        if (script.textContent !== updated) script.textContent = updated;
      } catch (_) { /* preserve unrecognized schema */ }
    });
  }

  /* ---------- customer reviews ---------- */

  // Reviews arrive only from the link emailed after a delivery, so anything shown
  // here belongs to a real order. Until one is approved the section keeps the
  // wording set in the admin.
  let customerReviews = null;

  async function loadCustomerReviews() {
    if (customerReviews || !document.querySelector("[data-framer-name='Reviews']")) return;
    try {
      const response = await fetch(apiUrl("/api/storefront/reviews"), { cache: "no-store" });
      if (!response.ok) return;
      customerReviews = await response.json();
      applyCustomerReviews();
    } catch (error) {
      /* the section keeps its admin copy */
    }
  }

  function applyCustomerReviews() {
    if (!Array.isArray(customerReviews) || !customerReviews.length) return;
    const review = customerReviews.find((item) => item.featured) || customerReviews[0];
    document.querySelectorAll("[data-framer-name='Reviews']").forEach((section) => {
      const quote = section.querySelector("[data-framer-name='Test wrapper'] [data-framer-component-type='RichTextContainer'] p");
      if (quote && quote.textContent.trim() !== review.text) quote.textContent = review.text;

      const lines = section.querySelectorAll("[data-framer-name='Profile info'] [data-framer-name='Text wrapper'] p");
      const where = review.city ? `Ordered from ${review.city}` : "Verified order";
      if (lines[0] && lines[0].textContent.trim() !== review.name) lines[0].textContent = review.name;
      if (lines[1] && lines[1].textContent.trim() !== where) lines[1].textContent = where;

      const pill = section.querySelector("[data-framer-name='Rating'] [data-framer-component-type='RichTextContainer'] p");
      const label = customerReviews.length > 1
        ? `${customerReviews.length} verified customer reviews`
        : "Verified customer review";
      if (pill && pill.textContent.trim() !== label) pill.textContent = label;
    });
  }

  async function loadSettings() {
    try {
      const response = await fetch(apiUrl("/api/storefront/settings"), { cache: "no-store", credentials: "include" });
      if (!response.ok) return;
      previousSettings = settings;
      settings = await response.json();
      apply();
      loadCustomerReviews();
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

  // Keep exactly one <h1> per page: on the homepage the phone hero starts as an H2 in
  // Framer's responsive markup, while product pages occasionally need their title promoted.
  // Never promote an arbitrary collection-card heading: that makes the next card skip from H1
  // to H3 for screen-reader users.
  function enforceSingleH1() {
    if (!document.body) return;
    let headings = Array.from(document.querySelectorAll("h1"));

    if (!headings.some(isRendered)) {
      const product = currentProductFromPath();
      const name = (product && product.name) || (productFallbacks[location.pathname.split("/").filter(Boolean)[1]] || {}).name;
      const heroCandidate = isHomePage
        ? Array.from(document.querySelectorAll("h2.framer-styles-preset-16abb0u")).find(isRendered)
        : null;
      const candidate = heroCandidate || (name && Array.from(document.querySelectorAll("h2, h3")).find((node) => {
        const text = (node.textContent || "").trim();
        return isRendered(node) && text === name;
      }));
      if (candidate) retag(candidate, "h1");
      headings = Array.from(document.querySelectorAll("h1"));
    }

    const primary = headings.find(isRendered) || headings[0];
    headings.forEach((node) => {
      if (node !== primary) retag(node, "h2");
    });
  }

  // Framer's components emit <h4> under <h2> sections (blog cards, newsletter), which skips a
  // heading level. Hydration rebuilds them, so this runs on every pass, not just on the static HTML.
  function enforceHeadingLevels() {
    document.querySelectorAll("h4, h5, h6").forEach((heading) => {
      const next = heading.tagName === "H4" ? "h3" : heading.tagName === "H5" ? "h4" : "h5";
      retag(heading, next);
    });
  }

  // Framer gives its animated announcement ticker role="group", which overrides the semantic
  // list role while its children remain <li>. Restore a real list after every hydration pass.
  function enforceTickerListSemantics() {
    document.querySelectorAll("ul[role='group']").forEach((list) => {
      if (Array.from(list.children).some((child) => child.matches("li.ticker-item"))) list.setAttribute("role", "list");
    });
  }

  // The answer section is authored after Framer's React root so hydration can't drop it;
  // with JS available we lift it above the footer where a FAQ belongs. Framer's recovery render
  // detaches it from there again, so every pass puts the same node back if it has gone.
  const answersSection = document.querySelector(".lc-answers");
  function placeAnswers() {
    if (!answersSection) return;
    const footer = document.querySelector("#main footer") || document.querySelector("footer");
    if (!footer || !footer.parentElement) {
      if (!answersSection.isConnected && document.body) document.body.appendChild(answersSection);
      return;
    }
    if (footer.contains(answersSection) || (answersSection.isConnected && answersSection.nextElementSibling === footer)) return;
    footer.parentElement.insertBefore(answersSection, footer);
  }

  // The template ships a "trusted by" strip of placeholder logos (logoipsum); hide it until
  // there are real partner logos to show.
  function hidePlaceholderLogos() {
    // The template ships logoipsum marquees. Hide the logo strip only -- never the
    // section around it, because the reviews block carries one of those logos.
    document.querySelectorAll("[data-framer-name='Logos wrapper'], [data-framer-name='Logos']").forEach((strip) => {
      strip.style.display = "none";
    });
    document.querySelectorAll("[data-framer-name='Logo']").forEach((wrap) => {
      if (wrap.querySelector("img")) wrap.style.display = "none";
    });
    // No stock portraits next to a customer review.
    document.querySelectorAll("[data-framer-name='Profile info'] > div").forEach((node) => {
      if (!node.hasAttribute("data-framer-name") && node.querySelector("img")) node.style.display = "none";
    });
  }

  function cleanVisibleBranding() {
    document.title = document.title.replace(/Framer Template/gi, "Premium Store");
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
      hidePlaceholderLogos();
      placeAnswers();
      enforceSingleH1();
      enforceHeadingLevels();
      enforceTickerListSemantics();
      document.querySelectorAll("nav[data-framer-name='Mobile']").forEach(mobileMenuControls);
      applySettings();
      applyImageAlts();
      ensureLegalLinks();
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
    beginHydrationMonitoring();
  }

  // The page is fully usable as static HTML. Framer's React/Motion bundle is intentionally not
  // loaded during an unattended homepage visit: requestIdleCallback is allowed to run immediately,
  // which previously made its multi-second hydration compete with LCP unpredictably.
  let runtimeScheduled = false;
  let hydrationRefreshes = 0;
  let hydrationRefreshQueued = false;
  let hydrationObserver = null;
  let settingsRefreshScheduled = false;

  function eventElement(event) {
    const target = event && event.target;
    return target instanceof Element ? target : target && target.parentElement;
  }

  function isMobileMenuEvent(event) {
    return Boolean(eventElement(event)?.closest("nav[data-framer-name='Mobile'] [data-framer-name='Menu']"));
  }

  function mobileMenuControls(nav, index) {
    const trigger = nav.querySelector("[data-framer-name='Menu']");
    const panel = nav.querySelector(".framer-yf8xve");
    if (!trigger || !panel) return null;
    const panelId = panel.id || `lc-mobile-navigation-${index + 1}`;
    panel.id = panelId;
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-controls", panelId);
    if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", trigger.getAttribute("aria-expanded") === "true" ? "Close navigation menu" : "Open navigation menu");
    return { trigger, panel };
  }

  function setupNativeMobileMenu() {
    document.querySelectorAll("nav[data-framer-name='Mobile']").forEach((nav, index) => {
      const controls = mobileMenuControls(nav, index);
      if (!controls || controls.trigger.dataset.lcNativeMenuBound) return;
      const { trigger, panel } = controls;
      trigger.dataset.lcNativeMenuBound = "true";

      const setOpen = (open) => {
        nav.classList.toggle("framer-v-174by37", !open);
        nav.classList.toggle("framer-v-1q6h91f", open);
        panel.style.opacity = open ? "1" : "0";
        panel.style.pointerEvents = open ? "auto" : "none";
        trigger.setAttribute("aria-expanded", String(open));
        trigger.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      };
      const toggle = (event) => {
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(trigger.getAttribute("aria-expanded") !== "true");
      };
      trigger.addEventListener("click", toggle);
      trigger.addEventListener("keydown", toggle);
      panel.addEventListener("click", (event) => {
        if (eventElement(event)?.closest("a[href]")) setOpen(false);
      });
      setOpen(false);
    });
  }

  function scheduleSettingsRefresh() {
    if (settingsRefreshScheduled) return;
    settingsRefreshScheduled = true;
    // Static build settings already make the homepage correct. Only ask the API for newer admin
    // content after a real interaction, when any visual update is no longer part of the load CLS.
    window.setTimeout(loadSettings, 1500);
  }

  function observeHomepageCarousel(start) {
    if (!isHomePage || !("IntersectionObserver" in window)) return;
    const carouselImage = document.querySelector("img[data-lc-community-carousel]");
    const target = carouselImage?.closest("section") || carouselImage?.parentElement;
    if (!target || target.dataset.lcRuntimeObserved) return;
    target.dataset.lcRuntimeObserved = "true";
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    }, { rootMargin: "320px 0px", threshold: 0.01 });
    observer.observe(target);
  }

  function scheduleFramerRuntime() {
    if (runtimeScheduled) return;
    runtimeScheduled = true;
    const start = (event) => {
      // The lightweight menu fallback below handles the first menu press itself. Loading Framer
      // here would swallow that press and make the menu feel broken on a slow phone.
      if (isMobileMenuEvent(event)) return;
      window.removeEventListener("pointerdown", start, true);
      window.removeEventListener("keydown", start, true);
      window.removeEventListener("touchstart", start, true);
      startFramerRuntime();
      scheduleSettingsRefresh();
    };
    // Do not use once:true: a menu press is intentionally handled by the native fallback and
    // must not consume the listener that will upgrade the page on the visitor's next action.
    window.addEventListener("pointerdown", start, { capture: true, passive: true });
    window.addEventListener("keydown", start, { capture: true });
    window.addEventListener("touchstart", start, { capture: true, passive: true });
    if (isHomePage) observeHomepageCarousel(start);
    else window.setTimeout(start, 15000);
  }

  function beginHydrationMonitoring() {
    if (hydrationObserver || !document.body) return;
    hydrationObserver = new MutationObserver(() => {
      // A hydration commit can replace Framer's server HTML. Repair it at most twice, instead of
      // running the complete DOM sweep for every ticker and carousel mutation forever.
      if (applying || hydrationRefreshQueued || hydrationRefreshes >= 2) return;
      hydrationRefreshQueued = true;
      window.requestAnimationFrame(() => {
        hydrationRefreshQueued = false;
        hydrationRefreshes += 1;
        apply();
      });
    });
    hydrationObserver.observe(document.querySelector("#main") || document.body, { childList: true, subtree: true });
    window.setTimeout(() => hydrationObserver?.disconnect(), 7000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    optimizeMedia();
    setLogoBrand();
    ensureAccountNavigation();
    setupNativeMobileMenu();
    apply();
    scheduleHeaderContrast();
  });
  window.addEventListener("load", () => {
    pageLoaded = true;
    scheduleFramerRuntime();
  });
  window.addEventListener("scroll", scheduleHeaderContrast, { passive: true });
  window.addEventListener("resize", scheduleHeaderContrast);
})();
