import express from "express";
import {
  buildCompleteSeo,
  generateSitemapXml,
  generateRobotsTxt
} from "../services/seoService.js";
import { readProducts, readCategories } from "../services/storageService.js";

const router = express.Router();

/**
 * GET /api/seo/sitemap.xml
 * Returns Google Search Console XML sitemap for all products & categories
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await readProducts();
    const categories = await readCategories();
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.com";

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
  const baseUrl = process.env.BASE_URL || "https://trinexsystems.com";
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
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.com";

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

export default router;
