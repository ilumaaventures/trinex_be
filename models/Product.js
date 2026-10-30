import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    partNumber: {
      type: String,
      required: [true, "Part Number / SKU is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    categoryKey: {
      type: String,
      required: [true, "Category key is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Technical description is required"],
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    location: {
      type: String,
      default: "Ready Stock (Delhi)",
      trim: true,
    },
    delivery: {
      type: String,
      default: "Immediate Dispatch",
      trim: true,
    },
    compliance: {
      type: String,
      default: "MIL-STD-883 / ISO 9001",
      trim: true,
    },
    image: {
      type: String,
      default: "/assets/products/transformers_chokes.jpg",
      trim: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },

    // SEO Suite
    focusKeyword: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    metaKeywords: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    robots: {
      type: String,
      default: "index, follow",
      trim: true,
    },
    ogTitle: {
      type: String,
      trim: true,
    },
    ogDescription: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
    },
    seoHealth: {
      score: { type: Number, default: 0 },
      checks: { type: mongoose.Schema.Types.Mixed },
      status: { type: String, default: "NEEDS_OPTIMIZATION" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound text search index on partNumber, description, and keywords
ProductSchema.index({
  partNumber: "text",
  category: "text",
  description: "text",
  metaKeywords: "text",
});

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
