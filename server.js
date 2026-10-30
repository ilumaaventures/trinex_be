import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import uploadRouter from "./routes/upload.js";
import seoRouter from "./routes/seo.js";
import authRouter from "./routes/auth.js";
import { initStorage, readProducts, readCategories } from "./services/storageService.js";
import { generateSitemapXml, generateRobotsTxt } from "./services/seoService.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Production & Development CORS Configuration
const allowedOrigins = [
  "https://trinex-admin.vercel.app",
  "https://trinex-fe.vercel.app",
  "https://trinexsystems.com",
  "https://www.trinexsystems.com",
  "https://admin.trinexsystems.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5000",
  "http://admin.localhost:5174",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim().replace(/\/+$/, ""))
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, Render health checks, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, "");

    // Direct match with known production or local origins
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow all Vercel deployment and preview URLs (*.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow local network IP testing (e.g. 192.168.x.x, 10.x.x.x)
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Permissive in development mode or if explicitly enabled
    if (process.env.NODE_ENV !== "production" || process.env.ALLOW_ALL_ORIGINS === "true") {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range", "Content-Disposition"],
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
app.use("/api/auth", authRouter);
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

// Health check & API status endpoints
app.get(["/health", "/api/health", "/api/status", "/api"], (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    message: "Trinex Systems Backend API is working properly.",
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
