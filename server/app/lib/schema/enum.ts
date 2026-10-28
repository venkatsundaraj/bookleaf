import { pgEnum } from "drizzle-orm/pg-core";
import {
  AI_RES_STATUSES,
  AI_TASK_KINDS,
  LABEL_SOURCES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "../ai/ticketEnum.ts";

export const userEnum = pgEnum("role", ["admin", "author"]);

// Production stages from the knowledge base, in pipeline order.
// Sample data "In Production - Cover Design" -> "cover_design", "Published & Live" -> "published".
export const bookStatus = pgEnum("bookStatus", [
  "manuscript_received",
  "editing",
  "cover_design",
  "typesetting",
  "proofreading",
  "isbn_assignment",
  "printing",
  "distribution_setup",
  "published",
]);
export const ticketStatus = pgEnum("ticketStatus", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);
// Declaration order is the sort order: ORDER BY priority puts critical first.
export const priority = pgEnum("priority", TICKET_PRIORITIES);
export const categoryLabel = pgEnum("categoryLabel", TICKET_CATEGORIES);

export const labelSource = pgEnum("labelSource", LABEL_SOURCES);

export const aiTaskKind = pgEnum("aiTaskKind", AI_TASK_KINDS);

export const aiResStatus = pgEnum("aiResStatus", AI_RES_STATUSES);
