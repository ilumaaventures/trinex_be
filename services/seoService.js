/**
 * SEO & Structured Metadata Engine for Trinex Systems
 * Formats, validates, and generates search engine optimization tags,
 * Open Graph social previews, and Schema.org JSON-LD structured data.
 */

export function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCompleteSeo(product) {
  const partNumber = (product.partNumber || "Component").trim();
  const category = (product.category || "Defence Electronics").trim();
  const description = (product.description || "Precision defence and aerospace component.").trim();
  const compliance = (product.compliance || "").trim();
  const complianceSuffix = compliance && compliance !== "Standard" ? ` (${compliance})` : "";
  const baseDomain = process.env.BASE_URL || "https://trinexsystems.com";

  // Slug
  const slug = product.slug ? slugify(product.slug) : slugify(`${partNumber}-${category}`);

  // Meta Title: Optimized for Google (Part Number first for maximum search ranking)
  const metaTitle = product.metaTitle && product.metaTitle.trim()
    ? product.metaTitle.trim()
    : `${partNumber} - ${category}${complianceSuffix} | Trinex Systems LLP`;

  // Meta Description: 140-160 characters sweet spot with clear call to action
  const metaDescription = product.metaDescription && product.metaDescription.trim()
    ? product.metaDescription.trim()
    : `${partNumber} ${category}${complianceSuffix}. ${description.slice(0, 100)}. In stock with immediate dispatch from Trinex Systems LLP.`;

  // Keywords
  const metaKeywords = product.metaKeywords && product.metaKeywords.trim()
    ? product.metaKeywords.trim()
    : `${partNumber}, ${category}, ${compliance}, defence electronics, aerospace grade, mil-spec, Make in India, indigenous systems`;

  // Canonical URL
  const canonicalUrl = product.canonicalUrl && product.canonicalUrl.trim()
    ? product.canonicalUrl.trim()
    : `${baseDomain}/products/${slug}`;

  // Robots
  const robots = product.robots || "index, follow";

  // Open Graph
  const ogTitle = product.ogTitle && product.ogTitle.trim()
    ? product.ogTitle.trim()
    : metaTitle;

  const ogDescription = product.ogDescription && product.ogDescription.trim()
    ? product.ogDescription.trim()
    : metaDescription;

  const ogImage = product.ogImage || product.image || `${baseDomain}/assets/hero-bg.jpg`;

  // Schema.org JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": metaTitle,
    "image": [ogImage],
    "description": metaDescription,
    "sku": partNumber,
    "mpn": partNumber,
    "brand": {
      "@type": "Brand",
      "name": "Trinex Systems LLP"
    },
    "category": category,
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "INR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Trinex Systems LLP"
      }
    }
  };

  // Focus Keyword
  const focusKeyword = product.focusKeyword && product.focusKeyword.trim()
    ? product.focusKeyword.trim()
    : `${partNumber}`;

  // SEO Health Audit
  const lowerKeyword = focusKeyword.toLowerCase();
  const keywordInTitle = Boolean(focusKeyword && metaTitle.toLowerCase().includes(lowerKeyword));
  const keywordInDesc = Boolean(focusKeyword && metaDescription.toLowerCase().includes(lowerKeyword));
  const keywordInSlug = Boolean(focusKeyword && slug.toLowerCase().includes(slugify(lowerKeyword)));

  const healthChecks = {
    hasTitle: Boolean(metaTitle && metaTitle.length >= 30 && metaTitle.length <= 65),
    hasDescription: Boolean(metaDescription && metaDescription.length >= 100 && metaDescription.length <= 165),
    hasSlug: Boolean(slug && slug.length > 2),
    hasKeywords: Boolean(metaKeywords && metaKeywords.includes(",")),
    hasFocusKeyword: Boolean(focusKeyword && focusKeyword.length > 1),
    keywordInTitle,
    keywordInDesc,
    hasImage: Boolean(product.image || ogImage),
  };

  const scoreItems = Object.values(healthChecks);
  const healthScore = Math.round((scoreItems.filter(Boolean).length / scoreItems.length) * 100);

  return {
    focusKeyword,
    metaTitle,
    metaDescription,
    metaKeywords,
    slug,
    canonicalUrl,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    structuredData,
    seoHealth: {
      score: healthScore,
      checks: healthChecks,
      status: healthScore >= 80 ? "EXCELLENT" : healthScore >= 60 ? "GOOD" : "NEEDS_OPTIMIZATION"
    }
  };
}

/**
 * Generate XML Sitemap string compliant with Google Search Console sitemap protocol
 */
export function generateSitemapXml({ products = [], categories = [], baseUrl = "https://trinexsystems.com" }) {
  const cleanBase = (baseUrl || "https://trinexsystems.com").replace(/\/+$/, "");
  const now = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: `${cleanBase}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${cleanBase}/products`, priority: "0.9", changefreq: "daily" },
  ];

  const categoryUrls = categories
    .filter((c) => !c.isHidden)
    .map((c) => ({
      loc: `${cleanBase}/products?category=${c.id || c.key || slugify(c.name)}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : now,
    }));

  const hiddenCategoryKeys = new Set(
    categories.filter((c) => c.isHidden).map((c) => String(c.id || c.key || "").toLowerCase())
  );

  const productUrls = products
    .filter((p) => !p.isHidden && !hiddenCategoryKeys.has(String(p.categoryKey || "").toLowerCase()))
    .map((p) => {
      const slug = p.slug || slugify(`${p.partNumber}-${p.category}`);
      return {
        loc: `${cleanBase}/products/${slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : now,
      };
    });

  const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

  const xmlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generate robots.txt string pointing search crawlers to sitemap
 */
export function generateRobotsTxt(baseUrl = "https://trinexsystems.com") {
  const cleanBase = (baseUrl || "https://trinexsystems.com").replace(/\/+$/, "");
  return `# robots.txt for Trinex Systems LLP
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${cleanBase}/sitemap.xml
`;
}
