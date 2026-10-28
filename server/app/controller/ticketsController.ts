import type { Request, Response } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../lib/db.ts";
import { books, tickets, users } from "../lib/schema/index.ts";
import { currentUser } from "../middleware/auth.ts";
import {
  draftRequestValidation,
  ticketValidation,
} from "../lib/validation/ticketValidation.ts";
import { getOrCreateTicketDraft } from "../lib/ai/ticketDraft.ts";
import { runTicketClassification } from "../lib/ai/ticketClassification.ts";

// Authors get their own tickets; admins get every ticket.
// Order: unresolved first, then most urgent, then oldest.
export const listTickets = async function (req: Request, res: Response) {
  const user = currentUser(req);

  const rows = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      description: tickets.description,
      status: tickets.ticketStatus,
      category: tickets.category,
      priority: tickets.priority,
      createdAt: tickets.createdAt,
      authorName: users.name,
      bookTitle: books.title,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.ownerOfTheticket, users.id))
    .leftJoin(books, eq(tickets.bookId, books.id))
    .where(
      user.role === "admin" ? undefined : eq(tickets.ownerOfTheticket, user.id),
    )
    .orderBy(
      sql`case when ${tickets.ticketStatus} in ('resolved', 'closed') then 1 else 0 end`,
      sql`${tickets.priority} asc nulls last`,
      asc(tickets.createdAt),
    );

  return res.json(rows);
};

export const createTicket = async function (req: Request, res: Response) {
  const user = currentUser(req);
  const ticketBody = ticketValidation.safeParse(req.body);

  if (!ticketBody.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: ticketBody.error.issues });
  }
  const { bookId, description, subject } = ticketBody.data;
  const existingTicket = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(
      and(
        eq(tickets.bookId, bookId),
        eq(tickets.ownerOfTheticket, user.id),
        eq(tickets.subject, subject),
      ),
    )
    .limit(1);

  if (existingTicket.length) {
    return res
      .status(409)
      .json({ error: "A ticket with this bookid and subject already exists" });
  }

  const ticket = await db
    .insert(tickets)
    .values({
      subject: subject,
      description: description,
      ownerOfTheticket: user.id,
      bookId: bookId,
      ticketStatus: "open",
    })
    .returning({ id: tickets.id })
    .then((res) => res[0]);

  res.json(ticket).status(201);
  runTicketClassification(ticket.id).catch(console.error);
};

// POST /api/tickets/:id/draft  body: { regenerate?: boolean }
// Admin only (enforced in the route). Returns the cached draft unless
// regenerate is true. If the AI is unavailable the admin still gets a clear
// 503 and can write the reply by hand.
export const generateAIDraft = async function (req: Request, res: Response) {
  const parsed = draftRequestValidation.safeParse({
    ticketId: req.params.id,
    regenerate: req.body?.regenerate,
  });
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parsed.error.issues });
  }

  const result = await getOrCreateTicketDraft(parsed.data.ticketId, {
    regenerate: parsed.data.regenerate,
  });

  if (result.status === "not_found") {
    return res.status(404).json({ error: "Ticket not found" });
  }
  if (result.status === "failed") {
    return res.status(503).json({
      error:
        "The AI draft is unavailable right now. You can write the reply manually.",
    });
  }

  const { status, ...draft } = result;
  return res.status(draft.cached ? 200 : 201).json(draft);
};
