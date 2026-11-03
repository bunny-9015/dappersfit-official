import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "dappersfit_horology_jwt_secret_key_2026_luxury_secure";
const COOKIE_NAME = "df_session";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
}

// 1. Password Hashing & Verification using Node.js native crypto (scrypt)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

// 2. Cryptographic Session Token Generation & Verification (HMAC-SHA256)
export function createSessionToken(user: SessionUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );

    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role as "CUSTOMER" | "ADMIN",
    };
  } catch (err) {
    return null;
  }
}

// 3. Cookie Management (Next.js 15/16 compatible)
export async function setSession(user: SessionUser) {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {}
}
