import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "./db.ts";
import { users } from "./schema/user.ts";
import { and, eq } from "drizzle-orm";

// Stored as "salt:hash" (hex). Uses Node's built-in scrypt, so no bcrypt dependency.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

export const createSignJWT = function (email: string) {
  const token = jwt.sign(email, process.env.AUTH_SECRET!);
  return token;
};

export const verifyJWT = async function (token: string) {
  const email = jwt.verify(token, process.env.AUTH_SECRET!);
  return email;
};

export const useSession = async function (cookiesData: string) {
  // jwt.verify throws on a tampered or malformed token; treat that as "no session".
  try {
    const email = await verifyJWT(cookiesData);
    if (!email) {
      return { success: false, email: null };
    }
    return { success: true, email: String(email) };
  } catch {
    return { success: false, email: null };
  }
};

export const authCookieOptions = {
  maxAge: 3 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

export const checkAdmin = async function (cookie: string): Promise<{
  success: boolean;
  message: string;
}> {
  const auth = await useSession(cookie);
  const authEmail = String(auth.email);
  //check admin
  const adminUser = await db
    .select()
    .from(users)
    .where(and(eq(users.email, authEmail), eq(users.role, "admin")))
    .then((res) => res[0]);

  if (!adminUser || !adminUser.email) {
    return { success: false, message: "you are not admin" };
  }

  return { success: true, message: "you are an admin" };
};
