import {
  pgTableCreator,
  text,
  timestamp,
  numeric,
  integer,
  date,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import {
  aiResStatus,
  aiTaskKind,
  bookStatus,
  categoryLabel,
  labelSource,
  priority,
  ticketStatus,
  userEnum,
} from "./enum.ts";
const tableCreater = pgTableCreator((name) => `bookleaf_${name}`);

// Authors and admins share one table; `role` decides access.
export const users = tableCreater("users", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userEnum("role").notNull().default("author"),
  phone: text("phone"),
  city: text("city"),
  joinedDate: date("joinedDate"),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Books still in production have no publication date, MRP or per-copy royalty yet.
export const books = tableCreater("books", {
  id: text("id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey(),
  serialOfISBN: text("serialOfISBN").notNull().unique(),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  publication: date("publication"),
  status: bookStatus("status").notNull(),
  valueOfMRP: integer("valueOfMRP"),
  authorRoyaltyPerCopy: integer("authorRoyaltyPerCopy"),
  copiesSold: integer("copiesSold").notNull().default(0),
  royaltyEarned: numeric("royaltyEarned", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  royaltyPaid: numeric("royaltyPaid", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  royaltyPending: numeric("royaltyPending", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  lastRoyaltyPayoutDate: date("lastRoyaltyPayoutDate"),
  printPartner: text("printPartner"),
  availableOn: text("availableOn").array().notNull().default([]),

  authorId: text("authorId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const tickets = tableCreater(
  "tickets",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    uploadUrl: text("uploadUrl"),
    subject: text("subject").notNull(),
    description: text("description").notNull(),

    // null = "General / Account Level"
    bookId: text("bookId").references(() => books.id, {
      onDelete: "set null",
    }),

    // null until classified, so a failed AI call shows as "unclassified"
    // rather than a made-up label. Source flips to "admin" on override.
    category: categoryLabel("category"),
    categorySource: labelSource("categorySource"),
    priority: priority("priority"),
    prioritySource: labelSource("prioritySource"),

    ticketStatus: ticketStatus("ticketStatus").default("open").notNull(),

    ownerOfTheticket: text("ownerOfTheticket")
      .references(() => users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    assignedAdminId: text("assignedAdminId").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
    firstResponseAt: timestamp("firstResponseAt", { withTimezone: true }),
  },
  (t) => [
    index("tickets_queue_idx").on(t.ticketStatus, t.priority, t.createdAt),
    index("tickets_owner_idx").on(t.ownerOfTheticket),
    index("tickets_assignee_idx").on(t.assignedAdminId),
  ],
);

export const ticketAIRuns = tableCreater(
  "ticketAIRuns",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    ticketId: text("ticketId")
      .references(() => tickets.id, { onDelete: "cascade" })
      .notNull(),
    aiTaskKind: aiTaskKind("aiTaskKind").notNull(),
    aiResStatus: aiResStatus("aiResStatus").default("pending").notNull(),
    output: jsonb("output"),
    model: text("model"),
    promptVersion: text("promptVersion"),
    inputTokens: integer("inputTokens"),
    outputTokens: integer("outputTokens"),
    error: text("error"),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("ai_runs_ticket_idx").on(t.ticketId, t.aiTaskKind)],
);

export const ticketMessages = tableCreater(
  "ticketMessages",
  {
    id: text("id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    ticketId: text("ticketId")
      .references(() => tickets.id, { onDelete: "cascade" })
      .notNull(),
    senderId: text("senderId").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    isInternal: boolean("isInternal").default(false).notNull(),

    // The AI draft this reply started from, if any.
    aiRunId: text("aiRunId").references(() => ticketAIRuns.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("messages_ticket_idx").on(t.ticketId, t.createdAt)],
);
