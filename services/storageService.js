import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { buildCompleteSeo, slugify, generateSitemapXml, generateRobotsTxt } from "./seoService.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { isMongoConnected, connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Initial seed catalog
 */
const DEFAULT_INITIAL_PRODUCTS = [
  {
    partNumber: "TPP--95-40-400",
    category: "TRANSFORMER",
    categoryKey: "transformers",
    image: "/assets/products/transformers_chokes.jpg",
    description: "Precision aerospace transformer, high-frequency 400Hz pulse coupling module",
    stock: 2,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-STD-883 / ISO 9001",
    isHidden: false,
  },
  {
    partNumber: "TPP-21-40-400",
    category: "TRANSFORMER",
    categoryKey: "transformers",
    image: "/assets/products/transformers_chokes.jpg",
    description: "Compact military pulse transformer for aerospace electronic subsystems",
    stock: 2,
    location: "Central Stock",
    delivery: "4â€“7 Days Delivery",
    compliance: "MIL-STD-883",
  },
  {
    partNumber: "249KP1",
    category: "MICRO CIRCUIT",
    categoryKey: "microcircuits",
    image: "/assets/products/microcircuits.jpg",
    description: "Hermetic ceramic multi-channel optoelectronic switch / driver IC",
    stock: 150,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-STD-883 Class B",
  },
  {
    partNumber: "530TV9",
    category: "MICRO CIRCUIT",
    categoryKey: "microcircuits",
    image: "/assets/products/microcircuits.jpg",
    description: "Military-grade ceramic dual JK flip-flop digital logic IC",
    stock: 35,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-STD-883",
  },
  {
    partNumber: "2N2222A",
    category: "TRANSISTOR",
    categoryKey: "transistors-diodes",
    image: "/assets/products/diodes_transistors.jpg",
    description: "High-reliability NPN switching transistor in hermetic metal TO-18 can",
    stock: 500,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-PRF-19500",
  },
  {
    partNumber: "2N3055",
    category: "POWER TRANSISTOR",
    categoryKey: "transistors-diodes",
    image: "/assets/products/diodes_transistors.jpg",
    description: "Complementary silicon high-power audio/linear switching transistor in TO-3 can",
    stock: 120,
    location: "Central Stock",
    delivery: "2â€“4 Days Delivery",
    compliance: "JANTX Standard",
  },
  {
    partNumber: "SMR-100K-0.1%",
    category: "RESISTOR",
    categoryKey: "resistors",
    image: "/assets/products/resistors.jpg",
    description: "Ultra-precision metal film resistor, 0.1% tolerance, ultra-low temperature coefficient",
    stock: 850,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-PRF-55342",
  },
  {
    partNumber: "CSR13-100UF-50V",
    category: "CAPACITOR",
    categoryKey: "capacitors",
    image: "/assets/products/capacitors.jpg",
    description: "Hermetically sealed solid tantalum electrolytic capacitor for high-reliability radar circuits",
    stock: 75,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-PRF-39003",
  },
  {
    partNumber: "D38999/20WJ35PN",
    category: "CONNECTOR",
    categoryKey: "connectors",
    image: "/assets/products/connectors.jpg",
    description: "Series III circular receptacle connector, 128-pin gold plated contacts, olive drab cadmium",
    stock: 14,
    location: "Ready Stock (Delhi)",
    delivery: "Immediate Dispatch",
    compliance: "MIL-DTL-38999",
  },
  {
    partNumber: "D38999/26WJ61SN",
    category: "CONNECTOR",
    categoryKey: "connectors",
    image: "/assets/products/connectors.jpg",
    description: "Hermetic high-density circular plug with EMI ground spring, 61 socket pins",
    stock: 8,
    location: "Central Stock",
    delivery: "3â€“5 Days Delivery",
    compliance: "MIL-DTL-38999 Series III",
  },
];

/**
 * In pure database mode, MongoDB is the single source of truth.
 * syncLocalBackups is a no-op so no local JSON files are created or maintained in the codebase.
 */
export async function syncLocalBackups() {
  return;
}

/**
 * Automatically refresh static sitemap.xml and robots.txt in public folders
 */
export async function refreshSitemapFiles() {
  try {
    if (!isMongoConnected()) {
      try {
        await connectDB();
      } catch {
        // connectDB failed or in offline mode
      }
    }

    const products = await readProducts();
    const categories = await readCategories();
    const baseUrl = process.env.BASE_URL || "https://trinexsystems.in";
    const xml = generateSitemapXml({ products, categories, baseUrl });
    const robots = generateRobotsTxt(baseUrl);

    // Write to backend public directory
    const adminPublicDir = path.join(__dirname, "..", "public");
    await fs.writeFile(path.join(adminPublicDir, "sitemap.xml"), xml, "utf-8").catch(() => { });
    await fs.writeFile(path.join(adminPublicDir, "robots.txt"), robots, "utf-8").catch(() => { });

    // Write to frontend public directory
    const fePublicDir = path.join(__dirname, "..", "..", "trinex", "public");
    await fs.writeFile(path.join(fePublicDir, "sitemap.xml"), xml, "utf-8").catch(() => { });
    await fs.writeFile(path.join(fePublicDir, "robots.txt"), robots, "utf-8").catch(() => { });

    // Write to frontend dist directory (if built)
    const feDistDir = path.join(__dirname, "..", "..", "trinex", "dist");
    try {
      await fs.access(feDistDir);
      await fs.writeFile(path.join(feDistDir, "sitemap.xml"), xml, "utf-8").catch(() => { });
      await fs.writeFile(path.join(feDistDir, "robots.txt"), robots, "utf-8").catch(() => { });
    } catch {
      // dist folder doesn't exist yet, ignore
    }

    console.log(
      `[Sitemap] Auto-updated sitemap.xml with ${products.filter((p) => !p.isHidden).length
      } live products and ${categories.filter((c) => !c.isHidden).length} categories.`
    );
  } catch (err) {
    console.warn("[Sitemap] Failed to auto-refresh sitemap files:", err.message);
  }
}

/**
 * Initialize MongoDB or File Storage
 */
export async function initStorage() {
  if (isMongoConnected()) {
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log("[MongoDB] Database empty. Seeding minimal initial products...");
        const docs = DEFAULT_INITIAL_PRODUCTS.map((item) => ({
          ...item,
          ...buildCompleteSeo(item),
        }));
        await Product.insertMany(docs);
        console.log(`[MongoDB] Initialized database with ${docs.length} products.`);
      }

      // Seed categories in MongoDB if empty
      const catCount = await Category.countDocuments();
      if (catCount === 0) {
        const defaultCats = [
          { id: "resistors", name: "Resistors", subtitle: "Precision & Power Resistors", icon: "sliders", isHidden: false },
          { id: "capacitors", name: "Capacitors", subtitle: "Tantalum, Ceramic & Film", icon: "box", isHidden: false },
          { id: "microcircuits", name: "Microcircuits", subtitle: "Logic & Digital ICs", icon: "cpu", isHidden: false },
          { id: "transistors-diodes", name: "Diodes & Transistors", subtitle: "Power Transistors & Zener Diodes", icon: "zap", isHidden: false },
          { id: "connectors", name: "Connectors", subtitle: "Mil-Spec Multi-Pin Connectors", icon: "link", isHidden: false },
          { id: "motors-generators", name: "Motors & Generators", subtitle: "Precision Servo Motors", icon: "disc", isHidden: false },
          { id: "transformers", name: "Transformers & Power", subtitle: "Transformers, Power Units & Chokes", icon: "layers", isHidden: false },
          { id: "switches-relays", name: "Switches & Protection", subtitle: "Switches, Fuses & Indicators", icon: "toggle-left", isHidden: false },
        ];
        await Category.insertMany(defaultCats);
        console.log(`[MongoDB] Initialized database with ${defaultCats.length} default categories.`);
      }

      await refreshSitemapFiles();
      return;
    } catch (err) {
      console.error("[MongoDB] Error initializing products/categories:", err);
    }
  }
}

/**
 * Read Products (Supports search, category, location, stock, visibility, and pagination)
 */
export async function readProducts(queryFilter = {}) {
  const isPaginated = queryFilter.page !== undefined || queryFilter.limit !== undefined;
  const page = Math.max(1, parseInt(queryFilter.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryFilter.limit, 10) || 20));
  const skip = (page - 1) * limit;

  if (isMongoConnected()) {
    try {
      const mongoFilter = {};

      if (queryFilter.visibleOnly === "true" || queryFilter.visibleOnly === true) {
        mongoFilter.isHidden = { $ne: true };
        try {
          const hiddenCats = await Category.find({ isHidden: true }, { id: 1 });
          if (hiddenCats.length > 0) {
            const hiddenKeys = hiddenCats.map((c) => c.id);
            mongoFilter.categoryKey = { $nin: hiddenKeys };
          }
        } catch (catErr) {
          console.warn("[MongoDB] Error querying hidden categories:", catErr.message);
        }
      }

      if (queryFilter.category && queryFilter.category !== "all") {
        const rawCat = String(queryFilter.category).trim();
        const catRegex = new RegExp(`^${escapeRegex(rawCat.replace(/s$/i, ""))}s?$`, "i");
        const matchedCat = await Category.findOne({
          $or: [{ id: new RegExp(`^${escapeRegex(rawCat)}$`, "i") }, { name: new RegExp(`^${escapeRegex(rawCat)}$`, "i") }],
        }).lean().catch(() => null);

        const orMatchers = [
          { categoryKey: catRegex },
          { category: catRegex },
        ];
        if (matchedCat) {
          orMatchers.push({ categoryKey: new RegExp(`^${escapeRegex(matchedCat.id)}$`, "i") });
          orMatchers.push({ category: new RegExp(`^${escapeRegex(matchedCat.name)}$`, "i") });
          const singularName = String(matchedCat.name || "").replace(/s$/i, "").trim();
          if (singularName) {
            orMatchers.push({ category: new RegExp(`^${escapeRegex(singularName)}s?$`, "i") });
          }
        }
        mongoFilter.$and = [...(mongoFilter.$and || []), { $or: orMatchers }];
      }

      if (queryFilter.location && queryFilter.location !== "all") {
        mongoFilter.location = { $regex: escapeRegex(queryFilter.location), $options: "i" };
      }

      if (queryFilter.minStock !== undefined) {
        mongoFilter.stock = { ...mongoFilter.stock, $gte: Number(queryFilter.minStock) };
      }

      if (queryFilter.maxStock !== undefined) {
        mongoFilter.stock = { ...mongoFilter.stock, $lte: Number(queryFilter.maxStock) };
      }

      if (queryFilter.search) {
        const q = escapeRegex(queryFilter.search.trim());
        mongoFilter.$and = [
          ...(mongoFilter.$and || []),
          {
            $or: [
              { partNumber: { $regex: q, $options: "i" } },
              { category: { $regex: q, $options: "i" } },
              { description: { $regex: q, $options: "i" } },
              { metaTitle: { $regex: q, $options: "i" } },
              { metaKeywords: { $regex: q, $options: "i" } },
              { focusKeyword: { $regex: q, $options: "i" } },
            ],
          },
        ];
      }

      if (isPaginated) {
        const [totalItems, docs] = await Promise.all([
          Product.countDocuments(mongoFilter),
          Product.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ]);
        const totalPages = Math.ceil(totalItems / limit) || 1;
        return {
          products: docs.map((d) => d.toJSON()),
          pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      }

      const docs = await Product.find(mongoFilter).sort({ createdAt: -1 });
      return docs.map((d) => d.toJSON());
    } catch (err) {
      console.warn("[MongoDB] Error querying products, falling back to JSON file:", err.message);
    }
  }

  // Fallback to JSON file
  await initStorage();
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
    let items = JSON.parse(raw);

    if (queryFilter.visibleOnly === "true" || queryFilter.visibleOnly === true) {
      try {
        const cats = await readCategories();
        const hiddenCatIds = new Set(cats.filter((c) => c.isHidden).map((c) => c.id));
        items = items.filter((p) => !p.isHidden && !hiddenCatIds.has(p.categoryKey));
      } catch {
        items = items.filter((p) => !p.isHidden);
      }
    }

    if (queryFilter.category && queryFilter.category !== "all") {
      items = items.filter((p) => p.categoryKey === queryFilter.category);
    }
    if (queryFilter.location && queryFilter.location !== "all") {
      items = items.filter((p) => p.location?.toLowerCase().includes(queryFilter.location.toLowerCase()));
    }
    if (queryFilter.minStock !== undefined) {
      items = items.filter((p) => Number(p.stock) >= Number(queryFilter.minStock));
    }
    if (queryFilter.maxStock !== undefined) {
      items = items.filter((p) => Number(p.stock) <= Number(queryFilter.maxStock));
    }
    if (queryFilter.search) {
      const q = queryFilter.search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.partNumber?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.metaTitle?.toLowerCase().includes(q) ||
          p.metaKeywords?.toLowerCase().includes(q) ||
          p.focusKeyword?.toLowerCase().includes(q)
      );
    }

    if (isPaginated) {
      const totalItems = items.length;
      const totalPages = Math.ceil(totalItems / limit) || 1;
      const paginatedItems = items.slice(skip, skip + limit);
      return {
        products: paginatedItems,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    return items;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn("Notice: products data file not present or unreadable:", err.message);
    }
    return isPaginated
      ? {
          products: [],
          pagination: {
            totalItems: 0,
            totalPages: 1,
            currentPage: page,
            limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        }
      : [];
  }
}

/**
 * Get Product by ID, slug, or partNumber
 */
export async function getProductById(id) {
  const strId = String(id || "").trim();
  if (!strId) return null;

  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(strId) && strId.length === 24) {
        const doc = await Product.findById(strId);
        if (doc) return doc.toJSON();
      }
      const bySlugOrPart = await Product.findOne({
        $or: [
          { slug: strId },
          { partNumber: new RegExp(`^${escapeRegex(strId)}$`, "i") },
        ],
      });
      if (bySlugOrPart) return bySlugOrPart.toJSON();
    } catch {
      // Fallback to list lookup
    }
  }

  const items = await readProducts();
  return (
    items.find(
      (p) =>
        String(p.id) === strId ||
        String(p._id) === strId ||
        String(p.slug || "").toLowerCase() === strId.toLowerCase() ||
        String(p.partNumber || "").toLowerCase() === strId.toLowerCase()
    ) || null
  );
}

/**
 * Create Product
 */
export async function createProduct(payload) {
  let categoryKey = (payload.categoryKey || "").trim();
  let category = (payload.category || "").trim();

  // If one is missing, derive from the other
  if (categoryKey && !category) {
    const cats = await readCategories();
    const matched = cats.find((c) => (c.id || c.key) === categoryKey);
    category = matched ? matched.name : categoryKey.toUpperCase();
  } else if (category && !categoryKey) {
    categoryKey = slugify(category);
  }

  const enhancedPayload = {
    ...payload,
    category,
    categoryKey,
  };

  const seoData = buildCompleteSeo(enhancedPayload);
  const data = {
    ...enhancedPayload,
    ...seoData,
    stock: Number(payload.stock) || 0,
  };

  if (isMongoConnected()) {
    try {
      const doc = await Product.create(data);
      console.log(`[MongoDB] Created product SKU: ${doc.partNumber} (_id: ${doc._id})`);
      await syncLocalBackups();
      await refreshSitemapFiles();
      return doc.toJSON();
    } catch (err) {
      console.warn("[MongoDB] Create failed, falling back to file:", err.message);
    }
  }

  // File fallback
  const items = await readProducts();
  const newProduct = {
    ...data,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.unshift(newProduct);
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(items, null, 2), "utf-8");
  await refreshSitemapFiles();
  return newProduct;
}

/**
 * Update Product
 */
export async function updateProduct(id, payload) {
  let existingDoc = null;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(String(id)) && String(id).length === 24) {
        existingDoc = await Product.findById(id).lean();
      }
      if (!existingDoc) {
        existingDoc = await Product.findOne({
          $or: [{ id: String(id) }, { partNumber: String(id) }],
        }).lean();
      }
    } catch {
      // ignore lookup error
    }
  }

  let categoryKey = payload.categoryKey !== undefined ? String(payload.categoryKey).trim() : existingDoc?.categoryKey;
  let category = payload.category !== undefined ? String(payload.category).trim() : existingDoc?.category;

  if (categoryKey && !category) {
    const cats = await readCategories();
    const matched = cats.find((c) => (c.id || c.key) === categoryKey);
    category = matched ? matched.name : categoryKey.toUpperCase();
  } else if (category && !categoryKey) {
    categoryKey = slugify(category);
  }

  const enhancedPayload = {
    ...(existingDoc || {}),
    ...payload,
    ...(category !== undefined ? { category } : {}),
    ...(categoryKey !== undefined ? { categoryKey } : {}),
  };

  const seoData = buildCompleteSeo(enhancedPayload);
  const updateData = {
    ...payload,
    ...(category !== undefined ? { category } : {}),
    ...(categoryKey !== undefined ? { categoryKey } : {}),
    ...seoData,
    ...(payload.stock !== undefined ? { stock: Number(payload.stock) } : {}),
  };

  if (isMongoConnected()) {
    try {
      let updatedDoc = null;
      try {
        updatedDoc = await Product.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });
      } catch {
        // id might not be ObjectId
      }
      if (!updatedDoc) {
        updatedDoc = await Product.findOneAndUpdate(
          { $or: [{ id: String(id) }, { partNumber: String(id) }] },
          updateData,
          { new: true, runValidators: true }
        );
      }
      if (updatedDoc) {
        console.log(`[MongoDB] Updated product SKU: ${updatedDoc.partNumber}`);
        setImmediate(() => {
          syncLocalBackups().catch((e) => console.warn("[Backup] Background sync error:", e.message));
          refreshSitemapFiles().catch((e) => console.warn("[Sitemap] Background refresh error:", e.message));
        });
        return updatedDoc.toJSON();
      }
    } catch (err) {
      console.warn("[MongoDB] Update failed, trying fallback:", err.message);
    }
  }

  // File fallback
  const items = await readProducts();
  const idx = items.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;

  items[idx] = {
    ...items[idx],
    ...updateData,
    id: items[idx].id,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(items, null, 2), "utf-8");
  await refreshSitemapFiles();
  return items[idx];
}

/**
 * Delete Product
 */
export async function deleteProduct(id) {
  if (isMongoConnected()) {
    try {
      let result = null;
      try {
        result = await Product.findByIdAndDelete(id);
      } catch {
        // id might not be ObjectId
      }
      if (!result) {
        result = await Product.findOneAndDelete({
          $or: [{ id: String(id) }, { partNumber: String(id) }, { slug: String(id) }],
        });
      }
      if (result) {
        console.log(`[MongoDB] Deleted product: ${id}`);
        await syncLocalBackups();
        await refreshSitemapFiles();
        return true;
      }
    } catch (err) {
      console.warn("[MongoDB] Delete failed:", err.message);
    }
  }

  // File fallback
  const items = await readProducts();
  const filtered = items.filter((p) => String(p.id) !== String(id));
  if (filtered.length === items.length) return false;

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  await refreshSitemapFiles();
  return true;
}

/**
 * Reset Catalog to Factory Defaults
 */
export async function resetCatalog() {
  const docs = DEFAULT_INITIAL_PRODUCTS.map((item) => ({
    ...item,
    ...buildCompleteSeo(item),
  }));

  if (isMongoConnected()) {
    try {
      await Product.deleteMany({});
      const inserted = await Product.insertMany(docs);
      console.log(`[MongoDB] Catalog reset. Inserted ${inserted.length} default items.`);
      await refreshSitemapFiles();
      return inserted.map((d) => d.toJSON());
    } catch (err) {
      console.warn("[MongoDB] Reset failed:", err.message);
    }
  }

  return docs;
}

/**
 * Sync and Optimize SEO for All Products in MongoDB
 */
export async function syncAllSeo() {
  let updatedCount = 0;
  let allProducts = [];

  if (isMongoConnected()) {
    try {
      const docs = await Product.find({});
      for (const doc of docs) {
        const enhancedSeo = buildCompleteSeo(doc.toObject());
        await Product.findByIdAndUpdate(doc._id, {
          ...enhancedSeo,
        });
        updatedCount++;
      }
      const updatedDocs = await Product.find({}).sort({ createdAt: -1 });
      allProducts = updatedDocs.map((d) => d.toJSON());
      console.log(`[MongoDB] SEO synced across ${updatedCount} products.`);
    } catch (err) {
      console.warn("[MongoDB] Error syncing SEO in MongoDB:", err.message);
    }
  }

  await refreshSitemapFiles();

  return {
    success: true,
    count: updatedCount || allProducts.length,
    message: `Successfully audited and optimized SEO metadata for ${updatedCount || allProducts.length} products.`,
  };
}

/**
 * Retrieve Catalog Statistics
 */
export async function getStats() {
  const categories = await readCategories();

  if (isMongoConnected()) {
    try {
      const total = await Product.countDocuments();
      const readyStockDelhi = await Product.countDocuments({
        location: { $regex: "delhi", $options: "i" },
      });

      const qtyAgg = await Product.aggregate([
        { $group: { _id: null, totalQty: { $sum: "$stock" } } },
      ]);
      const totalStockQty = qtyAgg.length > 0 ? qtyAgg[0].totalQty : 0;

      const seoOptimized = await Product.countDocuments({
        metaTitle: { $exists: true, $ne: "" },
        metaDescription: { $exists: true, $ne: "" },
        slug: { $exists: true, $ne: "" },
      });

      const seoHealthScore = total > 0 ? Math.round((seoOptimized / total) * 100) : 0;

      return {
        totalProducts: total,
        readyStockDelhi,
        totalStockQty,
        categoryCount: categories.length,
        seoHealthScore,
        categories,
        storageEngine: "MongoDB (mongodb://127.0.0.1:27017/trinix)",
      };
    } catch (err) {
      console.warn("[MongoDB] Error calculating stats, using fallback:", err.message);
    }
  }

  // File fallback
  const products = await readProducts();
  const total = products.length;
  const readyStockDelhi = products.filter((p) =>
    p.location?.toLowerCase().includes("delhi")
  ).length;
  const totalStockQty = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const seoOptimized = products.filter(
    (p) => p.metaTitle && p.metaDescription && p.slug
  ).length;

  return {
    totalProducts: total,
    readyStockDelhi,
    totalStockQty,
    categoryCount: categories.length,
    seoHealthScore: total > 0 ? Math.round((seoOptimized / total) * 100) : 0,
    categories,
    storageEngine: "JSON File System",
  };
}

function matchesCategoryProduct(p, catId, catName) {
  if (!p) return false;
  const cId = String(catId || "").trim().toLowerCase();
  const cName = String(catName || "").trim().toLowerCase();
  const cSlug = slugify(catName || catId || "");

  const pKey = String(p.categoryKey || "").trim().toLowerCase();
  const pCat = String(p.category || "").trim().toLowerCase();
  const pSlug = slugify(p.category || p.categoryKey || "");

  const targets = new Set([
    cId,
    cId.replace(/s$/, ""),
    cName,
    cName.replace(/s$/, ""),
    cSlug,
    cSlug.replace(/s$/, ""),
  ]);

  if (pKey && (targets.has(pKey) || targets.has(pKey.replace(/s$/, "")))) return true;
  if (pCat && (targets.has(pCat) || targets.has(pCat.replace(/s$/, "")))) return true;
  if (pSlug && (targets.has(pSlug) || targets.has(pSlug.replace(/s$/, "")))) return true;

  return false;
}

export async function readCategories() {
  if (isMongoConnected()) {
    try {
      const [cats, allProducts] = await Promise.all([
        Category.find().sort({ createdAt: 1 }),
        Product.find().lean(),
      ]);
      if (cats.length > 0) {
        return cats.map((c) => {
          const json = c.toJSON();
          const count = allProducts.filter((p) =>
            !p.isHidden && matchesCategoryProduct(p, json.id || json._id, json.name)
          ).length;
          json.count = count;
          return json;
        });
      }
    } catch (err) {
      console.warn("[MongoDB] Error reading categories:", err.message);
    }
  }

  try {
    const raw = await fs.readFile(CATEGORIES_FILE, "utf-8");
    const cats = JSON.parse(raw);
    try {
      const prodRaw = await fs.readFile(PRODUCTS_FILE, "utf-8");
      const prods = JSON.parse(prodRaw);

      return cats.map((c) => {
        const count = prods.filter((p) =>
          !p.isHidden && matchesCategoryProduct(p, c.id || c._id, c.name)
        ).length;
        return {
          ...c,
          count,
        };
      });
    } catch {
      return cats;
    }
  } catch {
    return [];
  }
}

export async function createCategory(catData) {
  const name = (catData.name || "").trim();
  if (!name) throw new Error("Category name is required");

  const id = catData.id ? slugify(catData.id) : slugify(name);
  const data = {
    ...catData,
    id,
    name,
    subtitle: catData.subtitle ? catData.subtitle.trim() : "",
    description: catData.description ? catData.description.trim() : "",
    image: catData.image || "/assets/products/transformers_chokes.jpg",
    count: 0,
  };

  if (isMongoConnected()) {
    try {
      const existing = await Category.findOne({ id });
      if (existing) {
        throw new Error(`Category with ID '${id}' already exists.`);
      }
      const created = await Category.create(data);
      console.log(`[MongoDB] Created category '${created.name}' (${created.id})`);
      await syncLocalBackups();
      await refreshSitemapFiles();
      return created.toJSON();
    } catch (err) {
      console.error("[MongoDB] Failed to create category:", err.message);
      throw err;
    }
  }

  // File fallback
  const cats = await readCategories();
  if (cats.some((c) => c.id === id)) {
    throw new Error(`Category with ID '${id}' already exists.`);
  }
  cats.push(data);
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify(cats, null, 2), "utf-8");
  await refreshSitemapFiles();
  return data;
}

export async function updateCategory(id, catData) {
  if (!id) return null;
  const strId = String(id).trim();

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(strId) && strId.length === 24;
      const safeIdRegex = new RegExp(`^${escapeRegex(strId)}$`, "i");
      const query = isObjectId
        ? { $or: [{ _id: strId }, { id: safeIdRegex }] }
        : { id: safeIdRegex };

      let updated = await Category.findOneAndUpdate(
        query,
        { $set: catData },
        { new: true }
      );
      if (updated) {
        // If slug changed, cascade update to products
        if (catData.id && String(catData.id).toLowerCase() !== strId.toLowerCase()) {
          await Product.updateMany(
            { categoryKey: safeIdRegex },
            { $set: { categoryKey: catData.id } }
          );
        }
        setImmediate(() => {
          syncLocalBackups().catch((e) => console.warn("[Backup] Background sync error:", e.message));
          refreshSitemapFiles().catch((e) => console.warn("[Sitemap] Background refresh error:", e.message));
        });
        return updated.toJSON();
      }
    } catch (err) {
      console.error("[MongoDB] Failed to update category:", err.message);
    }
  }

  const cats = await readCategories();
  const idx = cats.findIndex(
    (c) => String(c.id).toLowerCase() === strId.toLowerCase() || String(c._id) === strId
  );
  if (idx >= 0) {
    cats[idx] = { ...cats[idx], ...catData };
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(cats, null, 2), "utf-8");
    setImmediate(() => {
      refreshSitemapFiles().catch((e) => console.warn("[Sitemap] Background refresh error:", e.message));
    });
    return cats[idx];
  }
  return null;
}

export async function deleteCategory(id) {
  if (!id) return false;
  const strId = String(id).trim();

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(strId) && strId.length === 24;
      const safeIdRegex = new RegExp(`^${escapeRegex(strId)}$`, "i");
      const query = isObjectId
        ? { $or: [{ _id: strId }, { id: safeIdRegex }] }
        : { id: safeIdRegex };

      const res = await Category.findOneAndDelete(query);
      if (res) {
        console.log(`[MongoDB] Deleted category '${id}'`);
        setImmediate(() => {
          syncLocalBackups().catch((e) => console.warn("[Backup] Background sync error:", e.message));
          refreshSitemapFiles().catch((e) => console.warn("[Sitemap] Background refresh error:", e.message));
        });
        return true;
      }
    } catch (err) {
      console.error("[MongoDB] Failed to delete category:", err.message);
    }
  }

  const cats = await readCategories();
  const filtered = cats.filter(
    (c) => String(c.id).toLowerCase() !== strId.toLowerCase() && String(c._id) !== strId
  );
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  await refreshSitemapFiles();
  return true;
}

export async function toggleProductVisibility(id) {
  if (!id) throw new Error("Product ID is required");
  const strId = String(id).trim();

  if (isMongoConnected()) {
    try {
      let doc = null;
      if (mongoose.Types.ObjectId.isValid(strId) && strId.length === 24) {
        doc = await Product.findById(strId);
      }
      if (!doc) {
        doc = await Product.findOne({ $or: [{ id: strId }, { partNumber: strId }] });
      }
      if (doc) {
        doc.isHidden = !doc.isHidden;
        doc.updatedAt = new Date().toISOString();
        await doc.save();

        setImmediate(() => {
          syncLocalBackups().catch(() => {});
          refreshSitemapFiles().catch(() => {});
        });

        return doc.toJSON();
      }
    } catch (err) {
      console.warn("[MongoDB] Toggle product visibility error:", err.message);
    }
  }

  // File fallback
  const items = await readProducts();
  const idx = items.findIndex((p) => String(p.id) === strId || String(p._id) === strId);
  if (idx === -1) throw new Error("Product not found");

  items[idx].isHidden = !items[idx].isHidden;
  items[idx].updatedAt = new Date().toISOString();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(items, null, 2), "utf-8");
  setImmediate(() => refreshSitemapFiles().catch(() => {}));
  return items[idx];
}

export async function getCategoryById(id) {
  if (!id) return null;
  const strId = String(id).trim();

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(strId) && strId.length === 24;
      const safeIdRegex = new RegExp(`^${escapeRegex(strId)}$`, "i");
      const query = isObjectId
        ? { $or: [{ _id: strId }, { id: safeIdRegex }] }
        : { id: safeIdRegex };

      const cat = await Category.findOne(query);
      if (cat) return cat.toJSON();
    } catch (err) {
      console.warn("[MongoDB] Error finding category:", err.message);
    }
  }
  const cats = await readCategories();
  return (
    cats.find(
      (c) => String(c.id).toLowerCase() === strId.toLowerCase() || String(c._id) === strId
    ) || null
  );
}

export async function toggleCategoryVisibility(id) {
  if (!id || id === "undefined" || id === "null") {
    throw new Error("Valid category ID is required");
  }
  const strId = String(id).trim();

  if (isMongoConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(strId) && strId.length === 24;
      const safeIdRegex = new RegExp(`^${escapeRegex(strId)}$`, "i");
      const query = isObjectId
        ? { $or: [{ _id: strId }, { id: safeIdRegex }] }
        : { id: safeIdRegex };

      const cat = await Category.findOne(query);
      if (cat) {
        cat.isHidden = !cat.isHidden;
        await cat.save();

        setImmediate(() => {
          syncLocalBackups().catch(() => {});
          refreshSitemapFiles().catch(() => {});
        });

        return cat.toJSON();
      }
    } catch (err) {
      console.warn("[MongoDB] Toggle category error:", err.message);
    }
  }

  // File fallback
  const cats = await readCategories();
  const idx = cats.findIndex(
    (c) => String(c.id).toLowerCase() === strId.toLowerCase() || String(c._id) === strId
  );
  if (idx === -1) throw new Error(`Category '${id}' not found`);

  cats[idx].isHidden = !cats[idx].isHidden;
  await fs.writeFile(CATEGORIES_FILE, JSON.stringify(cats, null, 2), "utf-8");
  setImmediate(() => refreshSitemapFiles().catch(() => {}));
  return cats[idx];
}

