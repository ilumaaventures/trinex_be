import express from "express";
import { Enquiry } from "../models/Enquiry.js";

const router = express.Router();

const OFFICIAL_EMAIL = "connect@trinexsystems.in";

/**
 * POST /api/contact - Receive new inquiry/lead
 * Destination & Sender configured strictly as connect@trinexsystems.in
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

    // Record inquiry with official sender & recipient
    const enquiry = new Enquiry({
      name,
      email,
      phone: phone || "",
      company: company || "",
      message,
      source,
      recipient: OFFICIAL_EMAIL,
      sender: OFFICIAL_EMAIL,
      status: "new",
    });

    await enquiry.save();

    console.log(`[ENQUIRY RECEIVED] From: ${name} (${email}) -> Routed to: ${OFFICIAL_EMAIL}`);

    return res.status(201).json({
      success: true,
      message: `Enquiry successfully registered and routed to ${OFFICIAL_EMAIL}`,
      recipient: OFFICIAL_EMAIL,
      sender: OFFICIAL_EMAIL,
      data: {
        id: enquiry._id,
        name: enquiry.name,
        recipient: enquiry.recipient,
        createdAt: enquiry.createdAt,
      },
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
 * GET /api/contact - List enquiries (for admin inspection)
 */
router.get("/", async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
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
