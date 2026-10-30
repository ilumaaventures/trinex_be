import { connectDB } from "../config/db.js";
import { syncLocalBackups, refreshSitemapFiles, readProducts, readCategories } from "../services/storageService.js";

async function main() {
  console.log("[Script] Connecting to MongoDB...");
  await connectDB();

  console.log("[Script] Syncing local JSON backup files...");
  await syncLocalBackups();

  console.log("[Script] Refreshing sitemap files...");
  await refreshSitemapFiles();

  const products = await readProducts();
  const categories = await readCategories();

  console.log(`[Script] Completed! Verified: ${products.length} products, ${categories.length} categories.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Script] Error:", err);
  process.exit(1);
});

