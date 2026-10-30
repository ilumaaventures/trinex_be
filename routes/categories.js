import express from "express";
import {
  readCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryVisibility,
} from "../services/storageService.js";

const router = express.Router();

/**
 * GET /api/categories
 * Retrieve all categories with dynamic component counts
 */
router.get("/", async (req, res) => {
  try {
    const categories = await readCategories();
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/categories/:id/visibility
 * Toggle category hidden status from public website
 */
router.patch("/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ success: false, message: "Valid category ID is required" });
    }
    const updated = await toggleCategoryVisibility(id);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Category '${id}' not found` });
    }
    res.json({
      success: true,
      message: updated.isHidden
        ? `Category '${updated.name}' hidden from public website`
        : `Category '${updated.name}' is now visible on public website`,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/categories
 * Create a new strategic product category
 */
router.post("/", async (req, res) => {
  try {
    const { name, subtitle, description, image, id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const created = await createCategory({ name, subtitle, description, image, id });
    res.status(201).json({
      success: true,
      message: `Category '${created.name}' created successfully`,
      data: created,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/categories/:id
 * Update an existing category
 */
router.put("/:id", async (req, res) => {
  try {
    const updated = await updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({
      success: true,
      message: `Category '${updated.name}' updated successfully`,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/categories/:id
 * Remove a category
 */
router.delete("/:id", async (req, res) => {
  try {
    const removed = await deleteCategory(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({
      success: true,
      message: "Category removed successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
