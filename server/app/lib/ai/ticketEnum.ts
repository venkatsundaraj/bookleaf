export const TICKET_CATEGORIES = [
  "royalty_payments",
  "isbn_metadata",
  "printing_quality",
  "distribution_availability",
  "production_updates",
  "general_inquiry",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  royalty_payments: "Royalty & Payments",
  isbn_metadata: "ISBN & Metadata Issues",
  printing_quality: "Printing & Quality",
  distribution_availability: "Distribution & Availability",
  production_updates: "Book Status & Production Updates",
  general_inquiry: "General Inquiry",
};

export const TICKET_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const LABEL_SOURCES = ["ai", "admin"] as const;
export const AI_TASK_KINDS = ["classification", "draft"] as const;
export const AI_RES_STATUSES = ["pending", "success", "failed"] as const;
