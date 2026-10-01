"use strict";

// Launch drafts: no price, availability or material performance is inferred
// from concept images. Existing admin edits survive future deployments.
const designs = [
  {
    slug: "the-blade", name: "The Blade Hooded Jacket", color: "Black", hex: "#171717",
    description: "A sharp silhouette for everyday city dressing. The Blade pairs a hooded profile with angular panel lines, a central zip and a clean, understated finish. Its dark colour makes a strong foundation for a simple layered outfit: wear it over a plain tee with straight-leg jeans, or pair it with tailored trousers for a more considered evening look. The design balances a structured outline with a casual hood, bringing a modern edge to the LeatherCulture jacket collection. Explore the reference sheet for front, back and side views, then check the final size and material details before ordering in Pakistan.",
    metaDescription: "Explore The Blade by LeatherCulture: a black hooded jacket design with angular panels and a clean zip front. Discover a modern approach to everyday layering."
  },
  {
    slug: "the-heritage", name: "The Heritage Collared Jacket", color: "Chocolate Brown", hex: "#573a2c",
    description: "Classic character with a clean, contemporary outline. The Heritage combines a chocolate-brown palette, a traditional point collar and a full zip front. Horizontal chest seams and a simple back keep the design composed, while the warm tone pairs naturally with cream knitwear, dark denim and tailored trousers. Choose it as the finishing layer for a relaxed dinner outfit or a thoughtfully styled everyday wardrobe. The accompanying design sheet shows the jacket from multiple angles and includes its lining reference. Discover The Heritage in the LeatherCulture collection for Pakistan, and review the confirmed material, measurements and colour availability before placing your order.",
    metaDescription: "Discover The Heritage by LeatherCulture, a chocolate-brown collared jacket design with a zip front and understated detailing. A classic look for modern wardrobes."
  },
  {
    slug: "the-vibe", name: "The Vibe Contrast Panel Jacket", color: "Black / White", hex: "#171717",
    description: "Bold contrast, balanced proportions. The Vibe brings black and white together through distinctive shoulder and sleeve panels, framed by a stand collar and a central zip. The contrast draws attention to the jacket's lines without needing a busy outfit underneath. Style the design with a plain top and dark trousers for a focused monochrome look, or introduce denim for an easy weekend combination. Its short, defined silhouette gives the LeatherCulture collection a sporty direction. View the supplied design reference for front, back and side details, and consult the final product measurements and specifications before choosing your size in Pakistan.",
    metaDescription: "Meet The Vibe by LeatherCulture: a black-and-white contrast panel jacket design with a stand collar and zip front. Explore its distinctive, sporty silhouette."
  },
  {
    slug: "the-nomad", name: "The Nomad Stand Collar Jacket", color: "Olive Green", hex: "#4b4b36",
    description: "An understated utility look in a versatile olive tone. The Nomad features a stand collar, a zip front and restrained panel detailing for an uncluttered silhouette. Its earthy colour works with black denim, stone chinos and neutral layers, making the design easy to build an outfit around. Keep the styling simple for everyday wear or add a fine knit for a more polished combination. The reference sheet presents the front, back and side views alongside close-up design details. Explore The Nomad from LeatherCulture in Pakistan and check the confirmed fabric, fit measurements and available options before ordering.",
    metaDescription: "Explore The Nomad by LeatherCulture, an olive stand collar jacket design with a zip front and clean utility styling. Discover versatile everyday outfit ideas."
  },
  {
    slug: "the-rune", name: "The Rune Asymmetric Jacket", color: "Black", hex: "#171717",
    description: "A distinctive closure gives a minimal jacket its character. The Rune combines an asymmetric front with a stand collar and a clean black palette. Its restrained panels place the emphasis on shape, making it a natural focal point over a plain shirt or fine knit. Pair the design with dark trousers for a composed evening outfit, or soften the look with everyday denim. The multi-view reference sheet shows the front fastening, back and side profile, helping you explore the design before selecting a fit. Discover The Rune in the LeatherCulture collection for Pakistan and review the final materials and measurements before purchase.",
    metaDescription: "Discover The Rune by LeatherCulture: a black asymmetric jacket design with a stand collar and minimal panels. Explore a distinctive silhouette for modern outfits."
  }
];

module.exports = designs.map(design => ({
  id: design.slug, slug: design.slug, name: design.name, category: "men",
  enabled: false, price: "", compareAtPrice: "", badge: "",
  description: design.description, material: "", care: "", warranty: "",
  image: `/assets/jackets/${design.slug}-design.jpg`,
  alt: `${design.name} design reference with front, back and side views`,
  metaTitle: `${design.name} | LeatherCulture Pakistan`, metaDescription: design.metaDescription,
  keywords: `${design.name}, LeatherCulture jackets Pakistan`, canonicalPath: `/shop/${design.slug}`,
  launchNotes: "DRAFT: Set price, confirm leather/material, size measurements, colour availability and stock before publishing. Reference artwork is supplied design imagery; confirm it represents the finished garment. Do not claim water resistance or a detachable hood without confirmation.",
  variants: [{ id: `${design.slug}-main`, name: design.color, color: design.hex, sku: `LC-${design.slug.replace("the-", "").toUpperCase()}`, stock: 0, enabled: false, image: `/assets/jackets/${design.slug}-design.jpg`, alt: `${design.name} in ${design.color.toLowerCase()} — design reference` }]
}));
