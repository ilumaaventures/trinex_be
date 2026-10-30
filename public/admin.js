/**
 * Trinex Systems Admin Console Client Logic
 */

let allProducts = [];
let allCategories = [];
let activeCategory = "all";
let activeDeleteId = null;

// DOM Elements
const searchInput = document.getElementById("search-input");
const categoriesContainer = document.getElementById("categories-container");
const productsTbody = document.getElementById("products-tbody");
const tableFooterInfo = document.getElementById("table-footer-info");

const statTotal = document.getElementById("stat-total");
const statDelhi = document.getElementById("stat-delhi");
const statUnits = document.getElementById("stat-units");
const statSeo = document.getElementById("stat-seo");

// Modal Elements
const editorModal = document.getElementById("editor-modal");
const modalTitle = document.getElementById("modal-title");
const productForm = document.getElementById("product-form");
const deleteModal = document.getElementById("delete-modal");
const deletePartName = document.getElementById("delete-part-name");

// Form inputs
const formId = document.getElementById("form-id");
const formPartNumber = document.getElementById("form-partNumber");
const formCategory = document.getElementById("form-category");
const formDescription = document.getElementById("form-description");
const formStock = document.getElementById("form-stock");
const formLocation = document.getElementById("form-location");
const formDelivery = document.getElementById("form-delivery");
const formCompliance = document.getElementById("form-compliance");
const formImage = document.getElementById("form-image");
const imageFileInput = document.getElementById("image-file-input");
const imagePreview = document.getElementById("image-preview");
const imagePreviewEmpty = document.getElementById("image-preview-empty");
const uploadStatus = document.getElementById("upload-status");

// SEO inputs
const formMetaTitle = document.getElementById("form-metaTitle");
const formMetaDescription = document.getElementById("form-metaDescription");
const formSlug = document.getElementById("form-slug");
const formRobots = document.getElementById("form-robots");
const formMetaKeywords = document.getElementById("form-metaKeywords");
const formCanonicalUrl = document.getElementById("form-canonicalUrl");
const formOgImage = document.getElementById("form-ogImage");

const counterTitle = document.getElementById("counter-title");
const counterDesc = document.getElementById("counter-desc");

// Previews
const serpUrl = document.getElementById("serp-url");
const serpTitle = document.getElementById("serp-title");
const serpDesc = document.getElementById("serp-desc");
const schemaPreview = document.getElementById("schema-preview");

// Toast
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}

// Fetch stats and products on load
async function loadData() {
  try {
    const [resProducts, resStats] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/products/stats")
    ]);

    const dataProducts = await resProducts.json();
    const dataStats = await resStats.json();

    if (dataProducts.success) {
      allProducts = dataProducts.data || [];
    }
    if (dataStats.success) {
      const s = dataStats.data;
      statTotal.textContent = s.totalProducts;
      statDelhi.textContent = s.readyStockDelhi;
      statUnits.textContent = s.totalStockQty.toLocaleString();
      statSeo.textContent = `${s.seoHealthScore}%`;
      allCategories = s.categories || [];
      renderCategoryPills();
    }

    renderProductsTable();
  } catch (err) {
    console.error("Failed to load products:", err);
    tableFooterInfo.textContent = "Error loading database from server.";
  }
}

function renderCategoryPills() {
  categoriesContainer.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `px-2.5 py-1 text-xs font-mono uppercase rounded-[2px] transition-colors ${
    activeCategory === "all" ? "bg-brandDark text-brandGold font-bold" : "bg-gray-100 text-gray-600 hover:text-black"
  }`;
  allBtn.textContent = `All (${allProducts.length})`;
  allBtn.onclick = () => {
    activeCategory = "all";
    renderCategoryPills();
    renderProductsTable();
  };
  categoriesContainer.appendChild(allBtn);

  allCategories.forEach((cat) => {
    const count = allProducts.filter((p) => p.categoryKey === cat.id).length;
    const btn = document.createElement("button");
    btn.className = `px-2.5 py-1 text-xs font-mono uppercase rounded-[2px] transition-colors ${
      activeCategory === cat.id ? "bg-brandDark text-brandGold font-bold" : "bg-gray-100 text-gray-600 hover:text-black"
    }`;
    btn.textContent = `${cat.name} (${count})`;
    btn.onclick = () => {
      activeCategory = cat.id;
      renderCategoryPills();
      renderProductsTable();
    };
    categoriesContainer.appendChild(btn);
  });
}

function renderProductsTable() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
    if (activeCategory !== "all" && p.categoryKey !== activeCategory) {
      return false;
    }
    if (!query) return true;
    return (
      (p.partNumber && p.partNumber.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.metaTitle && p.metaTitle.toLowerCase().includes(query)) ||
      (p.metaKeywords && p.metaKeywords.toLowerCase().includes(query))
    );
  });

  productsTbody.innerHTML = "";

  if (filtered.length === 0) {
    productsTbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-gray-400 font-mono">No components found matching search criteria.</td>
      </tr>
    `;
    tableFooterInfo.firstElementChild.textContent = "Showing 0 components";
    return;
  }

  filtered.forEach((p) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-brandOffWhite transition-colors";

    const hasFullSeo = p.metaTitle && p.metaDescription && p.slug;
    const seoScore = p.seoHealth ? p.seoHealth.score : (hasFullSeo ? 100 : 50);

    tr.innerHTML = `
      <td class="py-3.5 px-4 font-mono font-bold text-brandDark whitespace-nowrap">${p.partNumber}</td>
      <td class="py-3.5 px-4">
        <div class="w-10 h-10 rounded-[2px] border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
          ${p.image ? `<img src="${p.image}" alt="${p.partNumber}" class="w-full h-full object-cover" />` : '<span class="text-[9px] text-gray-400 font-mono">N/A</span>'}
        </div>
      </td>
      <td class="py-3.5 px-4 whitespace-nowrap">
        <span class="px-2 py-0.5 bg-gray-100 border border-gray-200 text-[10px] font-mono font-bold text-brandDark rounded-[2px] uppercase">
          ${p.category || p.categoryKey}
        </span>
      </td>
      <td class="py-3.5 px-4 max-w-xs text-gray-600 line-clamp-2 leading-relaxed">${p.description || ""}</td>
      <td class="py-3.5 px-4 whitespace-nowrap">
        <div class="font-mono font-bold text-brandDark">${p.stock} units</div>
        <div class="text-[11px] text-brandGold font-semibold">${p.location || ""}</div>
      </td>
      <td class="py-3.5 px-4 whitespace-nowrap">
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 ${seoScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} border text-[10px] font-mono rounded-[2px]">
          <span class="w-1.5 h-1.5 rounded-full ${seoScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          ${seoScore}% SCORE
        </span>
      </td>
      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-2">
          <button class="btn-edit px-2.5 py-1 bg-brandDark text-brandGold hover:bg-brandNavy text-xs font-bold font-mono rounded-[2px]">EDIT &amp; SEO</button>
          <button class="btn-delete text-gray-400 hover:text-red-600 font-bold p-1">&times;</button>
        </div>
      </td>
    `;

    tr.querySelector(".btn-edit").onclick = () => openEditModal(p);
    tr.querySelector(".btn-delete").onclick = () => openDeleteModal(p);

    productsTbody.appendChild(tr);
  });

  tableFooterInfo.firstElementChild.textContent = `Showing ${filtered.length} of ${allProducts.length} components registered`;
}

// Search debounce
searchInput.addEventListener("input", () => {
  renderProductsTable();
});

// Tab Switcher
const tabs = [
  { btn: document.getElementById("tab-btn-basic"), content: document.getElementById("tab-content-basic") },
  { btn: document.getElementById("tab-btn-image"), content: document.getElementById("tab-content-image") },
  { btn: document.getElementById("tab-btn-seo"), content: document.getElementById("tab-content-seo") },
  { btn: document.getElementById("tab-btn-preview"), content: document.getElementById("tab-content-preview") }
];

tabs.forEach(({ btn, content }) => {
  btn.onclick = () => {
    tabs.forEach((t) => {
      t.btn.classList.remove("border-brandGold", "text-brandDark");
      t.btn.classList.add("border-transparent", "text-[#68717A]");
      t.content.classList.add("hidden");
    });
    btn.classList.remove("border-transparent", "text-[#68717A]");
    btn.classList.add("border-brandGold", "text-brandDark");
    content.classList.remove("hidden");

    if (btn.id === "tab-btn-preview") {
      updatePreviews();
    }
  };
});

function openCreateModal() {
  productForm.reset();
  formId.value = "";
  modalTitle.textContent = "Add New Product with Full SEO Suite";
  imagePreview.classList.add("hidden");
  imagePreviewEmpty.classList.remove("hidden");
  tabs[0].btn.click();
  editorModal.classList.remove("hidden");
  updateCounters();
}

function openEditModal(p) {
  productForm.reset();
  formId.value = p.id;
  formPartNumber.value = p.partNumber || "";
  formCategory.value = p.categoryKey || "transformers";
  formDescription.value = p.description || "";
  formStock.value = p.stock ?? 10;
  formLocation.value = p.location || "Ready Stock (Delhi)";
  formDelivery.value = p.delivery || "Immediate Dispatch";
  formCompliance.value = p.compliance || "MIL-STD-883 / ISO 9001";
  formImage.value = p.image || "";

  formMetaTitle.value = p.metaTitle || "";
  formMetaDescription.value = p.metaDescription || "";
  formSlug.value = p.slug || "";
  formRobots.value = p.robots || "index, follow";
  formMetaKeywords.value = p.metaKeywords || "";
  formCanonicalUrl.value = p.canonicalUrl || "";
  formOgImage.value = p.ogImage || p.image || "";

  if (p.image) {
    imagePreview.src = p.image;
    imagePreview.classList.remove("hidden");
    imagePreviewEmpty.classList.add("hidden");
  } else {
    imagePreview.classList.add("hidden");
    imagePreviewEmpty.classList.remove("hidden");
  }

  modalTitle.textContent = `Edit Component "${p.partNumber}" & SEO Tags`;
  tabs[0].btn.click();
  editorModal.classList.remove("hidden");
  updateCounters();
}

document.getElementById("btn-add-product").onclick = openCreateModal;
document.getElementById("btn-close-modal").onclick = () => editorModal.classList.add("hidden");
document.getElementById("btn-cancel-modal").onclick = () => editorModal.classList.add("hidden");

// Image Upload
imageFileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  uploadStatus.textContent = "Uploading image to server...";
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      formImage.value = result.imageUrl;
      imagePreview.src = result.imageUrl;
      imagePreview.classList.remove("hidden");
      imagePreviewEmpty.classList.add("hidden");
      uploadStatus.textContent = `Uploaded: ${result.filename} (${Math.round(result.size / 1024)} KB)`;
      showToast("Component image uploaded successfully");
    } else {
      uploadStatus.textContent = `Upload failed: ${result.message}`;
    }
  } catch (err) {
    console.error("Upload error:", err);
    uploadStatus.textContent = "Error uploading image to server.";
  }
});

formImage.addEventListener("input", () => {
  const url = formImage.value.trim();
  if (url) {
    imagePreview.src = url;
    imagePreview.classList.remove("hidden");
    imagePreviewEmpty.classList.add("hidden");
  } else {
    imagePreview.classList.add("hidden");
    imagePreviewEmpty.classList.remove("hidden");
  }
});

// Auto-fill SEO
document.getElementById("btn-autofill-seo").onclick = async () => {
  const payload = {
    partNumber: formPartNumber.value,
    category: formCategory.options[formCategory.selectedIndex].text,
    description: formDescription.value,
    image: formImage.value
  };

  try {
    const res = await fetch("/api/seo/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      const d = result.data;
      formMetaTitle.value = d.metaTitle;
      formMetaDescription.value = d.metaDescription;
      formSlug.value = d.slug;
      formCanonicalUrl.value = d.canonicalUrl;
      formMetaKeywords.value = d.metaKeywords;
      formOgImage.value = d.ogImage;
      updateCounters();
      showToast("SEO tags generated and formatted");
    }
  } catch (err) {
    console.error("SEO autofill error:", err);
  }
};

function updateCounters() {
  const titleLen = formMetaTitle.value.length;
  const descLen = formMetaDescription.value.length;
  counterTitle.textContent = `${titleLen}/60 chars`;
  counterDesc.textContent = `${descLen}/160 chars`;
  counterTitle.className = `text-[11px] font-mono ${titleLen > 60 ? 'text-amber-600 font-bold' : 'text-gray-500'}`;
  counterDesc.className = `text-[11px] font-mono ${descLen > 160 ? 'text-amber-600 font-bold' : 'text-gray-500'}`;
}

formMetaTitle.addEventListener("input", updateCounters);
formMetaDescription.addEventListener("input", updateCounters);

// Update SERP & Schema Previews
function updatePreviews() {
  const pn = formPartNumber.value || "Component";
  const slug = formSlug.value || pn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const title = formMetaTitle.value || `${pn} | Trinex Systems LLP`;
  const desc = formMetaDescription.value || formDescription.value || "Precision defence and aerospace component.";
  const url = formCanonicalUrl.value || `https://trinexsystems.com/products/${slug}`;

  serpUrl.textContent = url.replace("https://", "");
  serpTitle.textContent = title;
  serpDesc.textContent = desc;

  const schemaObj = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: title,
    image: [formImage.value || url + "/image.jpg"],
    description: desc,
    sku: pn,
    mpn: pn,
    brand: {
      "@type": "Brand",
      name: "Trinex Systems LLP"
    },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "INR",
      availability: Number(formStock.value) > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  schemaPreview.textContent = JSON.stringify(schemaObj, null, 2);
}

// Form Submit (Create or Update)
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = formId.value;
  const payload = {
    partNumber: formPartNumber.value.trim(),
    categoryKey: formCategory.value,
    category: formCategory.options[formCategory.selectedIndex].text,
    description: formDescription.value.trim(),
    stock: Number(formStock.value) || 0,
    location: formLocation.value.trim(),
    delivery: formDelivery.value.trim(),
    compliance: formCompliance.value.trim(),
    image: formImage.value.trim(),
    metaTitle: formMetaTitle.value.trim(),
    metaDescription: formMetaDescription.value.trim(),
    slug: formSlug.value.trim(),
    robots: formRobots.value,
    metaKeywords: formMetaKeywords.value.trim(),
    canonicalUrl: formCanonicalUrl.value.trim(),
    ogImage: formOgImage.value.trim()
  };

  const url = id ? `/api/products/${id}` : "/api/products";
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      editorModal.classList.add("hidden");
      showToast(id ? "Product updated successfully" : "Product published to catalog");
      await loadData();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Failed to save product to backend server.");
  }
});

// Delete Modal
function openDeleteModal(p) {
  activeDeleteId = p.id;
  deletePartName.textContent = p.partNumber;
  deleteModal.classList.remove("hidden");
}

document.getElementById("btn-cancel-delete").onclick = () => {
  deleteModal.classList.add("hidden");
  activeDeleteId = null;
};

document.getElementById("btn-confirm-delete").onclick = async () => {
  if (!activeDeleteId) return;

  try {
    const res = await fetch(`/api/products/${activeDeleteId}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      deleteModal.classList.add("hidden");
      showToast("Product deleted from database");
      await loadData();
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
};

// Reset Catalog
document.getElementById("btn-reset-catalog").onclick = async () => {
  if (confirm("Restore factory default components in the database? Any custom items will be overwritten.")) {
    try {
      const res = await fetch("/api/products/reset", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        showToast("Catalog restored to factory defaults");
        await loadData();
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  }
};

// Export JSON
document.getElementById("btn-export-json").onclick = () => {
  const jsonStr = JSON.stringify(allProducts, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `trinex-products-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast("Exported JSON catalog file");
};

// Initialize
loadData();
