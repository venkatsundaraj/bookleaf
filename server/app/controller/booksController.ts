import type { Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../lib/db.ts";
import { books } from "../lib/schema/index.ts";
import { currentUser } from "../middleware/auth.ts";

export const listBooks = async function (req: Request, res: Response) {
  const user = currentUser(req);

  const rows = await db
    .select()
    .from(books)
    .where(user.role === "admin" ? undefined : eq(books.authorId, user.id))
    .orderBy(desc(books.publication));

  return res.json(rows);
};
