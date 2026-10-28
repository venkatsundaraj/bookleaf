import type { TicketCategory } from "./ticketEnum.ts";

export const COMPANY_OVERVIEW = `
- BookLeaf Publishing is a self-publishing company operating in India and the US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
- In-house printing facility and warehouse in Delhi; print partners include Repro India and Epitome Books.
`.trim();

export const KB_SECTIONS: Record<TicketCategory, string> = {
  royalty_payments: `
ROYALTY POLICY
- 80/20 split: 80% of the net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. Below that, royalties roll over to the next quarter.
- Payouts go by bank transfer to the account linked in the author's dashboard.
- Authors can see a detailed royalty breakdown with per-platform sales in their dashboard.

HOW TO HANDLE
- "No royalty received": acknowledge the frustration, explain the quarterly cycle and 45-day payout window, ask them to confirm their bank details are linked, give the specific next payout date. If a payment is genuinely overdue, escalate with a 48-hour resolution timeline.
- "Royalty seems too low": explain the net profit calculation, offer a detailed line-by-line breakdown. Be transparent, not defensive.
`.trim(),

  isbn_metadata: `
ISBN POLICY
- Every book gets a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.
- Authors who want an ISBN under their own imprint must obtain it independently.
- ISBN errors (duplicate, wrong book linked) are high priority and escalated to the production team.
- Metadata updates (e.g. book description) can be submitted through the dashboard or by emailing the BookLeaf team; changes reflect on platforms within 3–5 business days.

HOW TO HANDLE
- ISBN mismatch or error: treat as serious, acknowledge it is a data issue on BookLeaf's side, confirm escalation to the production team, give a 48-hour resolution timeline.
`.trim(),

  printing_quality: `
PRINTING & QUALITY
- In-house printing handles most orders; overflow or specific formats go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, colour inconsistency): BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy.

HOW TO HANDLE
- Apologise sincerely, ask for photos of the defective copies, confirm a free reprint once verified, give 5–7 business days for the reprint.
`.trim(),

  distribution_availability: `
DISTRIBUTION & AVAILABILITY
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- "Unavailable" on a platform usually means a stock sync issue; BookLeaf can trigger a re-sync within 24–48 hours.

HOW TO HANDLE
- Explain it is typically a stock sync issue, confirm you are triggering a re-sync with the distribution team, set the expectation of 24–48 hours.
`.trim(),

  production_updates: `
PRODUCTION STAGES
- Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
- Authors are emailed at each stage.
- Delays usually happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).

HOW TO HANDLE
- Use the book's actual current stage. If delayed, be honest about why and give a specific updated timeline. Never blame the author even if the delay is on their side; frame it collaboratively.
`.trim(),

  general_inquiry: `
GENERAL
- Metadata updates (e.g. book description on Amazon) can be submitted through the dashboard or by emailing the BookLeaf team; changes reflect on platforms within 3–5 business days.
- Royalties are paid quarterly, within 45 days of the quarter ending, via bank transfer.
- New listings go live within 7–10 business days after publication.
`.trim(),
};

// Used when the ticket hasn't been classified (e.g. classification failed).
export const FULL_KNOWLEDGE_BASE = Object.values(KB_SECTIONS).join("\n\n");
