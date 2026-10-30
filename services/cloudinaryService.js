import { Readable } from "stream";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const DEFAULT_FOLDER = "trinix";

/**
 * Upload a file (Buffer, local file path, or base64 data URL) directly to Cloudinary
 * Stored inside the 'trinix' folder
 */
export async function uploadImageToCloudinary(fileInput, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary credentials are not configured in environment variables");
  }

  const folder = options.folder || DEFAULT_FOLDER;
  const uploadOptions = {
    folder,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    ...options,
  };

  // Case 1: Buffer from multer memoryStorage
  if (Buffer.isBuffer(fileInput)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("[Cloudinary] Upload stream failed:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      const readable = new Readable();
      readable._read = () => {};
      readable.push(fileInput);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // Case 2: String (Base64 Data URI or local disk file path)
  if (typeof fileInput === "string") {
    const result = await cloudinary.uploader.upload(fileInput, uploadOptions);
    return result;
  }

  throw new Error("Invalid file input: must be a Buffer or string path/data URI");
}

/**
 * Delete image from Cloudinary by public ID
 */
export async function deleteImageFromCloudinary(publicId) {
  if (!isCloudinaryConfigured() || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("[Cloudinary] Failed to delete asset:", err.message);
    return null;
  }
}
