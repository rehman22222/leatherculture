# LeatherCulture

Static Framer-style storefront with a MongoDB-backed Node admin panel.

## Run

```bash
npm start
```

Open:

- Store: `http://localhost:8000`
- Admin: `http://localhost:8000/admin`

Default admin password:

```bash
leatherculture123
```

Change it before real use:

```bash
$env:ADMIN_PASSWORD="your-strong-password"; npm start
```

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
