# Trinex Systems &mdash; Admin &amp; Inventory Backend Module

A dedicated Node.js &amp; Express administration server and RESTful inventory API for **Trinex Systems LLP**. Provides complete product lifecycle management (**CRUD**), multi-format image uploads, and comprehensive **SEO &amp; Social Metadata** management with live Google SERP simulation and Schema.org rich snippets.

---

## 📁 Folder Structure

```
trinix/
├── trinex_fe/                  # Public corporate & inventory frontend (Vite + React)
└── trinex_admin/               # Dedicated Admin Backend Server & Management Console
    ├── data/
    │   ├── products.json       # Persistent JSON database with full SEO tags
    │   └── categories.json     # 8 standard Mil-Spec product categories
    ├── public/                 # Standalone Admin Single Page Application (SPA)
    │   ├── index.html          # Interactive Admin Dashboard layout
    │   └── admin.js            # Client-side reactivity, CRUD, image upload & SERP simulation
    ├── routes/
    │   ├── products.js         # REST endpoints for products (GET, POST, PUT, DELETE)
    │   ├── upload.js           # Multer multipart file upload handler
    │   └── seo.js              # Real-time SEO analysis and Schema.org generation
    ├── services/
    │   ├── storageService.js   # Safe file read/write operations & database seeding
    │   └── seoService.js       # Auto-generation of meta titles, descriptions, slugs, JSON-LD
    ├── uploads/                # Local storage directory for uploaded product images
    ├── .env.example            # Environment variables template
    ├── package.json            # Server dependencies (Express, CORS, Multer, Dotenv)
    └── server.js               # Express application entrypoint (Port 5000)
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd trinex_admin
npm install
```

### 2. Start the Server
```bash
npm run dev
# or: npm start
```

Once running:
- **Interactive Admin Dashboard:** [http://localhost:5000/admin](http://localhost:5000/admin)
- **RESTful API Base:** [http://localhost:5000/api/products](http://localhost:5000/api/products)

---

## 🛠️ API Endpoints Reference

### 1. Products Management (`/api/products`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all products (Supports `?search=`, `?category=`, `?location=`, `?minStock=`) |
| `GET` | `/api/products/:id` | Retrieve single component by ID with full SEO metadata |
| `GET` | `/api/products/stats` | Retrieve inventory metrics (Total parts, Delhi stock, SEO health score) |
| `POST` | `/api/products` | Create a new product with full SEO suite |
| `PUT` | `/api/products/:id` | Update an existing product and its meta tags |
| `DELETE` | `/api/products/:id` | Remove a product from the database |
| `POST` | `/api/products/reset` | Restore factory catalog defaults |

### 2. Image Upload (`/api/upload`)

| Method | Endpoint | Payload | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | `multipart/form-data` with field `image` | `{ success: true, imageUrl: "/uploads/..." }` |

*Supports PNG, JPG, JPEG, WEBP, and SVG up to 5MB. Stored locally in `/uploads/` and served statically.*

### 3. Real-Time SEO Analyzer (`/api/seo`)

| Method | Endpoint | Payload | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/seo/analyze` | `{ partNumber, category, description, image }` | Automatically calculates ideal Meta Title, Description, Slug, Canonical URL, Open Graph tags, and Schema.org JSON-LD |

---

## 🔍 SEO & Metadata Fields Managed

Every product in `data/products.json` tracks the following SEO properties:

- **`metaTitle`**: Page Title tag optimized for search results (recommended 50–60 characters).
- **`metaDescription`**: Search snippet summary (recommended 140–160 characters).
- **`metaKeywords`**: Comma-separated search indexing tags.
- **`slug`**: Clean, canonical URL permalink (e.g. `/products/tpp-95-transformer`).
- **`canonicalUrl`**: Explicit canonical link tag preventing duplicate content penalties.
- **`robots`**: Search indexing directive (`index, follow`, `noindex, nofollow`, etc.).
- **`ogTitle`**, **`ogDescription`**, **`ogImage`**: OpenGraph tags for rich previews on LinkedIn, Facebook, and Twitter.
- **`structuredData`**: Schema.org `Product` JSON-LD for Google rich snippets and stock availability.
- **`seoHealth`**: Real-time score (0–100%) and validation checklist.

---

## 🌐 Connecting with the Frontend (`trinex_fe`)

The server has **CORS enabled** for all origins. The frontend (`trinex_fe` on port 5173) can query this backend directly:

```javascript
// Example in frontend:
const response = await fetch("http://localhost:5000/api/products");
const { data } = await response.json();
```
