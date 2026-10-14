# LeatherCulture

Static Framer-style storefront with a MongoDB-backed Node admin panel.

## Run

```bash
npm start
```

Open:

- Store: `http://localhost:8000`
- Admin: `http://localhost:8000/admin`

For local development only, the admin password defaults to:

```bash
leatherculture123
```

On Render (or with `NODE_ENV=production`) there is no default: admin login stays
disabled until `ADMIN_PASSWORD` is set. Locally you can override it too:

```bash
$env:ADMIN_PASSWORD="your-strong-password"; npm start
```

Ten failed logins from one address (or 100 overall) lock admin login for 15
minutes, and admin sessions expire after 8 hours.

## Stock

Placing an order takes its quantity out of the variant's stock; an order that
would oversell is refused. Cancelling an order in admin returns its stock, and
moving it out of Cancelled takes the stock again if it is still available.
Deleting an order does not change stock, so cancel first if the items should go
back on sale. Because every stock change counts as a store change, saving
settings from an admin tab opened before a new order asks you to reload first,
so old stock numbers are never written back.

MongoDB is configured from `.env`:

```bash
MONGODB_URI="your-atlas-uri"
MONGODB_DB_NAME="Leater-store"
MONGODB_SETTINGS_COLLECTION="leater store"
MONGODB_PRODUCTS_COLLECTION="products"
MONGODB_CATEGORIES_COLLECTION="categories"
MONGODB_BANNERS_COLLECTION="banners"
MONGODB_BLOGS_COLLECTION="blogs"
MONGODB_PAGES_COLLECTION="pages"
```

## Editable Content

Admin changes are saved in MongoDB Atlas and loaded by the storefront through:

- `GET /api/storefront/settings`
- `GET /api/storefront/products`
- `GET /api/storefront/categories`
- `GET /api/storefront/banners`
- `GET /api/storefront/blogs`
- `GET /api/storefront/pages`
- `PUT /api/storefront/settings`
- `POST /api/admin/login`
- `POST /api/admin/upload`

Store data is normalized in MongoDB collections:

- `leater store`: brand, header, hero, sections, footer settings
- `products`: all storefront products
- `categories`: men/women categories
- `banners`: promotional banners
- `blogs`: rich text blog posts
- `pages`: page content and SEO metadata

Hero content includes editable hero background and hero image gallery/thumbnail slots. Each hero image has URL, upload, label, alt text, and enabled controls.

SEO is editable from admin for pages, products, categories, and blog posts. The server also generates:

- `/sitemap.xml`
- `/robots.txt`

The storefront UI stays as the restored Framer design. `store-override.js` updates editable text/settings/product data and hides the unused children's wear content. Local JSON storage is no longer used for storefront data.

## Split Deployment

Deploy `server.js` to Render as the backend/API/admin app, then deploy the static frontend to Vercel.

### Render Backend

Create a Render Web Service from this repo. Render can use `render.yaml`; add these environment variables in Render:

```bash
MONGODB_URI="your-atlas-uri"
MONGODB_DB_NAME="Leater-store"
MONGODB_SETTINGS_COLLECTION="leater store"
MONGODB_PRODUCTS_COLLECTION="products"
MONGODB_CATEGORIES_COLLECTION="categories"
MONGODB_BANNERS_COLLECTION="banners"
MONGODB_BLOGS_COLLECTION="blogs"
MONGODB_PAGES_COLLECTION="pages"
ADMIN_PASSWORD="your-strong-password"
CORS_ORIGINS="https://your-vercel-site.vercel.app"
CROSS_SITE_COOKIES="true"
```

Backend routes:

- Store API: `/api/storefront/settings`
- Admin login: `/api/admin/login`
- Admin panel: `/admin`
- SEO files: `/sitemap.xml`, `/robots.txt`

### Vercel Frontend

Vercel serves the static Framer storefront from this repo. After Render gives you the backend URL, set it in `site-config.js`:

```js
window.LEATHERCULTURE_API_BASE = "https://your-render-service.onrender.com";
```

Then push that change and import/deploy the repo on Vercel. Keep `CORS_ORIGINS` on Render updated with the final Vercel domain.

### Blog availability

Vercel runs `npm run build` to generate complete HTML pages from published blog
posts, including article text and SEO metadata. These pages are served directly
by Vercel, so a sleeping or unavailable Render backend cannot cause blog 503s.
The build retries public API requests and fails if content cannot be fetched,
keeping Vercel's previous successful deployment available.

After publishing, editing, or unpublishing a blog post in admin, redeploy the
Vercel frontend to refresh these snapshots. `BLOG_API_BASE` can override the
backend URL and `SITE_URL` can override the canonical site URL during builds.

Vercel's output directory is `dist/`. The same build generates storefront HTML
from current public backend settings and products, with PKR prices and matching
Product/FAQ structured data, plus an updated sitemap. Only public assets are
copied; `.env`, server code and development files are excluded.

Set your public phone in **Appearance → Footer → Phone** and your real policy
in **Checkout → Returns and exchange policy**. Demo phone numbers are omitted.
Until a policy is entered, customers are asked to contact the team before
ordering; the site does not claim an unconfirmed 7-day or 30-day period.
The browser refreshes these settings from the backend. Redeploy Vercel after
content changes to update the initial HTML seen by crawlers as well.

## Customer accounts

Customers can open `/account` from the **My account** link, create an account,
sign in, save delivery details, change/reset a password and view their orders.
Guest checkout remains available. Signed-in checkout attaches orders to the
authenticated customer, using the account email rather than trusting the form.
Previous guest orders are linked only after the customer verifies that email.
Admin → Customers lists accounts without exposing password hashes or tokens.

Verification and reset messages use the existing branded email outbox and the
SMTP settings in Admin → Emails. Signup works before SMTP is configured, but
verification and password recovery require email delivery to be enabled.

Vercel proxies `/api/account/*` and order creation to Render so customer login
uses a first-party HttpOnly cookie. Passwords use salted asynchronous scrypt;
MongoDB stores hashed sessions and expiring single-use email tokens. Sessions
and rate-limit records have TTL indexes. Password changes revoke other sessions.
Account pages are noindex and are excluded from the sitemap.

Run `node scripts/test-customers.js` for account security/flow checks and
`npm run verify:seo` after building to check storefront metadata/content.

## SEO, analytics and policies

Admin → Appearance → **SEO & analytics** holds the Google Analytics 4
measurement ID, the Google Search Console and Bing verification codes, and any
extra official profile links. Footer social links appear only when they point
to a real profile (not `https://instagram.com`); together with the extra links
they become the `sameAs` profiles in the Organization schema. Redeploy Vercel
after changing these so the built pages pick them up.

`/privacy-policy` and `/terms` are generated from the checkout settings
(delivery fee, free-delivery threshold, returns policy) and linked from every
page. Review their wording before relying on them.

On Render the backend also answers on its `onrender.com` hostname. Page requests
there are redirected (301) to `PUBLIC_SITE_URL` (default
`https://www.leatherculture.shop`) so search engines index only the storefront;
the admin, API and uploads are not redirected.

For crawlers and AI tools that read only the start of a page, the build puts
the structured data right after the `<title>`, moves Framer's large stylesheet
to a cached file in `/assets/css/`, and places the answers section first in the
body (CSS keeps it below the page content until the browser moves it above the
footer). It also writes `llms.txt`, `llms-small.txt`, `llms-full.txt` (every
product, policy and journal article as plain text) and `/.well-known/ai.txt`.

Large jacket photos in `assets/jackets/` have lighter renditions beside them:
`name.webp` (pages), `name-card.webp` (cards and thumbnails) and `name.jpg`
(link previews, front views only). Pages fall back to the original when a
rendition is missing.
