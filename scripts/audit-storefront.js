"use strict";
// Read-only technical audit of every public sitemap page. --live checks deployed HTML.
const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");
const root = path.resolve(__dirname, "..");
const site = "https://www.leatherculture.shop";
const live = process.argv.includes("--live");

async function main() {
  const read = async pathname => {
    if (live) {
      const response = await fetch(new URL(pathname, site), { signal: AbortSignal.timeout(25000) });
      return { status: response.status, finalUrl: response.url, html: await response.text() };
    }
    const file = pathname.endsWith(".xml") || pathname.endsWith(".txt") ? pathname.slice(1) : path.join(pathname.slice(1), "index.html");
    return { status: 200, html: await fs.readFile(path.join(root, "dist", file), "utf8") };
  };
  const sitemap = await read("/sitemap.xml");
  const urls = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  const publicPaths = new Set(urls.map(url => url.pathname));
  const rows = [];
  for (let offset = 0; offset < urls.length; offset += 4) {
    rows.push(...await Promise.all(urls.slice(offset, offset + 4).map(async url => {
      try {
        const response = await read(url.pathname), $ = cheerio.load(response.html);
        const problems = [], links = [];
        if (response.status !== 200) problems.push(`HTTP ${response.status}`);
        const title = $("title").text().trim(), description = $("meta[name='description']").attr("content") || "";
        if (!title) problems.push("Missing title");
        if (!description) problems.push("Missing description");
        if ($("h1").length !== 1) problems.push(`${$("h1").length} H1 elements`);
        if ($("link[rel='canonical']").attr("href") !== url.href) problems.push("Incorrect canonical");
        if (/noindex/i.test($("meta[name='robots']").attr("content") || "")) problems.push("Sitemap page is noindex");
        let schemaCount = 0;
        $("script[type='application/ld+json']").each((_, element) => {
          try { JSON.parse($(element).text()); schemaCount++; } catch { problems.push("Invalid JSON-LD"); }
        });
        if (!schemaCount) problems.push("Missing structured data");
        $("a[href]").each((_, element) => {
          const href = $(element).attr("href");
          try {
            const dest = new URL(href, url);
            if (dest.origin !== site || /\.[a-z0-9]+$/i.test(dest.pathname)) return;
            if (publicPaths.has(dest.pathname)) links.push(dest.pathname);
            else if (!/^\/(account|cart|checkout|order|review|admin|api)(\/|$)/.test(dest.pathname)) problems.push(`Non-canonical or unknown internal link: ${dest.pathname}`);
          } catch { problems.push(`Invalid link: ${href}`); }
        });
        const missingAlt = $("img:not([alt])").length;
        if (missingAlt) problems.push(`${missingAlt} images without alt attributes`);
        if (!live) {
          const assets = new Set($("img[src],script[src],link[rel='stylesheet']").map((_, element) => $(element).attr("src") || $(element).attr("href")).get().filter(value => value.startsWith("/") && !value.startsWith("//")));
          for (const asset of assets) {
            const assetPath = decodeURIComponent(new URL(asset, site).pathname).slice(1);
            if (!await fs.stat(path.join(root, "dist", assetPath)).then(stat => stat.isFile()).catch(() => false)) problems.push(`Missing asset: ${asset}`);
          }
        }
        return { path: url.pathname, status: response.status, bytes: Buffer.byteLength(response.html), title, titleLength: title.length, descriptionLength: description.length, h1: $("h1").map((_, e) => $(e).text()).get(), schemaCount, images: $("img").length, links: [...new Set(links)], problems: [...new Set(problems)] };
      } catch (error) { return { path: url.pathname, problems: [error.message] }; }
    })));
  }
  const titles = new Map();
  for (const row of rows) {
    if (titles.has(row.title)) row.problems.push(`Duplicate title with ${titles.get(row.title)}`);
    titles.set(row.title, row.path);
    if (row.path !== "/" && !rows.some(other => other.path !== row.path && other.links?.includes(row.path))) row.problems.push("No inbound link from another sitemap page");
  }
  const report = { checkedAt: new Date().toISOString(), mode: live ? "live" : "build", site, pageCount: rows.length, pagesWithProblems: rows.filter(row => row.problems.length).length, pages: rows };
  const file = path.join(root, "docs", `seo-audit-${live ? "live" : "build"}.json`);
  await fs.writeFile(file, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ pageCount: report.pageCount, pagesWithProblems: report.pagesWithProblems, findings: rows.filter(row => row.problems.length).map(row => ({ path: row.path, problems: row.problems })), report: file }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
