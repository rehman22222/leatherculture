"use strict";
const media = require("./jacket-images");

// Launch price, size and stock confirmed by the store owner.
// Existing admin edits survive future deployments; material claims remain unconfirmed.
const designs = [
  {
    slug: "the-blade", name: "The Blade Hooded Jacket", color: "Black", hex: "#171717",
    description: "The Blade pairs a black hooded silhouette with angular chest panels, a full zip and practical side pockets. Its clean outline works with straight-leg denim, neutral tees and simple knitwear for everyday city dressing. Explore the front, back and side views, then use the close-up images to see the hood, seams and sleeve pocket. Shop The Blade hooded jacket online from LeatherCulture in Pakistan and choose your available size before checkout.",
    metaDescription: "Shop The Blade black hooded jacket in Pakistan. Explore front, back and detail images, choose your size and order online from LeatherCulture."
  },
  {
    slug: "the-heritage", name: "The Heritage Collared Jacket", color: "Chocolate Brown", hex: "#573a2c",
    description: "The Heritage brings a warm chocolate-brown colour to a classic collared silhouette. A central zip, restrained chest seams and angled side pockets keep the look simple and versatile. Style it over a cream knit with dark denim, or pair it with tailored trousers for an evening outfit. Browse the product gallery for front, back and side views, lining details and styling inspiration. Shop The Heritage collared jacket online from LeatherCulture in Pakistan.",
    metaDescription: "Shop The Heritage chocolate-brown collared jacket in Pakistan. View every angle, lining details and styling images, then order online from LeatherCulture."
  },
  {
    slug: "the-vibe", name: "The Vibe Contrast Panel Jacket", color: "Black / White", hex: "#171717",
    description: "The Vibe combines a black base with white shoulder and sleeve panels for a distinctive monochrome look. A stand collar and central zip frame the design, while the short outline pairs naturally with dark denim and understated tops. View the front image, back and side angles, and close-ups of the contrast panels and fastening to explore the details. Shop The Vibe contrast panel jacket online from LeatherCulture in Pakistan.",
    metaDescription: "Shop The Vibe black-and-white contrast panel jacket in Pakistan. View front, back and close-up images and choose your size at LeatherCulture."
  },
  {
    slug: "the-nomad", name: "The Nomad Stand Collar Jacket", color: "Olive Green", hex: "#4b4b36",
    description: "The Nomad brings an olive-green colour to a clean stand collar design. Its central zip, snap collar, sleeve pocket and ribbed cuffs give everyday outfits a utility-inspired finish. Pair it with stone chinos, black denim or a neutral knit to keep the styling relaxed. Explore front, back and side photographs alongside close-ups of the collar and pocket details. Shop The Nomad stand collar jacket online from LeatherCulture in Pakistan.",
    metaDescription: "Shop The Nomad olive-green stand collar jacket in Pakistan. Explore its pocket and collar details, view every angle and order online from LeatherCulture."
  },
  {
    slug: "the-rune", name: "The Rune Asymmetric Jacket", color: "Black", hex: "#171717",
    description: "The Rune places an asymmetric front closure at the centre of a minimal black design. A snap stand collar, clean panels and zipped side pockets create a defined outline that works with plain shirts, fine knits and dark trousers. Browse the front, back and side views, then look closer at the collar, fastening and pocket details in the gallery. Shop The Rune asymmetric jacket online from LeatherCulture in Pakistan.",
    metaDescription: "Shop The Rune black asymmetric jacket in Pakistan. View the stand collar, zip details and back profile, then choose your size at LeatherCulture."
  }
];

module.exports = designs.map(design => ({
  id: design.slug, slug: design.slug, name: design.name, category: "men",
  enabled: true, price: "Rs 15,000", size: "L", compareAtPrice: "", badge: "",
  description: design.description, material: "", care: "", warranty: "",
  image: media[design.slug][0].image,
  alt: media[design.slug][0].alt,
  gallery: media[design.slug].map(({ source, ...image }) => image),
  metaTitle: `${design.name} | LeatherCulture Pakistan`, metaDescription: design.metaDescription,
  keywords: `${design.name}, LeatherCulture jackets Pakistan`, canonicalPath: `/shop/${design.slug}`,
  launchNotes: "Size L, price PKR 15,000 and stock 5 confirmed by store owner. Material and performance claims remain unconfirmed; do not add water-resistance or detachable-hood claims without confirmation.",
  variants: [{ id: `${design.slug}-main`, name: `${design.color} / L`, size: "L", color: design.hex, sku: `LC-${design.slug.replace("the-", "").toUpperCase()}-L`, stock: 5, enabled: true, image: media[design.slug][0].image, alt: media[design.slug][0].alt }]
}));
