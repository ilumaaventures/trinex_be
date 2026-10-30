import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import uploadRouter from "./routes/upload.js";
import seoRouter from "./routes/seo.js";
import { initStorage, readProducts, readCategories } from "./services/storageService.js";
import { generateSitemapXml, generateRobotsTxt } from "./services/seoService.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Google Search Console Sitemap & Robots.txt endpoints (served dynamically before static files)
app.get("/sitemap.xml", async (req, res) => {
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

app.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.BASE_URL || "https://trinexsystems.com";
  const txt = generateRobotsTxt(baseUrl);
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.send(txt);
});

// Static Assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/seo", seoRouter);

// Root route serves the Standalone Admin Dashboard UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Trinex Systems Admin & Inventory Engine",
    timestamp: new Date().toISOString()
  });
});

// Initialize database storage and start server
async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize catalog storage and seeding
    await initStorage();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  TRINEX SYSTEMS &bull; ADMIN BACKEND SERVER RUNNING`);
      console.log(`  Port: http://localhost:${PORT}`);
      console.log(`  Database: ${process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trinix"}`);
      console.log(`  Admin Dashboard: http://localhost:${PORT}/admin`);
      console.log(`  REST API Endpoints: http://localhost:${PORT}/api/products`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
