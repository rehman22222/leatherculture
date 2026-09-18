require("dotenv").config({ quiet: true });

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");
const { URL } = require("url");

const root = __dirname;
const uploadDir = path.join(root, "assets", "uploads");
const port = Number(process.env.PORT || 8000);
const adminPassword = process.env.ADMIN_PASSWORD || "leatherculture123";
const mongoUri = cleanEnv(process.env.MONGODB_URI);
const mongoDbName = cleanEnv(process.env.MONGODB_DB_NAME) || "Leater-store";
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:8000,http://localhost:8001,http://127.0.0.1:8000,http://127.0.0.1:8001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const crossSiteCookies = process.env.CROSS_SITE_COOKIES === "true" || Boolean(process.env.RENDER);
const collectionNames = {
  settings: process.env.MONGODB_SETTINGS_COLLECTION || process.env.MONGODB_COLLECTION || "leater store",
  products: process.env.MONGODB_PRODUCTS_COLLECTION || "products",
  categories: process.env.MONGODB_CATEGORIES_COLLECTION || "categories",
  banners: process.env.MONGODB_BANNERS_COLLECTION || "banners",
  blogs: process.env.MONGODB_BLOGS_COLLECTION || "blogs",
  pages: process.env.MONGODB_PAGES_COLLECTION || "pages"
};
const settingsDocumentId = "storefront-settings";
const sessions = new Map();
const collections = {};
let dbReady = null;
let dbError = null;

function cleanEnv(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function startDbConnection() {
  dbError = null;
  dbReady = connectDb()
    .then(() => {
      dbError = null;
      console.log(`MongoDB: ${mongoDbName}`);
      console.log(`Collections: ${Object.values(collectionNames).join(", ")}`);
    })
    .catch((error) => {
      dbError = error;
      console.error(`MongoDB connection failed: ${error.message}`);
    });
  return dbReady;
}

async function ensureDbReady() {
  if (!dbReady || dbError) startDbConnection();
  await dbReady;
  if (dbError) throw dbError;
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".json": "application/json; charset=utf-8",
  ".framercms": "application/octet-stream",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4"
};

// Editable page text. Keys are stable hashes of the original template string; values live in the settings document.
const contentGroups = [
  {
    "id": "shared",
    "label": "Header & Footer (all pages)",
    "match": "all",
    "items": [
      {
        "key": "34e80a799d",
        "original": "Reviews"
      },
      {
        "key": "4c1c7d945f",
        "original": "Styles"
      },
      {
        "key": "55f015a0c5",
        "original": "Instagram"
      },
      {
        "key": "ff47f96514",
        "original": "Dribbble"
      },
      {
        "key": "d85544fce4",
        "original": "Facebook"
      },
      {
        "key": "2491bc9c7d",
        "original": "Twitter"
      },
      {
        "key": "970cfba66b",
        "original": "Youtube"
      },
      {
        "key": "95d3fa6b9e",
        "original": "Enter your email"
      },
      {
        "key": "c63bff7931",
        "original": "Connect with us on social media for a daily dose of fresh style, featuring exclusive looks from our community."
      },
      {
        "key": "4c6d274e55",
        "original": "See collections"
      },
      {
        "key": "0005f78117",
        "original": "Stay connected"
      }
    ]
  },
  {
    "id": "home",
    "label": "Home page",
    "match": "/",
    "items": [
      {
        "key": "8615658315",
        "original": "Urban"
      },
      {
        "key": "cd118d21c3",
        "original": "Latest"
      },
      {
        "key": "8d5e7e72f1",
        "original": "Premium"
      },
      {
        "key": "443531f5f0",
        "original": "Arctic"
      },
      {
        "key": "28d5d53226",
        "original": "Casual"
      },
      {
        "key": "b611bdd463",
        "original": "Iconic"
      },
      {
        "key": "d019979a29",
        "original": "Unique"
      },
      {
        "key": "01f7ac959c",
        "original": "Best sellers"
      },
      {
        "key": "34b5e3cde7",
        "original": "Best seller"
      },
      {
        "key": "66cc173fc2",
        "original": "Since 2014"
      },
      {
        "key": "3bd32ddc06",
        "original": "A decade ago, we set out to redefine the modern silhouette. Today, we merge urban utility with high-end aesthetics in a resilient, beautiful collection."
      },
      {
        "key": "997d8c85e7",
        "original": "More about us"
      },
      {
        "key": "1267031ac2",
        "original": "Our Collections"
      },
      {
        "key": "03c2e7e41f",
        "original": "New"
      },
      {
        "key": "5113789698",
        "original": "Mens's wear"
      },
      {
        "key": "06b63c0aa1",
        "original": "Premium modern collection for men"
      },
      {
        "key": "c6f683ca7a",
        "original": "Upgrade your daily look with our crafted pieces made from the finest fabrics for lasting comfort and timeless style."
      },
      {
        "key": "f444c76c25",
        "original": "Pricing start from:"
      },
      {
        "key": "de20253201",
        "original": "All collections"
      },
      {
        "key": "3c8ef50877",
        "original": "Women's wear"
      },
      {
        "key": "56dd1459c4",
        "original": "Modern daily wear for women"
      },
      {
        "key": "7f99e12635",
        "original": "Elevate your style with our signature soft pieces designed to make every single day feel truly fresh and special."
      },
      {
        "key": "7449432039",
        "original": "$35.00"
      },
      {
        "key": "45e46c84ff",
        "original": "$150.00"
      },
      {
        "key": "c92a103243",
        "original": "2026"
      },
      {
        "key": "8380411ba3",
        "original": "Children's wear"
      },
      {
        "key": "3dcb85ac85",
        "original": "Modern easy styles for children"
      },
      {
        "key": "70c2143eb1",
        "original": "Provide your children with the best soft touch gear made for play & long lasting wear throughout every single busy day."
      },
      {
        "key": "c18676ceb7",
        "original": "$25.00"
      },
      {
        "key": "580606daf1",
        "original": "Customer reviews"
      },
      {
        "key": "ba2f793616",
        "original": "Experience the difference through the words of customers who value premium fabrics and timeless design."
      },
      {
        "key": "9f3ba3723d",
        "original": "The premium quality of the men's collection is truly unmatched lately. The fabrics feel incredibly premium and soft. This specific tailored fit is perfect for my busy office. A very sharp look. I love it every day."
      },
      {
        "key": "cd445c0f4b",
        "original": "James Carter"
      },
      {
        "key": "6901e85410",
        "original": "Creative Director"
      },
      {
        "key": "40bdad82a0",
        "original": "4.9/5 from 1k+ reviews"
      },
      {
        "key": "90e9aee824",
        "original": "Wearix Voice"
      },
      {
        "key": "3a5c25d6f6",
        "original": "Read all blogs"
      },
      {
        "key": "aec7b47248",
        "original": "Style Guide"
      },
      {
        "key": "1eabdc7fcc",
        "original": "How to master the art of minimal street style"
      },
      {
        "key": "eb55f9110c",
        "original": "Build a timeless, comfortable wardrobe with high-quality fabrics, muted tones, and effortless oversized fits."
      },
      {
        "key": "01a9edbc37",
        "original": "Fashion Tips"
      },
      {
        "key": "3f439d4262",
        "original": "Elevate everyday outfits using modern minimalist styling"
      },
      {
        "key": "51d4e1a476",
        "original": "Build a capsule wardrobe that works year round"
      }
    ]
  },
  {
    "id": "shop",
    "label": "Shop page",
    "match": "/shop",
    "items": [
      {
        "key": "92b6e6ddf1",
        "original": "The new season"
      },
      {
        "key": "bc18ec4c5b",
        "original": "Elevate your daily wardrobe with ease"
      },
      {
        "key": "d1fe76475f",
        "original": "Explore our handpicked modern silhouettes crafted from the world's most sustainable fabrics."
      },
      {
        "key": "e3f261695e",
        "original": "Explore stories"
      },
      {
        "key": "cf23ee2798",
        "original": "About us"
      }
    ]
  },
  {
    "id": "about",
    "label": "About page",
    "match": "/about",
    "items": [
      {
        "key": "1278166ebd",
        "original": "Know about Wearix"
      },
      {
        "key": "bbbe6da011",
        "original": "Timeless design, modern wearability"
      },
      {
        "key": "553ddfe257",
        "original": "We focus on creating essential garments that remain relevant, functional, and refined across seasons."
      },
      {
        "key": "0b9e9037d5",
        "original": "Browse collections"
      },
      {
        "key": "cf23ee2798",
        "original": "About us"
      },
      {
        "key": "8823b9751c",
        "original": "4.9/5 rating"
      },
      {
        "key": "c45bc9e4f1",
        "original": "Trusted by 1k+ businesses"
      },
      {
        "key": "a3a0349bb9",
        "original": "About Wearix"
      },
      {
        "key": "6fdef98b49",
        "original": "More than fashion, Wearix is a commitment to intentional design. Our curated collections focus on sleek silhouettes, empowering your unique and personal journey with modern ease."
      },
      {
        "key": "5f3940e0d1",
        "original": "10M+"
      },
      {
        "key": "79e77f001d",
        "original": "Pieces worn daily"
      },
      {
        "key": "2f2a93e35c",
        "original": "98%"
      },
      {
        "key": "c2af71c447",
        "original": "Customer Satisfaction"
      },
      {
        "key": "f79134598f",
        "original": "300+"
      },
      {
        "key": "a9c5b0c97d",
        "original": "Essential Styles"
      },
      {
        "key": "fd7f9240e2",
        "original": "500K+"
      },
      {
        "key": "ea9889f0eb",
        "original": "Community worldwide"
      }
    ]
  },
  {
    "id": "blog",
    "label": "Blog page",
    "match": "/blog",
    "items": [
      {
        "key": "45217aeda3",
        "original": "Read our stories"
      },
      {
        "key": "9888185425",
        "original": "The craft behind every single stitch"
      },
      {
        "key": "0a30b7e698",
        "original": "Discover the detailed process of creating premium garments from our sustainable materials."
      },
      {
        "key": "0b9e9037d5",
        "original": "Browse collections"
      },
      {
        "key": "cf23ee2798",
        "original": "About us"
      },
      {
        "key": "3a40393678",
        "original": "All Blogs"
      },
      {
        "key": "aec7b47248",
        "original": "Style Guide"
      },
      {
        "key": "01a9edbc37",
        "original": "Fashion Tips"
      },
      {
        "key": "031d4abe04",
        "original": "Brand Stories"
      },
      {
        "key": "1eabdc7fcc",
        "original": "How to master the art of minimal street style"
      },
      {
        "key": "eb55f9110c",
        "original": "Build a timeless, comfortable wardrobe with high-quality fabrics, muted tones, and effortless oversized fits."
      },
      {
        "key": "3f439d4262",
        "original": "Elevate everyday outfits using modern minimalist styling"
      },
      {
        "key": "51d4e1a476",
        "original": "Build a capsule wardrobe that works year round"
      },
      {
        "key": "363b47feb7",
        "original": "Refine casual streetwear with thoughtful styling choices"
      },
      {
        "key": "c6374a4e3f",
        "original": "Style outfits confidently using seasonal color palettes"
      },
      {
        "key": "d8f28afdb0",
        "original": "Discover timeless essentials that shape modern wardrobes"
      },
      {
        "key": "0fbbe73d2a",
        "original": "Build a strong fashion identity through consistency"
      },
      {
        "key": "971cd34432",
        "original": "Design intentional outfits that feel effortless daily"
      },
      {
        "key": "17c94bfc18",
        "original": "Use texture to elevate everyday outfit styling"
      }
    ]
  },
  {
    "id": "contact",
    "label": "Contact page",
    "match": "/contact",
    "items": [
      {
        "key": "5d5d07bda3",
        "original": "Here to help you"
      },
      {
        "key": "f55d05e629",
        "original": "Helping you define your personal style"
      },
      {
        "key": "ce876a6ea1",
        "original": "Contact us today for refined service designed for our discerning Wearix fashion community."
      },
      {
        "key": "0b9e9037d5",
        "original": "Browse collections"
      },
      {
        "key": "cf23ee2798",
        "original": "About us"
      },
      {
        "key": "643a860f99",
        "original": "Email Address"
      },
      {
        "key": "1e4dbc7eaa",
        "original": "Phone Number"
      },
      {
        "key": "b3551febf4",
        "original": "England, London"
      },
      {
        "key": "ce5bf55137",
        "original": "Location"
      },
      {
        "key": "bc910f8bdf",
        "original": "First Name"
      },
      {
        "key": "77587239bf",
        "original": "Last Name"
      },
      {
        "key": "ce8ae9da5b",
        "original": "Email"
      },
      {
        "key": "57887c3861",
        "original": "Phone No"
      },
      {
        "key": "c7892ebbb1",
        "original": "Subject"
      },
      {
        "key": "4c2a8fe7ea",
        "original": "Message"
      },
      {
        "key": "1432f32780",
        "original": "Send Message"
      },
      {
        "key": "d61d599737",
        "original": "Nasir"
      },
      {
        "key": "689b095728",
        "original": "Nawaz"
      },
      {
        "key": "86a1f4d3c7",
        "original": "+123 456 789 00"
      },
      {
        "key": "3aa676c63e",
        "original": "Enquiry ...."
      },
      {
        "key": "b1ca38fadc",
        "original": "Enter message here..."
      }
    ]
  },
  {
    "id": "product",
    "label": "Product page (template)",
    "match": "/shop/*",
    "items": [
      {
        "key": "03c2e7e41f",
        "original": "New"
      },
      {
        "key": "ceda7c15d4",
        "original": "Order Now"
      },
      {
        "key": "d92a8333dd",
        "original": "Material"
      },
      {
        "key": "6bc43cc153",
        "original": "Care"
      },
      {
        "key": "b10f0c75b7",
        "original": "Warranty"
      },
      {
        "key": "6f2c3442a7",
        "original": "Trusted Quality"
      },
      {
        "key": "aa4a627f41",
        "original": "very piece is checked to ensure it meets our standards."
      },
      {
        "key": "f948050d6e",
        "original": "Real Time Tracking"
      },
      {
        "key": "b824694988",
        "original": "Get live updates from our warehouse to your doorstep."
      },
      {
        "key": "d4df78f9eb",
        "original": "Secure Payments"
      },
      {
        "key": "c6560072ea",
        "original": "Shop confidently with our secure, encrypted checkout."
      },
      {
        "key": "c7e3c65d0e",
        "original": "Easy Returns"
      },
      {
        "key": "a496f4bd68",
        "original": "Change your mind? Return any item easily within thirty days."
      }
    ]
  }
];

const defaultSettings = {
  content: { groups: contentGroups, values: {} },
  brand: {
    name: "LeatherCulture",
    title: "LeatherCulture - Premium Leather Store",
    description: "Premium leather and modern clothing storefront for refined everyday style."
  },
  announcement: {
    enabled: true,
    text: "Black friday sale 50% off"
  },
  header: {
    shopButton: "Shop all items",
    nav: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Shop", href: "/shop" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" }
    ]
  },
  hero: {
    tag: "Soft",
    eyebrow: "Warm Winter Layers",
    title: "Premium wear for modern living",
    subtitle: "Discover our new range of soft clothes made for your daily look and your best days with the finest fabrics.",
    primaryCta: "See all collections",
    secondaryCta: "Contact us",
    backgroundImage: "",
    backgroundAlt: "Model wearing a black leather coat",
    images: [
      {
        id: "hero-main",
        label: "Main hero image",
        image: "/assets/images/premium-wear-for-modern-living-3.jpg",
        alt: "Model wearing a black leather jacket",
        enabled: true
      },
      {
        id: "hero-thumb-women",
        label: "Women style thumbnail",
        image: "/assets/images/woman-in-greenish-shirt-3.jpg",
        alt: "Woman wearing a green shirt",
        enabled: true
      },
      {
        id: "hero-thumb-blue",
        label: "Blue shirt thumbnail",
        image: "/assets/images/blue-t-shirt-3.png",
        alt: "Blue shirt product styling",
        enabled: true
      },
      {
        id: "hero-thumb-hoodie",
        label: "Hoodie thumbnail",
        image: "/assets/images/boy-in-black-hoodie-1.png",
        alt: "Model wearing a black hoodie",
        enabled: true
      },
      {
        id: "hero-thumb-puffer",
        label: "Puffer thumbnail",
        image: "/assets/images/hooded-puffer-vest-1.png",
        alt: "Puffer vest product styling",
        enabled: true
      },
      {
        id: "hero-thumb-shirt",
        label: "Black shirt thumbnail",
        image: "/assets/images/man-having-tatto-on-neck.png",
        alt: "Man wearing a black shirt",
        enabled: true
      },
      {
        id: "hero-thumb-brown",
        label: "Brown jacket thumbnail",
        image: "/assets/images/shot-of-the-person-s-legs-wearing-the-brownish-pai-1.png",
        alt: "Brown leather styling detail",
        enabled: true
      }
    ]
  },
  sections: {
    bestSellers: {
      kicker: "New Collection",
      title: "Our signature best selling pieces",
      button: "View all items"
    },
    video: {
      tag: "Style video",
      title: "Defining modern style",
      subtitle: "Minimal layers, confident proportions, and tactile textures made for daily luxury.",
      primaryCta: "Shop this look",
      secondaryCta: "Our story"
    },
    collections: {
      kicker: "Collection",
      title: "Modern collections defined by simplicity",
      button: "View all"
    },
    testimonials: {
      kicker: "Testimonials",
      title: "The voice of quality",
      subtitle: "Real words from customers, stylists, and buyers who trust LeatherCulture."
    },
    blogs: {
      kicker: "Our Journal",
      title: "Elevating your daily style journey",
      button: "All blogs"
    },
    community: {
      kicker: "Our community",
      title: "See our community in modern silhouettes",
      button: "Explore community"
    }
  },
  footer: {
    newsletterHeading: "Subscribe to our news letter",
    newsletterPlaceholder: "Enter your email",
    newsletterButton: "Subscribe",
    description: "A sophisticated e-commerce template designed for modern and minimalist brands.",
    contactButton: "Contact LeatherCulture",
    quickLinksTitle: "Quick Links",
    followTitle: "Follow us:",
    getInTouchTitle: "Get in touch",
    email: "hello@leatherculture.com",
    phone: "+001 234 567 890",
    address: "London, England",
    socials: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      twitter: "https://x.com",
      youtube: "https://youtube.com"
    }
  },
  pages: [
    {
      id: "home",
      name: "Home",
      slug: "",
      path: "/",
      heading: "Premium wear for modern living",
      excerpt: "Premium leather jackets, coats, and modern wardrobe pieces in Pakistan.",
      metaTitle: "LeatherCulture Pakistan | Premium Leather Jackets & Modern Wear",
      metaDescription: "Shop premium leather jackets, coats, and modern men's and women's wear in Pakistan from LeatherCulture.",
      keywords: "leather jackets Pakistan, premium leather wear, men's leather jackets, women's leather jackets",
      canonicalPath: "/",
      enabled: true
    },
    {
      id: "shop",
      name: "Shop",
      slug: "shop",
      path: "/shop",
      heading: "Shop LeatherCulture",
      excerpt: "Explore premium leather and modern wear for men and women.",
      metaTitle: "Shop Leather Jackets & Modern Wear in Pakistan | LeatherCulture",
      metaDescription: "Browse LeatherCulture products including leather jackets, coats, shirts, tees, and trousers for Pakistan.",
      keywords: "buy leather jackets online Pakistan, leather coats Pakistan, modern clothing Pakistan",
      canonicalPath: "/shop",
      enabled: true
    },
    {
      id: "about",
      name: "About",
      slug: "about",
      path: "/about",
      heading: "About LeatherCulture",
      excerpt: "A Pakistan-focused premium leather and lifestyle store.",
      metaTitle: "About LeatherCulture | Premium Leather Store Pakistan",
      metaDescription: "Learn about LeatherCulture, a premium leather and modern clothing store for customers in Pakistan.",
      keywords: "LeatherCulture Pakistan, leather store Pakistan, premium clothing Pakistan",
      canonicalPath: "/about",
      enabled: true
    },
    {
      id: "blog",
      name: "Blog",
      slug: "blog",
      path: "/blog",
      heading: "LeatherCulture Journal",
      excerpt: "Style guides, leather care tips, and outfit ideas for Pakistan.",
      metaTitle: "Leather Style Blog Pakistan | LeatherCulture Journal",
      metaDescription: "Read LeatherCulture style guides, leather care tips, and modern outfit ideas for Pakistan.",
      keywords: "leather care Pakistan, leather jacket style, Pakistan fashion blog",
      canonicalPath: "/blog",
      enabled: true
    },
    {
      id: "contact",
      name: "Contact",
      slug: "contact",
      path: "/contact",
      heading: "Contact LeatherCulture",
      excerpt: "Get support, product information, and order help.",
      metaTitle: "Contact LeatherCulture Pakistan",
      metaDescription: "Contact LeatherCulture for product details, leather jacket sizing, and order support in Pakistan.",
      keywords: "LeatherCulture contact, leather jacket support Pakistan",
      canonicalPath: "/contact",
      enabled: true
    }
  ],
  banners: [
    {
      id: "main-sale",
      label: "Main Sale Banner",
      title: "Black friday sale 50% off",
      image: "",
      alt: "LeatherCulture promotional banner",
      href: "/shop",
      enabled: true
    }
  ],
  categories: [
    {
      id: "men",
      name: "Men's Wear",
      slug: "mens-wear",
      description: "Modern pieces for men.",
      metaTitle: "Men's Leather Jackets & Modern Wear Pakistan | LeatherCulture",
      metaDescription: "Shop men's leather jackets, shirts, hoodies, and modern wardrobe pieces in Pakistan.",
      keywords: "men leather jackets Pakistan, men's wear Pakistan, leather fashion Pakistan",
      image: "/assets/images/young-man-in-black-leather-double-breasted-jacket--1.png",
      alt: "Man wearing a black leather jacket",
      enabled: true
    },
    {
      id: "women",
      name: "Women's Wear",
      slug: "womens-wear",
      description: "Modern pieces for women.",
      metaTitle: "Women's Leather Jackets & Modern Wear Pakistan | LeatherCulture",
      metaDescription: "Shop women's leather jackets, coats, trousers, and modern clothing in Pakistan.",
      keywords: "women leather jackets Pakistan, women's wear Pakistan, leather coats Pakistan",
      image: "/assets/images/woman-in-black-jacket-1.png",
      alt: "Woman wearing a black jacket",
      enabled: true
    }
  ],
  products: [
    {
      id: "structured-trench-coat",
      name: "Structured Trench Coat",
      slug: "structured-trench-coat",
      category: "women",
      price: "$220.00",
      badge: "Best seller",
      description: "A refined structured trench coat for premium everyday layering in Pakistan.",
      metaTitle: "Structured Trench Coat Pakistan | LeatherCulture",
      metaDescription: "Buy the Structured Trench Coat from LeatherCulture Pakistan, designed for refined everyday layering.",
      keywords: "structured trench coat Pakistan, women's trench coat, LeatherCulture coat",
      image: "/assets/images/structured-trench-coat-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Structured trench coat product photo",
      enabled: true,
      variants: [
        { id: "black", name: "Black", color: "#111111", sku: "LC-STC-BLK", stock: 12, image: "/assets/images/structured-trench-coat-1.jpg", alt: "Black structured trench coat", enabled: true },
        { id: "sand", name: "Sand", color: "#c5aa86", sku: "LC-STC-SND", stock: 8, image: "/assets/images/structured-trench-coat-2.jpg", alt: "Sand structured trench coat", enabled: true }
      ]
    },
    {
      id: "heavyweight-oversized-hoodie",
      name: "Heavyweight Oversized Hoodie",
      slug: "heavyweight-oversized-hoodie",
      category: "men",
      price: "$180.00",
      badge: "Best seller",
      description: "A heavyweight oversized hoodie with a premium relaxed silhouette.",
      metaTitle: "Heavyweight Oversized Hoodie Pakistan | LeatherCulture",
      metaDescription: "Shop a premium heavyweight oversized hoodie for men in Pakistan from LeatherCulture.",
      keywords: "oversized hoodie Pakistan, heavyweight hoodie, men's hoodie Pakistan",
      image: "/assets/images/heavyweight-oversized-hoodie-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Heavyweight oversized hoodie product photo",
      enabled: true,
      variants: [
        { id: "black", name: "Black", color: "#111111", sku: "LC-HOH-BLK", stock: 15, image: "/assets/images/heavyweight-oversized-hoodie-1.jpg", alt: "Black heavyweight oversized hoodie", enabled: true },
        { id: "grey", name: "Grey", color: "#8b8c8f", sku: "LC-HOH-GRY", stock: 10, image: "/assets/images/heavyweight-oversized-hoodie-2.jpg", alt: "Grey heavyweight oversized hoodie", enabled: true }
      ]
    },
    {
      id: "pleated-smart-trousers",
      name: "Pleated Smart Trousers",
      slug: "pleated-smart-trousers",
      category: "women",
      price: "$160.00",
      badge: "New",
      description: "Pleated smart trousers with clean tailoring for daily styling.",
      metaTitle: "Pleated Smart Trousers Pakistan | LeatherCulture",
      metaDescription: "Shop pleated smart trousers in Pakistan from LeatherCulture for polished everyday looks.",
      keywords: "pleated trousers Pakistan, smart trousers women, LeatherCulture trousers",
      image: "/assets/images/pleated-smart-trousers-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Pleated smart trousers product photo",
      enabled: true,
      variants: [
        { id: "black", name: "Black", color: "#111111", sku: "LC-PST-BLK", stock: 9, image: "/assets/images/pleated-smart-trousers-1.jpg", alt: "Black pleated smart trousers", enabled: true },
        { id: "stone", name: "Stone", color: "#d6cab7", sku: "LC-PST-STN", stock: 11, image: "/assets/images/pleated-smart-trousers-2.jpg", alt: "Stone pleated smart trousers", enabled: true }
      ]
    },
    {
      id: "riviera-collar-shirt",
      name: "Riviera Collar Shirt",
      slug: "riviera-collar-shirt",
      category: "men",
      price: "$145.00",
      badge: "New",
      description: "A riviera collar shirt with soft texture and refined casual styling.",
      metaTitle: "Riviera Collar Shirt Pakistan | LeatherCulture",
      metaDescription: "Buy the Riviera Collar Shirt in Pakistan from LeatherCulture, a refined casual shirt for men.",
      keywords: "riviera collar shirt Pakistan, men's summer shirt, premium shirt Pakistan",
      image: "/assets/images/riviera-collar-shirt-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Riviera collar shirt product photo",
      enabled: true,
      variants: [
        { id: "sand", name: "Sand", color: "#d2b783", sku: "LC-RCS-SND", stock: 18, image: "/assets/images/riviera-collar-shirt-1.jpg", alt: "Sand riviera collar shirt", enabled: true },
        { id: "blue", name: "Blue", color: "#64748b", sku: "LC-RCS-BLU", stock: 7, image: "/assets/images/riviera-collar-shirt-2.jpg", alt: "Blue riviera collar shirt", enabled: true }
      ]
    },
    {
      id: "classic-boxy-tee",
      name: "Classic Boxy Tee",
      slug: "classic-boxy-tee",
      category: "men",
      price: "$90.00",
      badge: "New",
      description: "A clean classic boxy tee made for effortless daily wear.",
      metaTitle: "Classic Boxy Tee Pakistan | LeatherCulture",
      metaDescription: "Shop the Classic Boxy Tee in Pakistan from LeatherCulture for clean everyday styling.",
      keywords: "boxy tee Pakistan, classic t shirt Pakistan, men's tee Pakistan",
      image: "/assets/images/classic-boxy-tee-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Classic boxy tee product photo",
      enabled: true,
      variants: [
        { id: "white", name: "White", color: "#f5f3ee", sku: "LC-CBT-WHT", stock: 22, image: "/assets/images/classic-boxy-tee-1.jpg", alt: "White classic boxy tee", enabled: true },
        { id: "black", name: "Black", color: "#111111", sku: "LC-CBT-BLK", stock: 16, image: "/assets/images/classic-boxy-tee-2.jpg", alt: "Black classic boxy tee", enabled: true }
      ]
    },
    {
      id: "stretch-jersey-tee",
      name: "Stretch Jersey Tee",
      slug: "stretch-jersey-tee",
      category: "men",
      price: "$85.00",
      badge: "",
      description: "A soft stretch jersey tee for comfortable daily movement.",
      metaTitle: "Stretch Jersey Tee Pakistan | LeatherCulture",
      metaDescription: "Buy a premium stretch jersey tee in Pakistan from LeatherCulture.",
      keywords: "stretch jersey tee Pakistan, premium t shirt Pakistan",
      image: "/assets/images/stretch-jersey-tee-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Stretch jersey tee product photo",
      enabled: true,
      variants: [
        { id: "white", name: "White", color: "#f7f7f5", sku: "LC-SJT-WHT", stock: 14, image: "/assets/images/stretch-jersey-tee-1.jpg", alt: "White stretch jersey tee", enabled: true },
        { id: "charcoal", name: "Charcoal", color: "#333333", sku: "LC-SJT-CHR", stock: 13, image: "/assets/images/stretch-jersey-tee-2.jpg", alt: "Charcoal stretch jersey tee", enabled: true }
      ]
    },
    {
      id: "urban-utility-cargo",
      name: "Urban Utility Cargo",
      slug: "urban-utility-cargo",
      category: "men",
      price: "$135.00",
      badge: "",
      description: "Utility cargo styling with a modern relaxed fit.",
      metaTitle: "Urban Utility Cargo Pakistan | LeatherCulture",
      metaDescription: "Shop Urban Utility Cargo pants in Pakistan from LeatherCulture for modern daily style.",
      keywords: "cargo pants Pakistan, utility cargo Pakistan, men's cargo pants",
      image: "/assets/images/urban-utility-cargo-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Urban utility cargo product photo",
      enabled: true,
      variants: [
        { id: "olive", name: "Olive", color: "#55604b", sku: "LC-UUC-OLV", stock: 12, image: "/assets/images/urban-utility-cargo-1.jpg", alt: "Olive urban utility cargo", enabled: true },
        { id: "black", name: "Black", color: "#111111", sku: "LC-UUC-BLK", stock: 8, image: "/assets/images/urban-utility-cargo-2.jpg", alt: "Black urban utility cargo", enabled: true }
      ]
    },
    {
      id: "textured-knitted-shirt",
      name: "Textured Knitted Shirt",
      slug: "textured-knitted-shirt",
      category: "women",
      price: "$115.00",
      badge: "",
      description: "A textured knitted shirt with a soft hand feel and easy styling.",
      metaTitle: "Textured Knitted Shirt Pakistan | LeatherCulture",
      metaDescription: "Shop the Textured Knitted Shirt in Pakistan from LeatherCulture for refined everyday wear.",
      keywords: "knitted shirt Pakistan, textured shirt women, premium shirt Pakistan",
      image: "/assets/images/textured-knitted-shirt-1.jpg",
      compareAtPrice: "",
      material: "",
      care: "",
      warranty: "",
      alt: "Textured knitted shirt product photo",
      enabled: true,
      variants: [
        { id: "cream", name: "Cream", color: "#e5d8c1", sku: "LC-TKS-CRM", stock: 10, image: "/assets/images/textured-knitted-shirt-1.jpg", alt: "Cream textured knitted shirt", enabled: true },
        { id: "black", name: "Black", color: "#111111", sku: "LC-TKS-BLK", stock: 6, image: "/assets/images/textured-knitted-shirt-2.jpg", alt: "Black textured knitted shirt", enabled: true }
      ]
    }
  ],
  blogPosts: [
    {
      id: "minimal-street-style",
      title: "How to master the art of minimal street style",
      slug: "minimal-street-style",
      excerpt: "Clean silhouettes, leather textures, and daily styling notes.",
      metaTitle: "Minimal Street Style Guide Pakistan | LeatherCulture",
      metaDescription: "Learn how to style minimal leather and modern outfits in Pakistan with LeatherCulture.",
      keywords: "minimal street style Pakistan, leather jacket styling, Pakistan fashion tips",
      body: "<p>Write your full blog post here. Use headings, lists, and formatted text from the editor.</p>",
      author: "LeatherCulture",
      date: "2026-09-14",
      coverImage: "/assets/images/woman-in-minimalist-setting.jpeg",
      coverAlt: "Minimal street style outfit",
      status: "published"
    }
  ]
};

function mergeDefaults(source, defaults) {
  if (Array.isArray(defaults)) return Array.isArray(source) ? source : defaults;
  if (!defaults || typeof defaults !== "object") return source ?? defaults;
  const output = { ...defaults, ...(source && typeof source === "object" ? source : {}) };
  for (const key of Object.keys(defaults)) {
    output[key] = mergeDefaults(output[key], defaults[key]);
  }
  return output;
}

function publicSettings(document) {
  const { _id, createdAt, updatedAt, order, ...settings } = document || {};
  const merged = mergeDefaults(settings, defaultSettings);
  merged.content = { groups: contentGroups, values: (settings.content && settings.content.values) || {} };
  return merged;
}

function publicRecord(document) {
  const { _id, createdAt, updatedAt, order, ...record } = document || {};
  return record;
}

function settingsOnly(source) {
  const { pages, banners, categories, products, blogPosts, _id, createdAt, updatedAt, ...settings } = source || {};
  return settings;
}

async function readSettings() {
  const document = await collections.settings.findOne({ _id: settingsDocumentId });
  const settings = publicSettings(document);
  const [pages, banners, categories, products, blogPosts] = await Promise.all([
    collections.pages.find({}).sort({ order: 1, name: 1 }).toArray(),
    collections.banners.find({}).sort({ order: 1, title: 1 }).toArray(),
    collections.categories.find({}).sort({ order: 1, name: 1 }).toArray(),
    collections.products.find({}).sort({ order: 1, name: 1 }).toArray(),
    collections.blogs.find({}).sort({ order: 1, date: -1 }).toArray()
  ]);

  return {
    ...settingsOnly(settings),
    pages: pages.map(publicRecord),
    banners: banners.map(publicRecord),
    categories: categories.map(publicRecord),
    products: products.map(publicRecord),
    blogPosts: blogPosts.map(publicRecord)
  };
}

async function writeSettings(next) {
  const merged = normalizeStoreData(mergeDefaults(next, defaultSettings));
  merged.content = { values: Object.fromEntries(Object.entries((merged.content && merged.content.values) || {}).filter(([, value]) => String(value || "").trim())) };
  await collections.settings.updateOne(
    { _id: settingsDocumentId },
    { $set: { ...settingsOnly(merged), updatedAt: new Date() } },
    { upsert: true }
  );
  await Promise.all([
    replaceCollection("pages", merged.pages || []),
    replaceCollection("banners", merged.banners || []),
    replaceCollection("categories", merged.categories || []),
    replaceCollection("products", merged.products || []),
    replaceCollection("blogs", merged.blogPosts || [])
  ]);
  return readSettings();
}

function recordId(item, fallbackPrefix, index) {
  return item.id || item.slug || `${fallbackPrefix}-${index + 1}`;
}

function normalizeSeo(item, type) {
  const normalized = { ...item };
  const name = normalized.name || normalized.title || normalized.heading || "LeatherCulture";
  const pathPrefix = type === "product" ? "/shop/" : type === "blog" ? "/blog/" : type === "category" ? "/shop?category=" : "/";

  if (type !== "page") normalized.slug = slugify(normalized.slug || name);
  if (type === "page") {
    normalized.slug = normalized.slug ? slugify(normalized.slug) : "";
    normalized.path = normalized.path || (normalized.slug ? `/${normalized.slug}` : "/");
    normalized.canonicalPath = normalized.canonicalPath || normalized.path;
  } else {
    normalized.canonicalPath = normalized.canonicalPath || `${pathPrefix}${normalized.slug}`;
  }

  normalized.metaTitle = normalized.metaTitle || `${name} Pakistan | LeatherCulture`;
  normalized.metaDescription = normalized.metaDescription || normalized.description || normalized.excerpt || `Explore ${name} at LeatherCulture Pakistan.`;
  normalized.keywords = normalized.keywords || `${name}, LeatherCulture Pakistan, leather fashion Pakistan`;
  return normalized;
}

function normalizeStoreData(data) {
  const normalized = { ...data };
  normalized.pages = (normalized.pages || []).map((item) => normalizeSeo(item, "page"));
  normalized.categories = (normalized.categories || []).map((item) => normalizeSeo(item, "category"));
  normalized.products = (normalized.products || []).map((item) => normalizeSeo(item, "product"));
  normalized.blogPosts = (normalized.blogPosts || []).map((item) => normalizeSeo(item, "blog"));
  normalized.banners = (normalized.banners || []).map((item, index) => ({ ...item, id: item.id || slugify(item.label || item.title || `banner-${index + 1}`) }));
  return normalized;
}

async function replaceCollection(name, items) {
  const collection = collections[name];
  const now = new Date();
  const ids = items.map((item, index) => recordId(item, name, index));

  if (items.length) {
    await collection.bulkWrite(
      items.map((item, index) => {
        const id = recordId(item, name, index);
        return {
          updateOne: {
            filter: { _id: id },
            update: {
              $set: {
                ...item,
                id,
                order: index,
                updatedAt: now
              },
              $setOnInsert: { createdAt: now }
            },
            upsert: true
          }
        };
      })
    );
  }

  await collection.deleteMany({ _id: { $nin: ids } });
}

async function seedCollection(name, items) {
  if (await collections[name].estimatedDocumentCount()) return;
  await replaceCollection(name, items);
}

async function ensureDefaultRecords(name, items) {
  if (!items.length) return;
  const now = new Date();
  await collections[name].bulkWrite(
    items.map((item, index) => {
      const id = recordId(item, name, index);
      return {
        updateOne: {
          filter: { _id: id },
          update: {
            $setOnInsert: {
              ...item,
              id,
              order: index,
              createdAt: now,
              updatedAt: now
            }
          },
          upsert: true
        }
      };
    })
  );
}

async function backfillProductVariants() {
  const defaultsById = new Map(defaultSettings.products.map((product) => [product.id, product]));
  const products = await collections.products.find({}).toArray();
  const writes = products
    .map((product) => {
      const fallback = defaultsById.get(product.id) || defaultsById.get(product.slug);
      if (product.variants && product.variants.length) return null;
      return {
        updateOne: {
          filter: { _id: product._id },
          update: {
            $set: {
              variants: fallback?.variants || [
                {
                  id: "default",
                  name: "Default",
                  color: "#111111",
                  sku: `${String(product.slug || product.id || "product").toUpperCase()}-DEFAULT`,
                  stock: 0,
                  image: product.image || "",
                  alt: product.alt || product.name || "",
                  enabled: true
                }
              ],
              updatedAt: new Date()
            }
          }
        }
      };
    })
    .filter(Boolean);
  if (writes.length) await collections.products.bulkWrite(writes);
}

async function backfillSeoFields() {
  const jobs = [
    ["pages", defaultSettings.pages, "page"],
    ["categories", defaultSettings.categories, "category"],
    ["products", defaultSettings.products, "product"],
    ["blogs", defaultSettings.blogPosts, "blog"]
  ];

  for (const [name, defaults, type] of jobs) {
    const defaultsById = new Map(defaults.map((item) => [item.id, item]));
    const records = await collections[name].find({}).toArray();
    const writes = records.map((record) => {
      const fallback = defaultsById.get(record.id) || defaultsById.get(record.slug) || {};
      const normalized = normalizeSeo({ ...fallback, ...record }, type);
      const set = Object.fromEntries(
        Object.entries({
          slug: normalized.slug,
          path: normalized.path,
          canonicalPath: normalized.canonicalPath,
          metaTitle: normalized.metaTitle,
          metaDescription: normalized.metaDescription,
          keywords: normalized.keywords,
          description: normalized.description,
          excerpt: normalized.excerpt,
          updatedAt: new Date()
        }).filter(([, value]) => value !== undefined)
      );
      return {
        updateOne: {
          filter: { _id: record._id },
          update: { $set: set }
        }
      };
    });
    if (writes.length) await collections[name].bulkWrite(writes);
  }
}

async function publicRecords(name, filter = {}) {
  return (await collections[name].find(filter).sort({ order: 1, name: 1, title: 1 }).toArray()).map(publicRecord);
}

async function connectDb() {
  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env");

  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 15000 });
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await client.connect();
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  if (lastError) throw lastError;
  const db = client.db(mongoDbName);
  collections.settings = db.collection(collectionNames.settings);
  collections.products = db.collection(collectionNames.products);
  collections.categories = db.collection(collectionNames.categories);
  collections.banners = db.collection(collectionNames.banners);
  collections.blogs = db.collection(collectionNames.blogs);
  collections.pages = db.collection(collectionNames.pages);

  await Promise.all([
    collections.pages.createIndex({ path: 1 }, { unique: true }),
    collections.pages.createIndex({ slug: 1 }),
    collections.products.createIndex({ slug: 1 }, { unique: true }),
    collections.categories.createIndex({ slug: 1 }, { unique: true }),
    collections.blogs.createIndex({ slug: 1 }, { unique: true }),
    collections.banners.createIndex({ id: 1 }),
    collections.products.createIndex({ category: 1 }),
    collections.blogs.createIndex({ status: 1, date: -1 })
  ]);

  const existing = await collections.settings.findOne({ _id: settingsDocumentId });
  if (!existing) {
    await writeSettings(defaultSettings);
    return;
  }

  const legacy = publicSettings(existing);
  await collections.settings.updateOne(
    { _id: settingsDocumentId },
    { $set: { ...settingsOnly(legacy), updatedAt: new Date() }, $unset: { banners: "", categories: "", products: "", blogPosts: "" } }
  );

  await Promise.all([
    seedCollection("pages", legacy.pages || defaultSettings.pages),
    seedCollection("banners", legacy.banners || defaultSettings.banners),
    seedCollection("categories", legacy.categories || defaultSettings.categories),
    seedCollection("products", legacy.products || defaultSettings.products),
    seedCollection("blogs", legacy.blogPosts || defaultSettings.blogPosts)
  ]);

  await Promise.all([
    ensureDefaultRecords("pages", defaultSettings.pages),
    ensureDefaultRecords("banners", defaultSettings.banners),
    ensureDefaultRecords("categories", defaultSettings.categories),
    ensureDefaultRecords("products", defaultSettings.products),
    ensureDefaultRecords("blogs", defaultSettings.blogPosts)
  ]);

  await backfillProductVariants();
  await backfillSeoFields();
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (allowedOrigins.has(origin) || allowedOrigins.has("*")) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("access-control-allow-headers", "Content-Type");
    res.setHeader("vary", "Origin");
  }
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 15_000_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function isAdmin(req) {
  const token = parseCookies(req).lc_admin_session;
  return Boolean(token && sessions.has(token));
}

function setSessionCookie(res, token) {
  const attributes = crossSiteCookies ? "HttpOnly; Secure; SameSite=None; Path=/; Max-Age=28800" : "HttpOnly; SameSite=Lax; Path=/; Max-Age=28800";
  res.setHeader("set-cookie", `lc_admin_session=${encodeURIComponent(token)}; ${attributes}`);
}

function clearSessionCookie(res) {
  const attributes = crossSiteCookies ? "HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0" : "HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
  res.setHeader("set-cookie", `lc_admin_session=; ${attributes}`);
}

function jsonWithCookie(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function saveUpload(payload) {
  const { filename, dataUrl } = payload || {};
  if (!dataUrl || !dataUrl.startsWith("data:")) throw new Error("Invalid image upload");

  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|svg\+xml));base64,(.+)$/);
  if (!match) throw new Error("Only png, jpg, webp, and svg images are allowed");

  const ext = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg"
  }[match[1]];

  fs.mkdirSync(uploadDir, { recursive: true });
  const base = slugify(path.basename(filename || "upload", path.extname(filename || ""))) || "upload";
  const storedName = `${Date.now()}-${base}${ext}`;
  const storedPath = path.join(uploadDir, storedName);
  fs.writeFileSync(storedPath, Buffer.from(match[2], "base64"));
  return `/assets/uploads/${storedName}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function originFor(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return process.env.SITE_URL || `${protocol}://${host}`;
}

function absoluteUrl(req, pathname) {
  return new URL(pathname || "/", originFor(req)).toString();
}

function metaTags({ title, description, keywords, canonicalPath, image }, req) {
  const canonical = absoluteUrl(req, canonicalPath || "/");
  return `
    <meta name="description" content="${escapeHtml(description || "")}">
    <meta name="keywords" content="${escapeHtml(keywords || "")}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <meta property="og:title" content="${escapeHtml(title || "")}">
    <meta property="og:description" content="${escapeHtml(description || "")}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    ${image ? `<meta property="og:image" content="${escapeHtml(absoluteUrl(req, image))}">` : ""}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title || "")}">
    <meta name="twitter:description" content="${escapeHtml(description || "")}">
  `;
}

async function sitemap(req) {
  const [settings, products, blogs] = await Promise.all([
    readSettings(),
    publicRecords("products", { enabled: { $ne: false } }),
    publicRecords("blogs", { status: "published" })
  ]);
  const pageUrls = (settings.pages || []).filter((page) => page.enabled !== false).map((page) => page.canonicalPath || page.path || "/");
  const productUrls = products.map((product) => `/shop/${product.slug}`);
  const blogUrls = blogs.map((blog) => `/blog/${blog.slug}`);
  const urls = [...new Set([...pageUrls, ...productUrls, ...blogUrls])];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeHtml(absoluteUrl(req, url))}</loc></url>`).join("\n")}
</urlset>`;
}

function pageForPath(settings, pathname) {
  const clean = (pathname || "/").replace(/\/$/, "") || "/";
  return (settings.pages || []).find((page) => {
    const pagePath = (page.path || page.canonicalPath || "/").replace(/\/$/, "") || "/";
    return pagePath === clean;
  });
}

function injectStaticMeta(html, page, req) {
  if (!page) return html;
  const title = page.metaTitle || page.heading || page.name;
  const meta = metaTags(
    {
      title,
      description: page.metaDescription || page.excerpt,
      keywords: page.keywords,
      canonicalPath: page.canonicalPath || page.path
    },
    req
  );
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/\s*<meta (?:name|property)="(?:description|keywords|og:title|og:description|og:url|twitter:card|twitter:title|twitter:description)"[^>]*>/gi, "")
    .replace(/\s*<link rel="canonical"[^>]*>/i, "")
    .replace(/<head>/i, `<head>${meta}`);
}

function renderBlogPost(post, settings, req) {
  const brand = settings.brand?.name || "LeatherCulture";
  const title = post.metaTitle || `${post.title} - ${brand}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link href="/assets/brand/leather-culture-mark.png" rel="icon" type="image/png">
    ${metaTags({ title, description: post.metaDescription || post.excerpt || settings.brand?.description, keywords: post.keywords, canonicalPath: `/blog/${post.slug}`, image: post.coverImage }, req)}
    <style>
      body{margin:0;background:#f8f8f8;color:#080808;font-family:Inter,Arial,sans-serif}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:24px clamp(18px,5vw,72px);background:#050505;color:#fff}
      header a{color:inherit;text-decoration:none;font-weight:800}
      nav{display:flex;gap:26px}
      main{max-width:920px;margin:0 auto;padding:56px 20px 90px}
      .cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#e8e8e8}
      .meta{margin:28px 0 12px;color:#666;font-weight:800}
      h1{margin:0 0 18px;font-size:clamp(42px,7vw,84px);line-height:.95;letter-spacing:0}
      .excerpt{font-size:20px;line-height:1.55;color:#555}
      article{margin-top:36px;font-size:18px;line-height:1.75}
      article img{max-width:100%;border-radius:8px}
    </style>
  </head>
  <body>
    <header>
      <a href="/">${escapeHtml(brand)}</a>
      <nav>${(settings.header?.nav || []).map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}</nav>
    </header>
    <main>
      ${post.coverImage ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.coverAlt || post.title)}">` : ""}
      <p class="meta">${escapeHtml(post.author || brand)} / ${escapeHtml(post.date || "")}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="excerpt">${escapeHtml(post.excerpt || "")}</p>
      <article>${post.body || ""}</article>
    </main>
  </body>
</html>`;
}

function renderProductPage(product, settings, req) {
  const brand = settings.brand?.name || "LeatherCulture";
  const title = product.metaTitle || `${product.name} - ${brand}`;
  const mediaItems = [
    { image: product.image, alt: product.alt || product.name, label: product.name },
    ...(product.variants || [])
      .filter((variant) => variant.enabled !== false && variant.image)
      .map((variant) => ({
        image: variant.image,
        alt: variant.alt || `${product.name} ${variant.name || "variant"}`,
        label: variant.name || "Variant"
      }))
  ].filter((item, index, list) => item.image && list.findIndex((candidate) => candidate.image === item.image) === index);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link href="/assets/brand/leather-culture-mark.png" rel="icon" type="image/png">
    ${metaTags({ title, description: product.metaDescription || product.description || product.name, keywords: product.keywords, canonicalPath: `/shop/${product.slug}`, image: product.image }, req)}
    <style>
      body{margin:0;background:#f8f8f8;color:#080808;font-family:Inter,Arial,sans-serif}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:24px clamp(18px,5vw,72px);background:#050505;color:#fff}
      header a{color:inherit;text-decoration:none;font-weight:800}
      nav{display:flex;gap:26px}
      main{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;max-width:1180px;margin:0 auto;padding:56px 20px 90px}
      img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:8px;background:#e8e8e8}
      .badge{display:inline-flex;margin-bottom:18px;padding:8px 12px;border-radius:999px;background:#050505;color:#fff;font-weight:800}
      h1{margin:0 0 18px;font-size:clamp(42px,7vw,82px);line-height:.95;letter-spacing:0}
      .price{font-size:24px;font-weight:900}
      .description{font-size:18px;line-height:1.65;color:#555}
      .variants{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
      .variant{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 12px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1px #ddd;font-weight:800}
      .swatch{width:18px;height:18px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
      .gallery{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
      .thumb{width:72px;height:86px;padding:0;border:2px solid #ddd;border-radius:8px;background:#f4f4f4;cursor:pointer;overflow:hidden}
      .thumb img{width:100%;height:100%;object-fit:cover;border-radius:6px}
      .thumb.active{border-color:#050505}
      .button{display:inline-flex;margin-top:26px;min-height:48px;align-items:center;padding:0 20px;border-radius:999px;background:#050505;color:#fff;text-decoration:none;font-weight:900}
      @media(max-width:820px){main{grid-template-columns:1fr}.gallery{flex-wrap:nowrap;overflow-x:auto}.thumb{flex:0 0 auto;width:62px;height:76px}}
    </style>
  </head>
  <body>
    <header>
      <a href="/">${escapeHtml(brand)}</a>
      <nav>${(settings.header?.nav || []).map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("")}</nav>
    </header>
    <main>
      <div>
        <img id="main-product-image" src="${escapeHtml(mediaItems[0]?.image || product.image || "")}" alt="${escapeHtml(mediaItems[0]?.alt || product.alt || product.name)}">
        <div class="gallery" aria-label="Product variant images">${mediaItems.map((item, index) => `
          <button class="thumb${index === 0 ? " active" : ""}" type="button" data-image="${escapeHtml(item.image)}" data-alt="${escapeHtml(item.alt)}" aria-label="${escapeHtml(item.label)}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
          </button>`).join("")}</div>
      </div>
      <section>
        ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ""}
        <h1>${escapeHtml(product.name)}</h1>
        <p class="price">${escapeHtml(product.price || "")}</p>
        <p class="description">${escapeHtml(product.description || "Premium LeatherCulture piece selected for refined everyday style.")}</p>
        <div class="variants">${(product.variants || [])
          .filter((variant) => variant.enabled !== false)
          .map((variant) => `<span class="variant"><span class="swatch" style="background:${escapeHtml(variant.color || "#111")}"></span>${escapeHtml(variant.name || "Variant")}</span>`)
          .join("")}</div>
        <a class="button" href="/contact">Contact to order</a>
      </section>
    </main>
    <script>
      document.querySelectorAll(".thumb").forEach((button) => {
        button.addEventListener("click", () => {
          document.querySelectorAll(".thumb").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          const image = document.getElementById("main-product-image");
          image.src = button.dataset.image;
          image.alt = button.dataset.alt || "";
        });
      });
    </script>
  </body>
</html>`;
}

function safeFileFor(urlPath) {
  let requestPath = decodeURIComponent(urlPath);
  if (requestPath === "/admin") requestPath = "/admin/";
  if (requestPath.endsWith("/")) requestPath += "index.html";

  let file = path.normalize(path.join(root, requestPath));
  if (!file.startsWith(root)) return null;
  // Clean URLs: /shop/slug -> /shop/slug/index.html
  if (!path.extname(file) && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  return file;
}

async function requestHandler(req, res) {
  try {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/health" && req.method === "GET") {
      return writeJson(res, 200, {
        ok: true,
        database: dbError ? "error" : collections.settings ? "connected" : "connecting",
        message: dbError ? dbError.message : "Service is running"
      });
    }

    if (url.pathname === "/api/storefront/settings" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await readSettings());
    }

    if (url.pathname === "/robots.txt" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(`User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(req, "/sitemap.xml")}\n`);
      return;
    }

    if (url.pathname === "/sitemap.xml" && req.method === "GET") {
      await ensureDbReady();
      res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
      res.end(await sitemap(req));
      return;
    }

    if (url.pathname === "/api/storefront/pages" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await publicRecords("pages", { enabled: { $ne: false } }));
    }

    if (url.pathname === "/api/storefront/products" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await publicRecords("products", { enabled: { $ne: false } }));
    }

    if (url.pathname === "/api/storefront/categories" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await publicRecords("categories", { enabled: { $ne: false } }));
    }

    if (url.pathname === "/api/storefront/banners" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await publicRecords("banners", { enabled: { $ne: false } }));
    }

    if (url.pathname === "/api/storefront/blogs" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, 200, await publicRecords("blogs", { status: "published" }));
    }

    if (url.pathname.startsWith("/blog/") && req.method === "GET") {
      await ensureDbReady();
      const slug = url.pathname.split("/").filter(Boolean)[1];
      const settings = await readSettings();
      const post = (settings.blogPosts || []).find((item) => item.slug === slug && item.status === "published");
      if (post) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(renderBlogPost(post, settings, req));
        return;
      }
    }

    if (url.pathname.startsWith("/shop/") && req.method === "GET") {
      const slug = url.pathname.split("/").filter(Boolean)[1];
      const staticPage = path.join(root, "shop", slug || "", "index.html");
      if (!fs.existsSync(staticPage)) await ensureDbReady();
      const product = !fs.existsSync(staticPage) && await collections.products.findOne({ slug, enabled: { $ne: false } });
      if (product) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(renderProductPage(publicRecord(product), await readSettings(), req));
        return;
      }
    }

    if (url.pathname === "/api/admin/login" && req.method === "POST") {
      await ensureDbReady();
      const body = JSON.parse(await readBody(req) || "{}");
      if (body.password !== adminPassword) return writeJson(res, 401, { message: "Invalid password" });
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, Date.now());
      setSessionCookie(res, token);
      return jsonWithCookie(res, 200, { ok: true });
    }

    if (url.pathname === "/api/admin/logout" && req.method === "POST") {
      await ensureDbReady();
      const token = parseCookies(req).lc_admin_session;
      if (token) sessions.delete(token);
      clearSessionCookie(res);
      return jsonWithCookie(res, 200, { ok: true });
    }

    if (url.pathname === "/api/admin/me" && req.method === "GET") {
      await ensureDbReady();
      return writeJson(res, isAdmin(req) ? 200 : 401, { authenticated: isAdmin(req) });
    }

    if (url.pathname === "/api/admin/upload" && req.method === "POST") {
      await ensureDbReady();
      if (!isAdmin(req)) return writeJson(res, 401, { message: "Please login again" });
      const body = JSON.parse(await readBody(req) || "{}");
      return writeJson(res, 200, { url: absoluteUrl(req, saveUpload(body)) });
    }

    if (url.pathname === "/api/storefront/settings" && req.method === "PUT") {
      await ensureDbReady();
      if (!isAdmin(req)) return writeJson(res, 401, { message: "Please login again" });
      const body = await readBody(req);
      return writeJson(res, 200, await writeSettings(JSON.parse(body || "{}")));
    }

    const file = safeFileFor(url.pathname);
    if (!file) return writeJson(res, 400, { message: "Bad path" });

    try {
      let data = await fs.promises.readFile(file);
      const ext = path.extname(file).toLowerCase();
      if (ext === ".html") {
        try {
          await ensureDbReady();
          const settings = await readSettings();
          data = Buffer.from(injectStaticMeta(data.toString("utf8"), pageForPath(settings, url.pathname), req));
        } catch (error) {
          console.error(`Static HTML served without DB metadata: ${error.message}`);
        }
      }
      res.writeHead(200, {
        "content-type": mime[ext] || "application/octet-stream"
      });
      res.end(data);
    } catch (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  } catch (error) {
    writeJson(res, 500, { message: error.message || "Server error" });
  }
}

startDbConnection();

if (process.env.VERCEL) {
  module.exports = requestHandler;
} else {
  const server = http.createServer(requestHandler);
  server.listen(port, () => {
    console.log(`LeatherCulture store: http://localhost:${port}`);
    console.log(`Admin panel: http://localhost:${port}/admin`);
  });
}
