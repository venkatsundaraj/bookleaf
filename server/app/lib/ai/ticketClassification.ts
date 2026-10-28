import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "../db.ts";

import {
  classifyTicket,
  CLASSIFY_MODEL,
  CLASSIFY_PROMPT_VERSION,
} from "../../lib/ai/createAIOutput.ts";
// Node's ESM loader doesn't resolve a folder to index.ts, so the file is explicit.
import { ticketAIRuns, tickets } from "../schema/index.ts";
import { publishTicketEvent } from "../ticketEvents.ts";

export async function runTicketClassification(ticketId: string) {
  const [ticket] = await db
    .select({
      subject: tickets.subject,
      description: tickets.description,
      ownerId: tickets.ownerOfTheticket,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

  const [run] = await db
    .insert(ticketAIRuns)
    .values({
      ticketId,
      aiTaskKind: "classification",
      model: CLASSIFY_MODEL,
      promptVersion: CLASSIFY_PROMPT_VERSION,
    })
    .returning({ id: ticketAIRuns.id });

  try {
    // Inside the try so an AI outage marks the run "failed" instead of
    // leaving it "pending" forever.
    const result = await classifyTicket({
      subject: ticket.subject,
      description: ticket.description,
    });
    const { category, priority } = result.classification;

    await db.transaction(async (tx) => {
      await tx
        .update(ticketAIRuns)
        .set({
          aiResStatus: "success",
          output: result.classification,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        })
        .where(eq(ticketAIRuns.id, run.id));

      await tx
        .update(tickets)
        .set({ category, categorySource: "ai" })
        .where(
          and(
            eq(tickets.id, ticketId),
            or(
              isNull(tickets.categorySource),
              eq(tickets.categorySource, "ai"),
            ),
          ),
        );

      await tx
        .update(tickets)
        .set({ priority, prioritySource: "ai" })
        .where(
          and(
            eq(tickets.id, ticketId),
            or(
              isNull(tickets.prioritySource),
              eq(tickets.prioritySource, "ai"),
            ),
          ),
        );

      return result.classification;
    });

    // Lets open dashboards pick up the new category and priority.
    publishTicketEvent({
      ownerId: ticket.ownerId,
      internal: false,
      event: { type: "ticket", ticketId },
    });
  } catch (err) {
    await db
      .update(ticketAIRuns)
      .set({
        aiResStatus: "failed",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(ticketAIRuns.id, run.id));
    return null;
  }
}
