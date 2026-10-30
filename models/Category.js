import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Category slug/id is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "/assets/products/transformers_chokes.jpg",
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
