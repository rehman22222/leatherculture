"use strict";

// The public collection structure is deliberately product-led rather than gender-led.
// A category can be visible before it has stock, but only product-backed categories are
// indexable and added to the sitemap. Images are intentionally blank until the owner
// supplies approved category artwork through Admin.
const CATEGORY_CATALOG = [
  {
    id: "leather-jackets",
    name: "Leather Jackets",
    slug: "leather-jackets",
    description: "Explore LeatherCulture leather jackets for everyday layering and statement looks in Pakistan.",
    metaTitle: "Leather Jackets in Pakistan | LeatherCulture",
    metaDescription: "Browse LeatherCulture leather jackets in Pakistan. Compare current styles, photos and available sizes, then order online with cash on delivery.",
    keywords: "leather jackets Pakistan, leather jackets online Pakistan, LeatherCulture jackets",
    canonicalPath: "/collections/leather-jackets",
    image: "/assets/categories/leather-jackets.webp",
    alt: "Brown leather jacket displayed on a store rack",
    enabled: true,
    indexable: true,
    order: 10
  },
  {
    id: "leather-bags",
    name: "Leather Bags",
    slug: "leather-bags",
    description: "Leather bags for work, travel and everyday carry are coming to LeatherCulture.",
    metaTitle: "Leather Bags in Pakistan | LeatherCulture",
    metaDescription: "LeatherCulture leather bags are coming soon. Join the journey as new leather carry pieces arrive in Pakistan.",
    keywords: "leather bags Pakistan, leather tote bags Pakistan, leather laptop bags Pakistan",
    canonicalPath: "/collections/leather-bags",
    image: "/assets/categories/leather-bags.webp",
    alt: "Brown leather tote bag displayed with other bags on a shop shelf",
    enabled: true,
    // The product-count gate in categoryIsIndexable keeps an empty collection noindex;
    // this lets the page enter the sitemap automatically as soon as stock is added.
    indexable: true,
    order: 20
  },
  {
    id: "leather-shoes",
    name: "Leather Shoes",
    slug: "leather-shoes",
    description: "Leather shoes will join the LeatherCulture collection in a future release.",
    metaTitle: "Leather Shoes in Pakistan | LeatherCulture",
    metaDescription: "LeatherCulture leather shoes are coming soon. Check back for future footwear releases in Pakistan.",
    keywords: "leather shoes Pakistan, leather boots Pakistan, leather loafers Pakistan",
    canonicalPath: "/collections/leather-shoes",
    image: "/assets/categories/leather-shoes.webp",
    alt: "Leather shoes arranged on a wooden display shelf",
    enabled: true,
    indexable: true,
    order: 30
  },
  {
    id: "leather-accessories",
    name: "Leather Accessories",
    slug: "leather-accessories",
    description: "Leather wallets, belts and small accessories are planned for a future LeatherCulture release.",
    metaTitle: "Leather Accessories in Pakistan | LeatherCulture",
    metaDescription: "LeatherCulture accessories are coming soon. Discover future wallets, belts and everyday leather essentials in Pakistan.",
    keywords: "leather accessories Pakistan, leather wallets Pakistan, leather belts Pakistan",
    canonicalPath: "/collections/leather-accessories",
    image: "/assets/categories/leather-accessories.webp",
    alt: "Leather wallets, belts and keychains on a display table",
    enabled: true,
    indexable: true,
    order: 40
  }
];

const LEGACY_CATEGORY_IDS = new Set(["men", "women", "mens-wear", "womens-wear", "men's-wear", "women's-wear"]);

function text(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesCategory(item, category) {
  const value = text(item?.id || item?.slug);
  return value === category.id || value === category.slug;
}

function inferredCategory(product) {
  const assigned = text(product?.category);
  const direct = CATEGORY_CATALOG.find(category => category.id === assigned || category.slug === assigned);
  if (direct) return direct.id;

  const descriptor = `${product?.name || ""} ${product?.slug || ""} ${product?.category || ""}`.toLowerCase();
  if (/\b(wallet|belt|key\s*chain|card\s*holder|accessor)/.test(descriptor)) return "leather-accessories";
  if (/\b(shoe|boot|loafer|sandal|footwear)/.test(descriptor)) return "leather-shoes";
  if (/\b(bag|tote|satchel|duffel|briefcase|backpack|carry)/.test(descriptor)) return "leather-bags";
  if (LEGACY_CATEGORY_IDS.has(assigned) || /\b(jacket|coat|biker|bomber|racer)/.test(descriptor)) return "leather-jackets";
  return assigned || "leather-jackets";
}

function normalizeStoreCategories(settings) {
  const source = settings && typeof settings === "object" ? settings : {};
  const supplied = Array.isArray(source.categories) ? source.categories : [];
  const products = (Array.isArray(source.products) ? source.products : []).map(product => ({
    ...product,
    category: inferredCategory(product)
  }));
  const catalog = CATEGORY_CATALOG.map(category => {
    const saved = supplied.find(item => matchesCategory(item, category));
    // Only an explicitly matching record can replace a category's editorial/SEO fields.
    // Legacy men/women records must never turn Leather Jackets back into a gender category.
    return {
      ...category,
      ...(saved || {}),
      // A previously saved blank field must not hide the approved local category artwork.
      image: saved?.image || category.image,
      alt: saved?.alt || category.alt,
      id: category.id,
      slug: category.slug,
      canonicalPath: `/collections/${category.slug}`
    };
  });
  const extra = supplied.filter(item => {
    const id = text(item?.id || item?.slug);
    return id && !LEGACY_CATEGORY_IDS.has(id) && !CATEGORY_CATALOG.some(category => matchesCategory(item, category));
  });
  return {
    ...source,
    categories: [...catalog, ...extra].sort((a, b) => Number(a.order || 999) - Number(b.order || 999) || String(a.name).localeCompare(String(b.name))),
    products
  };
}

function productsForCategory(settings, category) {
  const id = typeof category === "string" ? category : category?.id;
  return (settings?.products || []).filter(product => product.enabled !== false && product.category === id);
}

function categoryIsIndexable(settings, category) {
  return category?.enabled !== false && category?.indexable !== false && productsForCategory(settings, category).length > 0;
}

module.exports = { CATEGORY_CATALOG, normalizeStoreCategories, productsForCategory, categoryIsIndexable, inferredCategory };
