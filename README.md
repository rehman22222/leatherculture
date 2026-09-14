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

## Deploy on Vercel

Add these environment variables in Vercel Project Settings before deploying:

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
```

Vercel uses `server.js` through `vercel.json`, so all store pages, admin pages, APIs, `/sitemap.xml`, and `/robots.txt` are served from the same backend.
