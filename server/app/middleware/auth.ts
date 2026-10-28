import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db.ts";
import { users } from "../lib/schema/index.ts";
import { authCookieOptions, useSession } from "../lib/auth-utils.ts";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "author";
};

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export const requireAuth = async function (
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.auth;
  if (!token) {
    return res.status(401).json({ error: "You are not logged in" });
  }

  const session = await useSession(token);
  if (!session.success || !session.email) {
    res.clearCookie("auth", { ...authCookieOptions, maxAge: undefined });
    return res
      .status(401)
      .json({ error: "Your session is invalid, please log in again" });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, session.email));

  if (!user) {
    return res.status(401).json({ error: "This account no longer exists" });
  }

  req.user = user;
  next();
};

// Use after requireAuth.
export const requireRole = function (role: SessionUser["role"]) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== role) {
      return res
        .status(403)
        .json({ error: "You don't have access to this resource" });
    }
    next();
  };
};

export const currentUser = function (req: Request): SessionUser {
  if (!req.user) {
    throw new Error("currentUser() called on a route without requireAuth");
  }
  return req.user;
};
