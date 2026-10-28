// Shapes returned by the Express API.

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "author";
};

export type Book = {
  id: string;
  title: string;
  serialOfISBN: string;
  genre: string;
  publication: string | null;
  status: string;
  valueOfMRP: number | null;
  copiesSold: number;
  // Postgres numeric columns arrive as strings, e.g. "3570.00".
  royaltyEarned: string;
  royaltyPaid: string;
  royaltyPending: string;
};

export type TicketSummary = {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  category: string | null;
  priority: "critical" | "high" | "medium" | "low" | null;
  createdAt: string;
  authorName: string;
  bookTitle: string | null;
};

export type TicketDraft = {
  aiRunId: string;
  draft: string;
  cached: boolean;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  senderName: string | null;
  senderRole: "admin" | "author" | null;
};

// Pushed over GET /api/tickets/events.
export type TicketEvent =
  | { type: "message"; ticketId: string; message: TicketMessage }
  | { type: "ticket"; ticketId: string };
