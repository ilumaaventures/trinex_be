# Subdomain Setup & Deployment Guide: `admin.trinexsystems.com`

This guide explains how to run and deploy the **Admin Panel** on its own dedicated subdomain (`admin.trinexsystems.com`), completely decoupled from the main customer-facing website (`trinexsystems.com`).

---

## 🏛️ Architecture Overview

| Application | Folder | Purpose | Local URL | Production Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Main Website** | `trinex_fe/` | Public corporate portal, branding, product catalog | `http://localhost:5173` | `https://trinexsystems.com` |
| **Admin Panel** | `trinex_admin/` | Dedicated product CRUD, image upload, SEO suite | `http://localhost:5000` or `http://admin.localhost:5000` | `https://admin.trinexsystems.com` |

---

## 💻 Local Subdomain Testing (Windows / Mac / Linux)

You can test real subdomain routing locally using your system's `hosts` file:

### Windows:
1. Open Notepad as **Administrator**.
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add the line:
   ```
   127.0.0.1 admin.localhost
   ```
4. Save the file.
5. In terminal, start the admin module:
   ```bash
   cd c:\Users\dell\Desktop\ilumaa\trinix\trinex_admin
   npm run dev
   ```
6. Open your browser and navigate to:
   ```
   http://admin.localhost:5000
   ```
   You are now accessing the Admin Panel via a local subdomain!

---

## ☁️ Production DNS Configuration

In your domain registrar / DNS provider (Cloudflare, GoDaddy, Namecheap, AWS Route 53):

| Type | Name / Subdomain | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** or **CNAME** | `@` (or `trinexsystems.com`) | `YOUR_SERVER_IP` (or Vercel / Netlify IP) | Auto |
| **A** or **CNAME** | `admin` (or `admin.trinexsystems.com`) | `YOUR_SERVER_IP` | Auto |

---

## 🚀 Running Both Modules Simultaneously

You can run both the client website and the admin subdomain concurrently in two separate terminal windows:

### Terminal 1: Client Website
```bash
cd c:\Users\dell\Desktop\ilumaa\trinix\trinex_fe
npm run dev
# Running on http://localhost:5173
```

### Terminal 2: Admin Subdomain Module
```bash
cd c:\Users\dell\Desktop\ilumaa\trinix\trinex_admin
npm run dev
# Running on http://localhost:5000 (or http://admin.localhost:5000)
```
