import express from "express";
import {
  readProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  resetCatalog,
  getStats,
  toggleProductVisibility,
  syncAllSeo
} from "../services/storageService.js";

const router = express.Router();

/**
 * POST /api/products/sync-seo
 * Run automated SEO optimization across all products in the database
 */
router.post("/sync-seo", async (req, res) => {
  try {
    const result = await syncAllSeo();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/products/stats
 * Get overall inventory and SEO health statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/products/reset
 * Restore factory catalog defaults
 */
router.post("/reset", async (req, res) => {
  try {
    const products = await resetCatalog();
    res.json({
      success: true,
      message: "Catalog successfully restored to factory defaults",
      data: products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/products
 * Fetch products with optional search, category, location, and pagination filtering
 */
router.get("/", async (req, res) => {
  try {
    const result = await readProducts(req.query);

    if (result && result.pagination) {
      return res.json({
        success: true,
        count: result.products.length,
        data: result.products,
        pagination: result.pagination,
      });
    }

    const products = Array.isArray(result) ? result : [];
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/products/:id
 * Retrieve a single product by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/products
 * Create a new product with full SEO suite
 */
router.post("/", async (req, res) => {
  try {
    const { partNumber, description, category, categoryKey } = req.body;
    if (!partNumber || !description || (!categoryKey && !category)) {
      return res.status(400).json({
        success: false,
        message: "Part Number (SKU), Category, and Technical Description are required fields"
      });
    }

    const newProduct = await createProduct(req.body);
    res.status(201).json({
      success: true,
      message: "Product created and published successfully",
      data: newProduct
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product and its SEO tags
 */
router.put("/:id", async (req, res) => {
  try {
    const { partNumber, description, categoryKey } = req.body;
    if (partNumber !== undefined && !String(partNumber).trim()) {
      return res.status(400).json({ success: false, message: "Part Number cannot be empty" });
    }
    if (description !== undefined && !String(description).trim()) {
      return res.status(400).json({ success: false, message: "Technical Description cannot be empty" });
    }
    if (categoryKey !== undefined && !String(categoryKey).trim()) {
      return res.status(400).json({ success: false, message: "Category is a mandatory field" });
    }

    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({
      success: true,
      message: "Product and SEO metadata updated successfully",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/products/:id
 * Remove a product from the database
 */
router.delete("/:id", async (req, res) => {
  try {
    const removed = await deleteProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({
      success: true,
      message: "Product removed from inventory successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/products/:id/visibility
 * Toggle product hidden status from main site
 */
router.patch("/:id/visibility", async (req, res) => {
  try {
    const updated = await toggleProductVisibility(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({
      success: true,
      message: updated.isHidden
        ? "Product hidden from public website"
        : "Product is now visible on public website",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
