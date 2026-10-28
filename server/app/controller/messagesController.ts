import type { Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../lib/db.ts";
import {
  ticketAIRuns,
  ticketMessages,
  tickets,
  users,
} from "../lib/schema/index.ts";
import { currentUser, type SessionUser } from "../middleware/auth.ts";
import { messageValidation } from "../lib/validation/ticketValidation.ts";
import { onTicketEvent, publishTicketEvent } from "../lib/ticketEvents.ts";

// Authors can only reach their own tickets. A ticket they don't own is a 404,
// so ticket ids can't be probed.
async function findAccessibleTicket(ticketId: string, user: SessionUser) {
  const [ticket] = await db
    .select({
      id: tickets.id,
      ownerId: tickets.ownerOfTheticket,
      status: tickets.ticketStatus,
      firstResponseAt: tickets.firstResponseAt,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) return null;
  if (user.role !== "admin" && ticket.ownerId !== user.id) return null;
  return ticket;
}

// GET /api/tickets/:id/messages
// Admins see internal notes; authors only see the public conversation.
export const listMessages = async function (req: Request, res: Response) {
  const user = currentUser(req);
  const ticket = await findAccessibleTicket(String(req.params.id), user);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const rows = await db
    .select({
      id: ticketMessages.id,
      ticketId: ticketMessages.ticketId,
      body: ticketMessages.body,
      isInternal: ticketMessages.isInternal,
      createdAt: ticketMessages.createdAt,
      senderName: users.name,
      senderRole: users.role,
    })
    .from(ticketMessages)
    .leftJoin(users, eq(ticketMessages.senderId, users.id))
    .where(
      and(
        eq(ticketMessages.ticketId, ticket.id),
        user.role === "admin"
          ? undefined
          : eq(ticketMessages.isInternal, false),
      ),
    )
    .orderBy(asc(ticketMessages.createdAt));

  return res.json(rows);
};

export const createMessage = async function (req: Request, res: Response) {
  const user = currentUser(req);
  const parsed = messageValidation.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid input", details: parsed.error.issues });
  }

  const ticket = await findAccessibleTicket(String(req.params.id), user);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const isAdmin = user.role === "admin";
  const isInternal = isAdmin && parsed.data.isInternal;
  const aiRunId = isAdmin && !isInternal ? (parsed.data.aiRunId ?? null) : null;

  if (aiRunId) {
    const [run] = await db
      .select({ id: ticketAIRuns.id })
      .from(ticketAIRuns)
      .where(
        and(eq(ticketAIRuns.id, aiRunId), eq(ticketAIRuns.ticketId, ticket.id)),
      )
      .limit(1);
    if (!run) {
      return res
        .status(400)
        .json({ error: "That AI draft is not for this ticket" });
    }
  }

  const message = await db.transaction(async (tx) => {
    const [message] = await tx
      .insert(ticketMessages)
      .values({
        ticketId: ticket.id,
        senderId: user.id,
        body: parsed.data.body,
        isInternal,
        aiRunId,
      })
      .returning({
        id: ticketMessages.id,
        ticketId: ticketMessages.ticketId,
        body: ticketMessages.body,
        isInternal: ticketMessages.isInternal,
        createdAt: ticketMessages.createdAt,
      });

    if (isAdmin && !isInternal) {
      await tx
        .update(tickets)
        .set({
          firstResponseAt: ticket.firstResponseAt ?? new Date(),
          ticketStatus:
            ticket.status === "open" ? "in_progress" : ticket.status,
        })
        .where(eq(tickets.id, ticket.id));
    }

    return message;
  });

  const fullMessage = {
    ...message,
    senderName: user.name,
    senderRole: user.role,
  };

  publishTicketEvent({
    ownerId: ticket.ownerId,
    internal: isInternal,
    event: { type: "message", ticketId: ticket.id, message: fullMessage },
  });

  return res.status(201).json(fullMessage);
};

// GET /api/tickets/events  (Server-Sent Events)
// One long-lived connection per tab. Admins get every event; authors only get
// public events on their own tickets.
export const streamTicketEvents = function (req: Request, res: Response) {
  const user = currentUser(req);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    // no-transform stops proxies (including the Next.js rewrite) from
    // compressing, which would buffer the stream.
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  // Tell the browser how long to wait before reconnecting.
  res.write("retry: 3000\n\n");

  const unsubscribe = onTicketEvent(({ ownerId, internal, event }) => {
    if (user.role !== "admin" && (ownerId !== user.id || internal)) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Comment lines keep idle connections from being closed by proxies.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};
