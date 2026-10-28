import { Router } from "express";
import {
  listTickets,
  createTicket,
  generateAIDraft,
} from "../controller/ticketsController.ts";
import {
  createMessage,
  listMessages,
  streamTicketEvents,
} from "../controller/messagesController.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";

const ticketRouter = Router();

ticketRouter.get("/", requireAuth, listTickets);
ticketRouter.post("/", requireAuth, createTicket);
// Before any "/:id" GET route so "events" isn't read as a ticket id.
ticketRouter.get("/events", requireAuth, streamTicketEvents);
ticketRouter.get("/:id/messages", requireAuth, listMessages);
ticketRouter.post("/:id/messages", requireAuth, createMessage);
ticketRouter.post(
  "/:id/draft",
  requireAuth,
  requireRole("admin"),
  generateAIDraft,
);

export default ticketRouter;
