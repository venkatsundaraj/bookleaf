import OpenAI from "openai";
import type { TicketCategory } from "./ticketEnum.ts";
import {
  COMPANY_OVERVIEW,
  FULL_KNOWLEDGE_BASE,
  KB_SECTIONS,
} from "./knowledgeBase.ts";

export const DRAFT_MODEL = process.env.OPENAI_DRAFT_MODEL ?? "gpt-4o-mini";
export const DRAFT_PROMPT_VERSION = "draft-v1";

// Created on first use, so a missing API key fails the draft (which the
// caller handles) instead of crashing the server at startup.
let client: OpenAI | null = null;
function getClient() {
  client ??= new OpenAI({ maxRetries: 2, timeout: 30_000 });
  return client;
}

export type DraftBook = {
  title: string;
  status: string;
  publication: string | null;
  valueOfMRP: number | null;
  copiesSold: number;
  royaltyEarned: string;
  royaltyPaid: string;
  royaltyPending: string;
  lastRoyaltyPayoutDate: string | null;
  availableOn: string[];
  printPartner: string | null;
};

export type DraftInput = {
  subject: string;
  description: string;
  authorName: string;
  category: TicketCategory | null;
  book: DraftBook | null;
  today: Date;
};

// Static text first: OpenAI caches repeated prompt prefixes, so keeping the
// unchanging part at the top makes repeat calls cheaper.
const DRAFT_INSTRUCTIONS = `
You are a member of the BookLeaf Publishing author support team, writing a reply to an author's support ticket. A human admin will review and edit your draft before it is sent.

TONE (follow strictly)
- Empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before moving to solutions.
- Be specific: use the actual numbers, dates and statuses from the BOOK DATA. No vague reassurances.
- If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly. No corporate deflection.
- If escalation or investigation is needed, give a clear timeline (e.g. "within 48 hours"), never open-ended promises.
- Always end with a clear next step for the author and/or the BookLeaf team.

RULES
- Use only the facts in COMPANY POLICY and BOOK DATA. Never invent order numbers, payment amounts, dates or policies.
- If information you need is missing, say what the team will check and when they will get back, instead of guessing.
- Address the author by first name. Sign off as "Warm regards,\nBookLeaf Author Support".
- Plain text, no markdown headings. Keep it under 200 words.
`.trim();

function buildInstructions(category: TicketCategory | null) {
  const policy = category ? KB_SECTIONS[category] : FULL_KNOWLEDGE_BASE;
  return `${DRAFT_INSTRUCTIONS}\n\nCOMPANY OVERVIEW\n${COMPANY_OVERVIEW}\n\nCOMPANY POLICY\n${policy}`;
}

export function nextRoyaltyPayoutDeadline(today: Date): Date {
  const DAY = 24 * 60 * 60 * 1000;

  for (let month = 0; ; month += 3) {
    const quarterEnd = Date.UTC(today.getUTCFullYear(), month, 0);
    const deadline = new Date(quarterEnd + 45 * DAY);
    if (deadline >= today) return deadline;
  }
}

const formatDay = (date: Date) => date.toISOString().slice(0, 10);

function buildBookData(book: DraftBook | null, today: Date) {
  if (!book) return "No specific book (general / account-level query).";

  return [
    `Title: ${book.title}`,
    `Status: ${book.status}`,
    `Publication date: ${book.publication ?? "not yet published"}`,
    `MRP: ${book.valueOfMRP === null ? "not set yet" : `₹${book.valueOfMRP}`}`,
    `Copies sold: ${book.copiesSold}`,
    `Royalty earned: ₹${book.royaltyEarned}`,
    `Royalty paid: ₹${book.royaltyPaid}`,
    `Royalty pending: ₹${book.royaltyPending}`,
    `Last royalty payout: ${book.lastRoyaltyPayoutDate ?? "none yet"}`,
    `Next royalty payout deadline: ${formatDay(nextRoyaltyPayoutDeadline(today))}`,
    `Available on: ${book.availableOn.length ? book.availableOn.join(", ") : "not listed yet"}`,
    `Print partner: ${book.printPartner ?? "not assigned yet"}`,
  ].join("\n");
}

export async function generateDraft(input: DraftInput) {
  const userContent = `
TODAY: ${formatDay(input.today)}
AUTHOR NAME: ${input.authorName}

BOOK DATA
${buildBookData(input.book, input.today)}

TICKET SUBJECT
${input.subject}

TICKET DESCRIPTION
${input.description}
`.trim();

  const response = await getClient().responses.create({
    model: DRAFT_MODEL,
    instructions: buildInstructions(input.category),
    input: userContent,
    max_output_tokens: 600,
    prompt_cache_key: `bookleaf-draft-${input.category ?? "all"}`,
  });

  const draft = response.output_text.trim();
  if (!draft) throw new Error("Model returned an empty draft");

  return {
    draft,
    model: response.model,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
    cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
  };
}
