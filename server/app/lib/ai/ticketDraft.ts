import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.ts";
import { books, ticketAIRuns, tickets, users } from "../schema/index.ts";
import {
  DRAFT_MODEL,
  DRAFT_PROMPT_VERSION,
  generateDraft,
} from "./draftResponse.ts";

export type TicketDraftResult =
  | { status: "ok"; aiRunId: string; draft: string; cached: boolean }
  | { status: "not_found" }
  | { status: "failed"; error: string };

// Returns the latest successful draft if there is one, so reopening a ticket
// costs nothing. Pass regenerate to force a fresh draft.
export async function getOrCreateTicketDraft(
  ticketId: string,
  { regenerate = false } = {},
): Promise<TicketDraftResult> {
  const [ticket] = await db
    .select({
      subject: tickets.subject,
      description: tickets.description,
      category: tickets.category,
      authorName: users.name,
      book: {
        title: books.title,
        status: books.status,
        publication: books.publication,
        valueOfMRP: books.valueOfMRP,
        copiesSold: books.copiesSold,
        royaltyEarned: books.royaltyEarned,
        royaltyPaid: books.royaltyPaid,
        royaltyPending: books.royaltyPending,
        lastRoyaltyPayoutDate: books.lastRoyaltyPayoutDate,
        availableOn: books.availableOn,
        printPartner: books.printPartner,
      },
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.ownerOfTheticket, users.id))
    .leftJoin(books, eq(tickets.bookId, books.id))
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!ticket) return { status: "not_found" };

  if (!regenerate) {
    const [existing] = await db
      .select({ id: ticketAIRuns.id, output: ticketAIRuns.output })
      .from(ticketAIRuns)
      .where(
        and(
          eq(ticketAIRuns.ticketId, ticketId),
          eq(ticketAIRuns.aiTaskKind, "draft"),
          eq(ticketAIRuns.aiResStatus, "success"),
        ),
      )
      .orderBy(desc(ticketAIRuns.createdAt))
      .limit(1);

    if (existing) {
      const { draft } = existing.output as { draft: string };
      return { status: "ok", aiRunId: existing.id, draft, cached: true };
    }
  }

  const [run] = await db
    .insert(ticketAIRuns)
    .values({
      ticketId,
      aiTaskKind: "draft",
      model: DRAFT_MODEL,
      promptVersion: DRAFT_PROMPT_VERSION,
    })
    .returning({ id: ticketAIRuns.id });

  try {
    const result = await generateDraft({
      subject: ticket.subject,
      description: ticket.description,
      authorName: ticket.authorName,
      category: ticket.category,
      book: ticket.book,
      today: new Date(),
    });

    await db
      .update(ticketAIRuns)
      .set({
        aiResStatus: "success",
        output: { draft: result.draft, cachedInputTokens: result.cachedInputTokens },
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      })
      .where(eq(ticketAIRuns.id, run.id));

    return { status: "ok", aiRunId: run.id, draft: result.draft, cached: false };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db
      .update(ticketAIRuns)
      .set({ aiResStatus: "failed", error })
      .where(eq(ticketAIRuns.id, run.id));
    return { status: "failed", error };
  }
}
