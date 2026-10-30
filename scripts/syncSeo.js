import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { buildCompleteSeo } from "../services/seoService.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trinix";
  console.log("Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB!");

  const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
  const items = JSON.parse(raw);
  console.log(`Loaded ${items.length} products from products.json`);

  const collection = mongoose.connection.collection("products");

  let synced = 0;
  const updatedItems = [];

  for (const item of items) {
    const seo = buildCompleteSeo(item);
    const enriched = {
      ...item,
      ...seo,
      updatedAt: new Date(),
    };

    delete enriched._id;
    delete enriched.id;

    await collection.updateOne(
      { partNumber: item.partNumber },
      { $set: enriched },
      { upsert: true }
    );

    updatedItems.push(enriched);
    synced++;
  }

  // Write back to products.json to maintain consistency
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedItems, null, 2), "utf-8");

  const totalMongo = await collection.countDocuments();
  console.log(`Synced ${synced} products.`);
  console.log(`Total MongoDB products count now: ${totalMongo}`);

  await mongoose.disconnect();
  console.log("Disconnected and complete!");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

