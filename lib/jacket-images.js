"use strict";
// Matched visually against the owner's October 2 replacement archive.
const groups = [
  ["the-blade", "black-hooded-jacket", "The Blade black hooded jacket", [
    [1, "front", "Front", "front view with a zip fastening and angular chest panels"],
    [2, "back-side-views", "Back & sides", "back and side views showing the hood and sleeve pocket"],
    [11, "hood-pocket-details", "Details", "close-ups of the hood, shoulder seams and sleeve zip pocket"]
  ]],
  ["the-heritage", "brown-collared-jacket", "The Heritage chocolate-brown collared jacket", [
    [3, "front", "Front", "front view with a point collar, centre zip and side pockets"],
    [4, "back-side-views", "Back & sides", "back and side views showing the collar and cuff shape"],
    [12, "collar-lining-details", "Details", "close-ups of the collar, checked lining, pocket and zip"],
    [18, "showcase", "Showcase", "showcase with front, back, side and lining views"],
    [16, "lookbook-details", "Lookbook", "lookbook showing the collar, cuffs, pockets and stitching"],
    [17, "lookbook-styling", "Styling", "lookbook with a laid-flat outfit and lining details"]
  ]],
  ["the-vibe", "black-white-contrast-jacket", "The Vibe black-and-white contrast panel jacket", [
    [5, "front", "Front", "front view with white shoulder and sleeve panels"],
    [10, "back-side-views", "Back & sides", "back and side views showing white sleeve stripes"],
    [13, "collar-panel-details", "Details", "close-ups of the contrast panels, stand collar, zip and pocket"]
  ]],
  ["the-nomad", "olive-stand-collar-jacket", "The Nomad olive-green stand collar jacket", [
    [7, "front", "Front", "front view with snap collar, centre zip and sleeve pocket"],
    [8, "back-side-views", "Back & sides", "back and side views showing the sleeve pocket and ribbed hem"],
    [14, "collar-pocket-details", "Details", "close-ups of the snap collar, sleeve zip pocket and ribbed cuff"]
  ]],
  ["the-rune", "black-asymmetric-jacket", "The Rune black asymmetric jacket", [
    [9, "front", "Front", "front view with an asymmetric closure and snap stand collar"],
    [6, "back-side-views", "Back & sides", "back and side views showing the clean panels and cuffs"],
    [15, "collar-zip-details", "Details", "close-ups of the stand collar, asymmetric zip and side pocket"]
  ]]
];
module.exports = Object.fromEntries(groups.map(([slug, style, name, entries]) => [slug, entries.map(([source, view, label, detail]) => ({
  source, image: `/assets/jackets/${slug}-${style}-${view}.png`, alt: `${name}, ${detail}`, label, width: 1122, height: 1402
}))]));
