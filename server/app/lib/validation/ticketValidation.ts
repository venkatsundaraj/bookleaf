import z from "zod";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../ai/ticketEnum.ts";

// Same limits as createTicketSchema, so anything that saves can also be classified.
export const ticketValidation = z.object({
  subject: z.string().trim().min(5, "Subject is too short").max(200),
  bookId: z.string().min(1),
  description: z.string().trim().min(10, "Please describe the issue").max(5000),
});

export const ticketIdValidation = ticketValidation.omit({
  description: true,
  subject: true,
});

export const draftRequestValidation = z.object({
  ticketId: z.string().min(1),
  regenerate: z.boolean().optional().default(false),
});

export const messageValidation = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(5000),
  isInternal: z.boolean().optional().default(false),
  aiRunId: z.string().min(1).nullable().optional(),
});

export type ticketValidationType = z.infer<typeof ticketValidation>;
export type ticketIdValidationType = z.infer<typeof ticketIdValidation>;

// -------------------

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5, "Subject is too short").max(200),
  description: z.string().trim().min(10, "Please describe the issue").max(5000),
  bookId: z.string().uuid().nullable().optional(), // null = General / Account Level
  uploadUrl: z.string().url().nullable().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const classifyInputSchema = createTicketSchema.pick({
  subject: true,
  description: true,
});
export type ClassifyInput = z.infer<typeof classifyInputSchema>;

export const ticketClassificationSchema = z.object({
  category: z
    .enum(TICKET_CATEGORIES)
    .describe("The single best-fitting category for the ticket"),
  categoryReason: z
    .string()
    .describe(
      "One short sentence explaining the category choice, for the admin",
    ),
  priority: z
    .enum(TICKET_PRIORITIES)
    .describe("Urgency according to the priority rubric"),
  priorityReason: z
    .string()
    .describe("One short sentence explaining the priority, for the admin"),
  confidence: z.number().describe("Confidence in the category from 0 to 1"),
});
export type TicketClassification = z.infer<typeof ticketClassificationSchema>;

export const overrideClassificationSchema = z
  .object({
    ticketId: z.string().uuid(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
  })
  .refine((v) => v.category || v.priority, {
    message: "Provide a category and/or a priority",
  });
