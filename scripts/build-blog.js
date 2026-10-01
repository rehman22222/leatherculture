const fs = require("fs/promises");
const path = require("path");
const { renderBlogPost } = require("../lib/blog-renderer");

// Fetch only public content. Builds must fail instead of publishing empty articles.
async function fetchJson(url) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      failure = error;
    }
  }
  throw failure;
}

async function main() {
  const api = process.env.BLOG_API_BASE || "https://leatherculture-backend.onrender.com";
  const site = process.env.SITE_URL || "https://www.leatherculture.shop";
  const [settings, posts] = await Promise.all([
    fetchJson(`${api}/api/storefront/settings`),
    fetchJson(`${api}/api/storefront/blogs`)
  ]);
  if (!Array.isArray(posts) || !posts.length) throw new Error("No published blog posts returned");
  const published = posts.filter(post => post.status === "published");
  for (const post of published) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || !post.title || !post.body) {
      throw new Error(`Invalid or empty article: ${post.slug}`);
    }
  }
  const directory = path.resolve(__dirname, "..", "blog");
  const slugs = new Set(published.map(post => post.slug));
  // Remove snapshots of articles that were deleted or unpublished in admin.
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !slugs.has(entry.name)) {
      const target = path.resolve(directory, entry.name);
      if (path.dirname(target) !== directory) throw new Error("Invalid snapshot path");
      const html = await fs.readFile(path.join(target, "index.html"), "utf8").catch(() => "");
      if (html.startsWith("<!-- Generated blog snapshot -->")) {
        await fs.rm(target, { recursive: true });
      }
    }
  }
  for (const post of published) {
    const folder = path.join(directory, post.slug);
    await fs.mkdir(folder, { recursive: true });
    const req = { headers: { host: new URL(site).host, "x-forwarded-proto": "https" } };
    await fs.writeFile(path.join(folder, "index.html"), "<!-- Generated blog snapshot -->\n" + renderBlogPost(post, settings, req));
    console.log(`Generated /blog/${post.slug}`);
  }
}

main().catch(error => {
  console.error("Blog build failed:", error.message);
  process.exitCode = 1;
});
