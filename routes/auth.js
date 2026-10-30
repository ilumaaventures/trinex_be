import express from "express";
import crypto from "crypto";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "trinex-defence-systems-jwt-auth-secret-key-2026";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@trinexsystems.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@trinex2026";

/**
 * Creates a cryptographically signed session token (HMAC-SHA256)
 */
function createToken(payload, expiresInMs = 14 * 24 * 60 * 60 * 1000) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Date.now() + expiresInMs;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a cryptographically signed session token
 */
export function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login
 * Authenticates admin credentials and returns session token
 */
router.post("/login", (req, res) => {
  try {
    const { emailOrUsername, email, username, password, rememberMe } = req.body;
    const inputIdentifier = String(emailOrUsername || email || username || "").trim().toLowerCase();
    const inputPassword = String(password || "").trim();

    if (!inputIdentifier || !inputPassword) {
      return res.status(400).json({
        success: false,
        message: "Email / Username and Password are required.",
      });
    }

    // Check credentials (accepts configured admin email, 'admin' username, or secondary fallback)
    const isIdentifierValid =
      inputIdentifier === ADMIN_EMAIL ||
      inputIdentifier === "admin" ||
      inputIdentifier === "info@trinexsystems.com";

    const isPasswordValid = inputPassword === ADMIN_PASSWORD;

    if (!isIdentifierValid || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password. Access denied.",
      });
    }

    // 30 days if rememberMe, otherwise 7 days
    const validityMs = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

    const user = {
      email: ADMIN_EMAIL,
      username: "admin",
      role: "admin",
      name: "Trinex Administrator",
    };

    const token = createToken(user, validityMs);

    return res.json({
      success: true,
      message: "Authentication successful. Access granted.",
      token,
      user,
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error during authentication." });
  }
});

/**
 * GET /api/auth/verify
 * Validates active session token
 */
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No authentication token provided." });
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ success: false, message: "Session expired or invalid. Please sign in again." });
  }

  return res.json({
    success: true,
    user: {
      email: payload.email,
      username: payload.username,
      role: payload.role,
      name: payload.name,
    },
  });
});

/**
 * POST /api/auth/logout
 * Client-side logout acknowledgment
 */
router.post("/logout", (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
});

export default router;
