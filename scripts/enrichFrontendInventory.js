import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE = path.join(__dirname, "..", "data", "products.json");
const INVENTORY_FILE = path.join(__dirname, "..", "..", "trinex_fe", "src", "data", "inventoryProducts.js");

const fileProds = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
let invJs = fs.readFileSync(INVENTORY_FILE, "utf-8");

let updatedCount = 0;

for (const p of fileProds) {
  if (!p.partNumber || !p.slug) continue;
  const targetDouble = `partNumber: "${p.partNumber}",`;
  const targetSingle = `partNumber: '${p.partNumber}',`;
  const target = invJs.includes(targetDouble) ? targetDouble : (invJs.includes(targetSingle) ? targetSingle : null);

  if (target && !invJs.includes(`slug: "${p.slug}"`)) {
    const addition = `${target}\n    slug: "${p.slug}",\n    metaTitle: ${JSON.stringify(p.metaTitle)},\n    metaDescription: ${JSON.stringify(p.metaDescription)},`;
    invJs = invJs.replace(target, addition);
    updatedCount++;
  }
}

fs.writeFileSync(INVENTORY_FILE, invJs, "utf-8");
console.log(`Enriched ${updatedCount} items in inventoryProducts.js with complete SEO metadata!`);

