import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Enquiry } from "../models/Enquiry.js";
import { isMongoConnected } from "../config/db.js";
import { sendEnquiryEmail } from "../services/emailService.js";
import { requireAuth } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENQUIRIES_FILE = path.join(__dirname, "..", "data", "enquiries.json");

const router = express.Router();

const OFFICIAL_EMAIL = process.env.CONTACT_EMAIL || "connect@trinexsystems.in";

/**
 * POST /api/contact - Receive new inquiry/lead
 * Persists to MongoDB (or local JSON fallback) and dispatches email if SMTP is configured.
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, company, message, source = "web-portal" } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are required fields.",
      });
    }

    const payload = {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : "",
      company: company ? String(company).trim() : "",
      message: String(message).trim(),
      source,
      recipient: OFFICIAL_EMAIL,
      sender: OFFICIAL_EMAIL,
      status: "new",
    };

    let savedRecord;
    if (isMongoConnected()) {
      const enquiry = new Enquiry(payload);
      await enquiry.save();
      savedRecord = {
        id: enquiry._id,
        name: enquiry.name,
        recipient: enquiry.recipient,
        createdAt: enquiry.createdAt,
      };
    } else {
      await fs.mkdir(path.dirname(ENQUIRIES_FILE), { recursive: true });
      let list = [];
      try {
        const raw = await fs.readFile(ENQUIRIES_FILE, "utf-8");
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
      const entry = {
        ...payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      list.unshift(entry);
      await fs.writeFile(ENQUIRIES_FILE, JSON.stringify(list, null, 2), "utf-8");
      savedRecord = {
        id: entry.id,
        name: entry.name,
        recipient: entry.recipient,
        createdAt: entry.createdAt,
      };
    }

    sendEnquiryEmail(payload).catch((mailErr) => {
      console.warn("[ENQUIRY EMAIL WARNING]:", mailErr.message);
    });

    console.log(`[ENQUIRY RECEIVED] From: ${payload.name} (${payload.email}) -> Routed to: ${OFFICIAL_EMAIL}`);

    return res.status(201).json({
      success: true,
      message: `Enquiry successfully registered and routed to ${OFFICIAL_EMAIL}`,
      recipient: OFFICIAL_EMAIL,
      sender: OFFICIAL_EMAIL,
      data: savedRecord,
    });
  } catch (err) {
    console.error("[ENQUIRY ERROR]:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to process enquiry. Please email directly to connect@trinexsystems.in",
    });
  }
});

/**
 * GET /api/contact - List enquiries (protected for admin inspection)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    if (isMongoConnected()) {
      const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
      return res.json({
        success: true,
        count: enquiries.length,
        data: enquiries,
      });
    }

    let enquiries = [];
    try {
      const raw = await fs.readFile(ENQUIRIES_FILE, "utf-8");
      enquiries = JSON.parse(raw).slice(0, 100);
    } catch {
      enquiries = [];
    }

    return res.json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
