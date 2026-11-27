import dotenv from "dotenv";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/trinix";

async function runSeed() {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    const [productCount, categoryCount] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
    ]);

    console.log(`[Seed] Current database status: ${productCount} products, ${categoryCount} categories.`);

    if (productCount > 0) {
      console.log(`[Seed] Database already populated with ${productCount} products. Skipping seed.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("[Seed] Database is empty. Seeding initial categories...");

    if (categoryCount === 0) {
      const defaultCategories = [
        { id: "resistors", name: "Resistors", subtitle: "Precision & Power Resistors", icon: "sliders", isHidden: false },
        { id: "capacitors", name: "Capacitors", subtitle: "Tantalum, Ceramic & Film", icon: "box", isHidden: false },
        { id: "microcircuits", name: "Microcircuits", subtitle: "Logic & Digital ICs", icon: "cpu", isHidden: false },
        { id: "transistors-diodes", name: "Diodes & Transistors", subtitle: "Power Transistors & Zener Diodes", icon: "zap", isHidden: false },
        { id: "connectors", name: "Connectors", subtitle: "Mil-Spec Multi-Pin Connectors", icon: "link", isHidden: false },
        { id: "motors-generators", name: "Motors & Generators", subtitle: "Precision Servo Motors", icon: "disc", isHidden: false },
        { id: "transformers", name: "Transformers & Power", subtitle: "Transformers, Power Units & Chokes", icon: "layers", isHidden: false },
        { id: "switches-relays", name: "Switches & Protection", subtitle: "Switches, Fuses & Indicators", icon: "toggle-left", isHidden: false },
      ];
      await Category.insertMany(defaultCategories);
      console.log(`[Seed] Seeded ${defaultCategories.length} default categories.`);
    }

    console.log("[Seed] Setup complete. Ready for Admin inventory management.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.warn(`[Seed] Notice: ${error.message}. Skipping seed step.`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(0);
  }
}

runSeed();
