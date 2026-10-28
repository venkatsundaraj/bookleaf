import {
  loginValidation,
  userValidation,
} from "../lib/validation/authValidation.ts";
import { db } from "../lib/db.ts";
import type { Request, Response } from "express";
import { users } from "../lib/schema/index.ts";
import { eq } from "drizzle-orm";

import {
  hashPassword,
  createSignJWT,
  verifyPassword,
  authCookieOptions,
} from "../lib/auth-utils.ts";
import { currentUser } from "../middleware/auth.ts";

// Never send the password hash back to the client.
const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
};

// Sign-up is for authors only; admin accounts come from the seed.
export const signUp = async function (req: Request, res: Response) {
  const parsedBody = userValidation.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parsedBody.error.issues });
  }

  const { email, password } = parsedBody.data;
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    return res
      .status(409)
      .json({ error: "An account with this email already exists" });
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      password: hashPassword(password),
      role: "author",
      name: email.split("@")[0],
    })
    .returning(publicUserColumns);

  res.cookie("auth", createSignJWT(newUser.email), authCookieOptions);
  return res.status(201).json(newUser);
};

export const login = async function (req: Request, res: Response) {
  const parsedBody = loginValidation.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parsedBody.error.issues });
  }

  const { email, password, role } = parsedBody.data;
  const [user] = await db
    .select({ ...publicUserColumns, password: users.password })
    .from(users)
    .where(eq(users.email, email));

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  if (user.role !== role) {
    return res.status(403).json({
      error:
        role === "admin"
          ? "This account doesn't have admin access"
          : "Admins should log in from the admin login page",
    });
  }

  res.cookie("auth", createSignJWT(user.email), authCookieOptions);

  const { password: _password, ...publicUser } = user;
  return res.json(publicUser);
};

export const logout = async function (req: Request, res: Response) {
  res.clearCookie("auth", { ...authCookieOptions, maxAge: undefined });
  return res.status(204).end();
};

export const me = async function (req: Request, res: Response) {
  return res.json(currentUser(req));
};
