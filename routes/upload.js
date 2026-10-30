import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import { uploadImageToCloudinary } from "../services/cloudinaryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure local upload fallback directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// File filter (Images only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowed.test(ext) && (mime.startsWith("image/") || mime === "image/svg+xml")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (.jpg, .jpeg, .png, .webp, .svg) are permitted"));
  }
};

// Use Memory Storage for streaming directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

/**
 * GET /api/upload/status
 * Check Cloudinary connection status and target folder
 */
router.get("/status", (req, res) => {
  const ready = isCloudinaryConfigured();
  res.json({
    success: true,
    storage: ready ? "cloudinary" : "local_disk",
    cloudinaryConfigured: ready,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
    folder: "trinix",
  });
});

/**
 * POST /api/upload
 * Handles product/category image upload to Cloudinary (folder: 'trinix')
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Case 1: Form-data Multipart File
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          console.log(
            `[Cloudinary] Uploading '${req.file.originalname}' (${req.file.size} bytes) to folder 'trinix'...`
          );

          const result = await uploadImageToCloudinary(req.file.buffer, {
            folder: "trinix",
            resource_type: "image",
          });

          console.log(`[Cloudinary] Upload success: ${result.secure_url}`);

          return res.json({
            success: true,
            message: "Image uploaded to Cloudinary folder 'trinix' successfully",
            imageUrl: result.secure_url,
            publicId: result.public_id,
            folder: "trinix",
            format: result.format,
            size: result.bytes,
            storage: "cloudinary",
          });
        } catch (cloudErr) {
          console.error(
            "[Cloudinary] Error uploading to Cloudinary, falling back to disk storage:",
            cloudErr.message
          );
        }
      }

      // Fallback to local disk storage if Cloudinary fails or is unconfigured
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const cleanName = path
        .basename(req.file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 30);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
      const filename = `${cleanName}-${uniqueSuffix}${ext}`;
      const localFilePath = path.join(UPLOAD_DIR, filename);

      await fs.promises.writeFile(localFilePath, req.file.buffer);

      return res.json({
        success: true,
        message: "Image uploaded to local server storage (fallback)",
        imageUrl: `/uploads/${filename}`,
        filename,
        size: req.file.size,
        storage: "local",
      });
    }

    // Case 2: Base64 / Data URI payload sent as JSON { image: "data:image/..." }
    if (req.body?.image && typeof req.body.image === "string") {
      const imageData = req.body.image.trim();

      if (imageData.startsWith("http://") || imageData.startsWith("https://")) {
        // Already a remote URL (e.g. existing Cloudinary URL)
        return res.json({
          success: true,
          imageUrl: imageData,
          storage: "url",
        });
      }

      if (imageData.startsWith("data:image") && isCloudinaryConfigured()) {
        console.log("[Cloudinary] Uploading base64 image data to folder 'trinix'...");
        const result = await uploadImageToCloudinary(imageData, {
          folder: "trinix",
          resource_type: "image",
        });

        return res.json({
          success: true,
          message: "Base64 image uploaded to Cloudinary folder 'trinix' successfully",
          imageUrl: result.secure_url,
          publicId: result.public_id,
          folder: "trinix",
          storage: "cloudinary",
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "No image file or data URI provided in request",
    });
  } catch (err) {
    console.error("[Upload] Error processing image upload:", err);
    res.status(500).json({
      success: false,
      message: `Failed to upload image: ${err.message}`,
    });
  }
});

export default router;
