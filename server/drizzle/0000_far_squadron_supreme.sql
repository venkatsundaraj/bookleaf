CREATE TYPE "public"."aiResStatus" AS ENUM('pending', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."aiTaskKind" AS ENUM('classification', 'draft');--> statement-breakpoint
CREATE TYPE "public"."bookStatus" AS ENUM('manuscript_received', 'editing', 'cover_design', 'typesetting', 'proofreading', 'isbn_assignment', 'printing', 'distribution_setup', 'published');--> statement-breakpoint
CREATE TYPE "public"."categoryLabel" AS ENUM('royalty_payments', 'isbn_metadata', 'printing_quality', 'distribution_availability', 'production_updates', 'general_inquiry');--> statement-breakpoint
CREATE TYPE "public"."labelSource" AS ENUM('ai', 'admin');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."ticketStatus" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'author');--> statement-breakpoint
CREATE TABLE "bookleaf_books" (
	"id" text PRIMARY KEY NOT NULL,
	"serialOfISBN" text NOT NULL,
	"title" text NOT NULL,
	"genre" text NOT NULL,
	"publication" date,
	"status" "bookStatus" NOT NULL,
	"valueOfMRP" integer,
	"authorRoyaltyPerCopy" integer,
	"copiesSold" integer DEFAULT 0 NOT NULL,
	"royaltyEarned" numeric(12, 2) DEFAULT '0' NOT NULL,
	"royaltyPaid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"royaltyPending" numeric(12, 2) DEFAULT '0' NOT NULL,
	"lastRoyaltyPayoutDate" date,
	"printPartner" text,
	"availableOn" text[] DEFAULT '{}' NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookleaf_books_serialOfISBN_unique" UNIQUE("serialOfISBN")
);
--> statement-breakpoint
CREATE TABLE "bookleaf_ticketAIRuns" (
	"id" text PRIMARY KEY NOT NULL,
	"ticketId" text NOT NULL,
	"aiTaskKind" "aiTaskKind" NOT NULL,
	"aiResStatus" "aiResStatus" DEFAULT 'pending' NOT NULL,
	"output" jsonb,
	"model" text,
	"promptVersion" text,
	"inputTokens" integer,
	"outputTokens" integer,
	"error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookleaf_ticketMessages" (
	"id" text PRIMARY KEY NOT NULL,
	"ticketId" text NOT NULL,
	"senderId" text,
	"body" text NOT NULL,
	"isInternal" boolean DEFAULT false NOT NULL,
	"aiRunId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookleaf_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"uploadUrl" text,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"bookId" text,
	"category" "categoryLabel",
	"categorySource" "labelSource",
	"priority" "priority",
	"prioritySource" "labelSource",
	"ticketStatus" "ticketStatus" DEFAULT 'open' NOT NULL,
	"ownerOfTheticket" text NOT NULL,
	"assignedAdminId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedAt" timestamp with time zone,
	"firstResponseAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bookleaf_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'author' NOT NULL,
	"phone" text,
	"city" text,
	"joinedDate" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookleaf_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookleaf_books" ADD CONSTRAINT "bookleaf_books_authorId_bookleaf_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."bookleaf_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_ticketAIRuns" ADD CONSTRAINT "bookleaf_ticketAIRuns_ticketId_bookleaf_tickets_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."bookleaf_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_ticketMessages" ADD CONSTRAINT "bookleaf_ticketMessages_ticketId_bookleaf_tickets_id_fk" FOREIGN KEY ("ticketId") REFERENCES "public"."bookleaf_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_ticketMessages" ADD CONSTRAINT "bookleaf_ticketMessages_senderId_bookleaf_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."bookleaf_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_ticketMessages" ADD CONSTRAINT "bookleaf_ticketMessages_aiRunId_bookleaf_ticketAIRuns_id_fk" FOREIGN KEY ("aiRunId") REFERENCES "public"."bookleaf_ticketAIRuns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_tickets" ADD CONSTRAINT "bookleaf_tickets_bookId_bookleaf_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."bookleaf_books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_tickets" ADD CONSTRAINT "bookleaf_tickets_ownerOfTheticket_bookleaf_users_id_fk" FOREIGN KEY ("ownerOfTheticket") REFERENCES "public"."bookleaf_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookleaf_tickets" ADD CONSTRAINT "bookleaf_tickets_assignedAdminId_bookleaf_users_id_fk" FOREIGN KEY ("assignedAdminId") REFERENCES "public"."bookleaf_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_runs_ticket_idx" ON "bookleaf_ticketAIRuns" USING btree ("ticketId","aiTaskKind");--> statement-breakpoint
CREATE INDEX "messages_ticket_idx" ON "bookleaf_ticketMessages" USING btree ("ticketId","createdAt");--> statement-breakpoint
CREATE INDEX "tickets_queue_idx" ON "bookleaf_tickets" USING btree ("ticketStatus","priority","createdAt");--> statement-breakpoint
CREATE INDEX "tickets_owner_idx" ON "bookleaf_tickets" USING btree ("ownerOfTheticket");--> statement-breakpoint
CREATE INDEX "tickets_assignee_idx" ON "bookleaf_tickets" USING btree ("assignedAdminId");