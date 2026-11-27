import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCompleteSeo,
  generateSitemapXml,
  generateRobotsTxt,
  renderSeoHtmlDocument,
} from "../services/seoService.js";
import {
  readProducts,
  readCategories,
  getProductById,
} from "../services/storageService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const FALLBACK_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trinex Systems LLP</title>
    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://trinexsystems.in/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://trinexsystems.in/" />
    <meta property="og:title" content="" />
    <meta property="og:description" content="" />
    <meta property="og:image" content="https://trinexsystems.in/assets/hero-bg.jpg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="" />
    <meta name="twitter:description" content="" />
    <meta name="twitter:image" content="https://trinexsystems.in/assets/hero-bg.jpg" />
    <script type="application/ld+json">{}</script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

async function loadFrontendTemplate() {
  const candidates = [
    path.join(__dirname, "..", "..", "trinex", "dist", "index.html"),
    path.join(__dirname, "..", "..", "trinex", "index.html"),
  ];
  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate, "utf-8");
    } catch {
      // try next
    }
  }
  return FALLBACK_TEMPLATE;
}

/**
 * GET /api/seo/sitemap.xml
 * Returns Google Search Console XML sitemap for all products & categories
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await readProducts();
    const categories = await readCategories();
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.in";

    const xml = generateSitemapXml({ products, categories, baseUrl });
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    res.send(xml);
  } catch (err) {
    res.status(500).send(`<!-- Error generating sitemap: ${err.message} -->`);
  }
});

/**
 * GET /api/seo/robots.txt
 * Returns search engine crawl rules & pointer to sitemap.xml
 */
router.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.BASE_URL || "https://trinexsystems.in";
  const txt = generateRobotsTxt(baseUrl);
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.send(txt);
});

/**
 * GET /api/seo/summary
 * Returns SEO stats for dashboard (total indexed URLs, sitemap link, health)
 */
router.get("/summary", async (req, res) => {
  try {
    const products = await readProducts();
    const categories = await readCategories();
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.in";

    const visibleProducts = products.filter((p) => !p.isHidden);
    const visibleCategories = categories.filter((c) => !c.isHidden);
    const totalIndexedUrls = 2 + visibleCategories.length + visibleProducts.length;

    res.json({
      success: true,
      data: {
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        robotsUrl: `${baseUrl}/robots.txt`,
        totalIndexedUrls,
        staticPagesCount: 2,
        categoriesCount: visibleCategories.length,
        productsCount: visibleProducts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/seo/analyze
 * Analyzes and returns complete SEO metadata & SERP previews for any draft product payload
 */
router.post("/analyze", (req, res) => {
  try {
    const productPayload = req.body || {};
    const seoResult = buildCompleteSeo(productPayload);
    res.json({
      success: true,
      data: seoResult
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate SEO preview",
      error: err.message
    });
  }
});

/**
 * GET /api/seo/render
 * Renders SEO-complete HTML with dynamic <head> tags, JSON-LD, and semantic SSR body
 */
router.get("/render", async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.in";
    const route = String(req.query.route || "products").toLowerCase();
    const slug = String(req.query.slug || "").trim();
    const categoryKey = String(req.query.category || "").trim();
    const searchQuery = String(req.query.search || "").trim();

    const [templateHtml, categories, allProducts] = await Promise.all([
      loadFrontendTemplate(),
      readCategories(),
      readProducts({ visibleOnly: true }),
    ]);

    const products = Array.isArray(allProducts) ? allProducts : [];

    if (route === "product" && slug) {
      const product = await getProductById(slug);
      if (!product || product.isHidden) {
        const html = renderSeoHtmlDocument({
          templateHtml,
          routeType: "not-found",
          categories,
          products,
          baseUrl,
        });
        res.status(404).header("Content-Type", "text/html; charset=utf-8").send(html);
        return;
      }

      const html = renderSeoHtmlDocument({
        templateHtml,
        routeType: "product",
        product,
        categories,
        products,
        baseUrl,
      });
      res
        .header("Content-Type", "text/html; charset=utf-8")
        .header("Cache-Control", "public, max-age=60, s-maxage=300")
        .send(html);
      return;
    }

    const html = renderSeoHtmlDocument({
      templateHtml,
      routeType: "products",
      categoryKey,
      searchQuery,
      categories,
      products,
      baseUrl,
    });
    res
      .header("Content-Type", "text/html; charset=utf-8")
      .header("Cache-Control", "public, max-age=60, s-maxage=300")
      .send(html);
  } catch (err) {
    res.status(500).send(`<!-- Error rendering SEO HTML: ${err.message} -->`);
  }
});

export default router;
