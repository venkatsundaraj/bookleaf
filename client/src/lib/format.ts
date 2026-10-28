export function formatRupees(value: number | string | null): string {
  if (value === null) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

// Dates from Postgres `date` columns are "YYYY-MM-DD"; format in UTC so the
// server's timezone can't shift them by a day.
export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

const BOOK_STATUS_LABELS: Record<string, string> = {
  manuscript_received: "In production: Manuscript received",
  editing: "In production: Editing",
  cover_design: "In production: Cover design",
  typesetting: "In production: Typesetting",
  proofreading: "In production: Proofreading",
  isbn_assignment: "In production: ISBN assignment",
  printing: "In production: Printing",
  distribution_setup: "In production: Distribution setup",
  published: "Published & Live",
};

export function bookStatusLabel(status: string): string {
  return BOOK_STATUS_LABELS[status] ?? status;
}

const CATEGORY_LABELS: Record<string, string> = {
  royalty_payments: "Royalty & Payments",
  isbn_metadata: "ISBN & Metadata Issues",
  printing_quality: "Printing & Quality",
  distribution_availability: "Distribution & Availability",
  production_updates: "Book Status & Production Updates",
  general_inquiry: "General Inquiry",
};

export function categoryLabel(category: string | null): string {
  return category ? (CATEGORY_LABELS[category] ?? category) : "Unclassified";
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function ticketStatusLabel(status: string): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}
