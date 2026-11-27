/**
 * SEO & Structured Metadata Engine for Trinex Systems
 * Formats, validates, and generates search engine optimization tags,
 * Open Graph social previews, and Schema.org JSON-LD structured data.
 */

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteUrl(urlOrPath, baseDomain) {
  const cleanBase = (baseDomain || "https://trinexsystems.in").replace(/\/+$/, "");
  const raw = String(urlOrPath || "").trim();
  if (!raw) return `${cleanBase}/assets/hero-bg.jpg`;
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/^https?:\/\/(www\.)?trinexsystems\.com/i, cleanBase);
  }
  return `${cleanBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function truncateWords(text, maxLen) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced).replace(/[.,;:\s]+$/, "");
}

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
  const baseDomain = (process.env.BASE_URL || "https://trinexsystems.in").replace(/\/+$/, "");

  // Slug
  const slug = product.slug ? slugify(product.slug) : slugify(`${partNumber}-${category}`);

  // Meta Title: Optimized for Google (Part Number first for maximum search ranking)
  const metaTitle = product.metaTitle && product.metaTitle.trim()
    ? product.metaTitle.trim()
    : `${partNumber} - ${category}${complianceSuffix} | Trinex Systems LLP`;

  // Meta Description: 140-160 characters sweet spot with clear call to action
  const descSnippet = truncateWords(description, 95).replace(/\.+$/, "");
  const metaDescription = product.metaDescription && product.metaDescription.trim()
    ? product.metaDescription.trim()
    : `${partNumber} ${category}${complianceSuffix}. ${descSnippet}. In stock with 4-7 days dispatch from Trinex Systems LLP, India.`;

  // Keywords (filter out empty segments cleanly)
  const keywordParts = [
    partNumber,
    category,
    compliance && compliance !== "Standard" ? compliance : "",
    "defence electronics",
    "aerospace grade",
    "mil-spec component",
    "Make in India",
    "Trinex Systems",
  ].filter(Boolean);
  const metaKeywords = product.metaKeywords && product.metaKeywords.trim()
    ? product.metaKeywords.trim()
    : keywordParts.join(", ");

  // Canonical URL (always normalized to active baseDomain)
  const rawCanonical = product.canonicalUrl && product.canonicalUrl.trim()
    ? product.canonicalUrl.trim()
    : `${baseDomain}/products/${slug}`;
  const canonicalUrl = rawCanonical.includes("trinexsystems.com")
    ? `${baseDomain}/products/${slug}`
    : rawCanonical;

  // Robots
  const robots = product.robots || "index, follow";

  // Open Graph
  const ogTitle = product.ogTitle && product.ogTitle.trim()
    ? product.ogTitle.trim()
    : metaTitle;

  const ogDescription = product.ogDescription && product.ogDescription.trim()
    ? product.ogDescription.trim()
    : metaDescription;

  const ogImage = toAbsoluteUrl(product.ogImage || product.image || "/assets/hero-bg.jpg", baseDomain);

  const offer = {
    "@type": "Offer",
    "url": canonicalUrl,
    "availability": Number(product.stock) > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Trinex Systems LLP",
      "url": baseDomain,
    },
  };
  if (product.price !== undefined && product.price !== null && Number(product.price) > 0) {
    offer.priceCurrency = "INR";
    offer.price = String(product.price);
  }

  // Schema.org JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": `${partNumber} - ${category}`,
    "image": [ogImage],
    "description": metaDescription,
    "sku": partNumber,
    "mpn": partNumber,
    "brand": {
      "@type": "Brand",
      "name": "Trinex Systems LLP"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Trinex Systems LLP"
    },
    "category": category,
    "additionalProperty": [
      compliance ? { "@type": "PropertyValue", "name": "Compliance Standard", "value": compliance } : null,
      product.location ? { "@type": "PropertyValue", "name": "Warehouse Location", "value": product.location } : null,
      product.delivery ? { "@type": "PropertyValue", "name": "Dispatch Timeline", "value": product.delivery } : null,
    ].filter(Boolean),
    "offers": offer
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
export function generateSitemapXml({ products = [], categories = [], baseUrl = "https://trinexsystems.in" }) {
  const cleanBase = (baseUrl || "https://trinexsystems.in").replace(/\/+$/, "");
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
      const slug = slugify(p.slug || `${p.partNumber}-${p.category}`);
      return {
        loc: `${cleanBase}/products/${slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split("T")[0] : now,
      };
    });

  const seenLocs = new Set();
  const allUrls = [...staticUrls, ...categoryUrls, ...productUrls].filter((u) => {
    if (!u.loc || seenLocs.has(u.loc)) return false;
    seenLocs.add(u.loc);
    return true;
  });

  const xmlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
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
 * Allows public product/category API endpoints so Googlebot's JS renderer can load catalog data.
 */
export function generateRobotsTxt(baseUrl = "https://trinexsystems.in") {
  const cleanBase = (baseUrl || "https://trinexsystems.in").replace(/\/+$/, "");
  return `# robots.txt for Trinex Systems LLP
User-agent: *
Allow: /
Allow: /api/products
Allow: /api/categories
Disallow: /admin
Disallow: /api/auth
Disallow: /api/upload
Disallow: /api/contact
Disallow: /api/seo/analyze

Sitemap: ${cleanBase}/sitemap.xml
`;
}

/**
 * Render an SEO-complete HTML page for search crawlers and direct URL loads
 */
export function renderSeoHtmlDocument({
  templateHtml,
  routeType,
  product = null,
  category = null,
  categoryKey = "",
  searchQuery = "",
  products = [],
  categories = [],
  baseUrl = "https://trinexsystems.in",
}) {
  const cleanBase = (baseUrl || "https://trinexsystems.in").replace(/\/+$/, "");
  let title = "Trinex Systems LLP | Indigenous Defence, Aerospace & Electronic Components India";
  let description =
    "Trinex Systems LLP delivers reliable, indigenous engineering solutions and ready-to-dispatch military & aerospace electronic components across India.";
  let keywords =
    "Trinex Systems, Indian defence technology, aerospace engineering, mil-spec electronic components, Make in India";
  let canonicalUrl = `${cleanBase}/`;
  let robots = "index, follow, max-image-preview:large, max-snippet:-1";
  let ogType = "website";
  let ogImage = `${cleanBase}/assets/hero-bg.jpg`;
  let schemaGraph = [];
  let ssrBodyHtml = "";

  const visibleCats = (categories || []).filter((c) => !c.isHidden);
  const visibleProds = (products || []).filter((p) => !p.isHidden);

  if (routeType === "not-found") {
    title = "Component Not Found | Trinex Systems LLP";
    description = "The requested electronic component or part number was not found in active stock. Browse our certified defence & aerospace inventory.";
    canonicalUrl = `${cleanBase}/products`;
    robots = "noindex, follow";
    ssrBodyHtml = `
      <main class="max-w-5xl mx-auto px-6 py-16">
        <h1>Component Not Found</h1>
        <p>Browse our complete <a href="/products">certified defence and aerospace electronic components catalog</a>.</p>
      </main>`;
  } else if (routeType === "product" && product) {
    const seo = buildCompleteSeo(product);
    const catKey = product.categoryKey || slugify(product.category || "");
    const related = visibleProds
      .filter((p) => p.slug !== seo.slug && (p.categoryKey === catKey || p.category === product.category))
      .slice(0, 8);

    title = seo.metaTitle;
    description = seo.metaDescription;
    keywords = seo.metaKeywords;
    canonicalUrl = `${cleanBase}/products/${seo.slug}`;
    robots = `${seo.robots}, max-image-preview:large, max-snippet:-1`;
    ogType = "product";
    ogImage = seo.ogImage;

    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${cleanBase}/` },
        { "@type": "ListItem", position: 2, name: "Products", item: `${cleanBase}/products` },
        ...(catKey
          ? [{ "@type": "ListItem", position: 3, name: product.category, item: `${cleanBase}/products?category=${catKey}` }]
          : []),
        { "@type": "ListItem", position: catKey ? 4 : 3, name: product.partNumber, item: canonicalUrl },
      ],
    };

    const productNode = { ...seo.structuredData };
    delete productNode["@context"];
    schemaGraph = [productNode, breadcrumbSchema];

    ssrBodyHtml = `
      <main class="max-w-5xl mx-auto px-6 py-12">
        <nav aria-label="Breadcrumb">
          <a href="/">Home</a> / <a href="/products">Products</a>${catKey ? ` / <a href="/products?category=${escapeHtml(catKey)}">${escapeHtml(product.category)}</a>` : ""} / <span>${escapeHtml(product.partNumber)}</span>
        </nav>
        <h1>${escapeHtml(product.partNumber)} — ${escapeHtml(product.category)}${product.compliance ? ` (${escapeHtml(product.compliance)})` : ""}</h1>
        <p>${escapeHtml(product.description)}</p>
        <dl>
          <dt>Part Number / SKU</dt><dd>${escapeHtml(product.partNumber)}</dd>
          <dt>Category</dt><dd>${escapeHtml(product.category)}</dd>
          <dt>Compliance Standard</dt><dd>${escapeHtml(product.compliance || "MIL-STD / ISO 9001")}</dd>
          <dt>Stock Availability</dt><dd>${Number(product.stock) > 0 ? `${Number(product.stock)} Units In Stock` : "Available for Order"}</dd>
          <dt>Warehouse Location</dt><dd>${escapeHtml(product.location || "Ready Stock (Delhi)")}</dd>
          <dt>Delivery Timeline</dt><dd>${escapeHtml(product.delivery || "4-7 Days Delivery across India")}</dd>
        </dl>
        ${related.length > 0 ? `<section><h2>Related ${escapeHtml(product.category)} Components</h2><ul>${related.map((r) => `<li><a href="/products/${escapeHtml(r.slug || slugify(`${r.partNumber}-${r.category}`))}">${escapeHtml(r.partNumber)} — ${escapeHtml(r.description)}</a></li>`).join("")}</ul></section>` : ""}
      </main>`;
  } else {
    const isSearchPage = Boolean(String(searchQuery || "").trim());
    const activeCatObj = category || visibleCats.find((c) => (c.id || c.key) === categoryKey);
    const catName = activeCatObj ? activeCatObj.name : categoryKey ? categoryKey.toUpperCase() : "";

    if (catName) {
      const catDesc = activeCatObj?.description || `Certified ${catName} for military, defence, and aerospace applications.`;
      title = `${catName} (Mil-Spec Defence Stock) | Trinex Systems LLP`;
      description = `${truncateWords(catDesc, 115)}. Ready stock with 4-7 days delivery across India from Trinex Systems LLP.`;
      keywords = `${catName}, mil-spec ${catName}, defence components India, aerospace electronics, Trinex Systems`;
      canonicalUrl = `${cleanBase}/products?category=${encodeURIComponent(categoryKey || activeCatObj?.id)}`;
      ogImage = toAbsoluteUrl(activeCatObj?.image || "/assets/products/transformers_chokes.jpg", cleanBase);
    } else {
      title = "Strategic Defence Electronic Components & Inventory Stock | Trinex Systems LLP";
      description =
        "Browse ready-to-dispatch military & aerospace electronic components: resistors, capacitors, microcircuits, transistors, diodes, transformers, motors, and connectors from Trinex Systems LLP, India.";
      keywords =
        "mil-spec electronic components India, defence electronics stock, pulse transformers, logic ICs, precision resistors, aerospace connectors, Trinex Systems";
      canonicalUrl = `${cleanBase}/products`;
      ogImage = `${cleanBase}/assets/products/transformers_chokes.jpg`;
    }

    if (isSearchPage) {
      robots = "noindex, follow";
      canonicalUrl = `${cleanBase}/products`;
    }

    const filteredProds = categoryKey
      ? visibleProds.filter((p) => {
          const pk = String(p.categoryKey || "").toLowerCase();
          const ck = String(categoryKey).toLowerCase();
          return pk === ck || pk.replace(/s$/, "") === ck.replace(/s$/, "");
        })
      : visibleProds;

    const itemList = {
      "@type": "ItemList",
      numberOfItems: filteredProds.length,
      itemListElement: filteredProds.slice(0, 50).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${cleanBase}/products/${slugify(p.slug || `${p.partNumber}-${p.category}`)}`,
        name: `${p.partNumber} - ${p.category}`,
      })),
    };

    const collectionPage = {
      "@type": "CollectionPage",
      name: title,
      description,
      url: canonicalUrl,
    };

    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${cleanBase}/` },
        { "@type": "ListItem", position: 2, name: "Products", item: `${cleanBase}/products` },
        ...(catName ? [{ "@type": "ListItem", position: 3, name: catName, item: canonicalUrl }] : []),
      ],
    };

    schemaGraph = [collectionPage, itemList, breadcrumbSchema];

    ssrBodyHtml = `
      <main class="max-w-7xl mx-auto px-6 py-12">
        <nav aria-label="Breadcrumb">
          <a href="/">Home</a> / <a href="/products">Products</a>${catName ? ` / <span>${escapeHtml(catName)}</span>` : ""}
        </nav>
        <h1>${catName ? `${escapeHtml(catName)} — Certified Defence &amp; Aerospace Stock` : "Products &amp; Strategic Electronic Component Inventory"}</h1>
        <p>${escapeHtml(description)}</p>
        <section>
          <h2>Categories</h2>
          <ul>
            <li><a href="/products">All Categories</a></li>
            ${visibleCats.map((c) => `<li><a href="/products?category=${escapeHtml(c.id || c.key)}">${escapeHtml(c.name)} (${Number(c.count) || 0})</a></li>`).join("")}
          </ul>
        </section>
        <section>
          <h2>Available Components (${filteredProds.length})</h2>
          <ul>
            ${filteredProds.map((p) => `<li><a href="/products/${escapeHtml(slugify(p.slug || `${p.partNumber}-${p.category}`))}">${escapeHtml(p.partNumber)} — ${escapeHtml(p.category)} (${escapeHtml(p.compliance || "Mil-Spec")})</a>: ${escapeHtml(p.description)}</li>`).join("")}
          </ul>
        </section>
      </main>`;
  }

  const ldJsonTag = schemaGraph.length
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": schemaGraph })}</script>`
    : "";

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+name="keywords"[^>]*>/i, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  html = html.replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${escapeHtml(ogType)}" />`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
  html = html.replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);

  if (/<meta\s+name="robots"[^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/i, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  } else {
    html = html.replace(/<\/head>/i, `    <meta name="robots" content="${escapeHtml(robots)}" />\n  </head>`);
  }

  if (ldJsonTag) {
    html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, ldJsonTag);
  }

  html = html.replace(/<div\s+id="root"><\/div>/i, `<div id="root">${ssrBodyHtml}</div>`);
  return html;
}
