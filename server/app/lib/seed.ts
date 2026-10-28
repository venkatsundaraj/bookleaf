// Seeds the provided sample dataset plus one admin account.
// Safe to re-run: it clears every table first.
// Run with: pnpm db:seed

import { db } from "./db.ts";
import { hashPassword } from "./auth-utils.ts";
import {
  users,
  books,
  tickets,
  ticketMessages,
  ticketAIRuns,
} from "./schema/index.ts";
import sampleData from "./data/bookleaf_sample_data.json" with { type: "json" };

// Demo credentials, listed in the README.
const AUTHOR_PASSWORD = "author123";
const ADMIN = {
  id: "ADMIN001",
  name: "BookLeaf Support",
  email: "admin@bookleaf.com",
  password: "admin123",
};

// The dataset uses display labels; the schema uses production-stage slugs.
const STATUS_MAP = {
  "Published & Live": "published",
  "In Production - Cover Design": "cover_design",
  "In Production - Typesetting": "typesetting",
} as const;

function toBookStatus(label: string) {
  const status = STATUS_MAP[label as keyof typeof STATUS_MAP];
  if (!status)
    throw new Error(`Unknown book status in sample data: "${label}"`);
  return status;
}

async function seed() {
  const authorRows = sampleData.authors.map((author) => ({
    id: author.author_id,
    name: author.name,
    email: author.email,
    password: hashPassword(AUTHOR_PASSWORD),
    role: "author" as const,
    phone: author.phone,
    city: author.city,
    joinedDate: author.joined_date,
  }));

  const bookRows = sampleData.authors.flatMap((author) =>
    author.books.map((book) => ({
      id: book.book_id,
      authorId: author.author_id,
      title: book.title,
      serialOfISBN: book.isbn,
      genre: book.genre,
      publication: book.publication_date,
      status: toBookStatus(book.status),
      valueOfMRP: book.mrp,
      authorRoyaltyPerCopy: book.author_royalty_per_copy,
      copiesSold: book.total_copies_sold,
      royaltyEarned: String(book.total_royalty_earned),
      royaltyPaid: String(book.royalty_paid),
      royaltyPending: String(book.royalty_pending),
      lastRoyaltyPayoutDate: book.last_royalty_payout_date,
      printPartner: book.print_partner,
      availableOn: book.available_on,
    })),
  );

  await db.transaction(async (tx) => {
    // Children before parents, so foreign keys don't block the delete.
    await tx.delete(ticketMessages);
    await tx.delete(ticketAIRuns);
    await tx.delete(tickets);
    await tx.delete(books);
    await tx.delete(users);

    await tx.insert(users).values([
      {
        id: ADMIN.id,
        name: ADMIN.name,
        email: ADMIN.email,
        password: hashPassword(ADMIN.password),
        role: "admin",
      },
      ...authorRows,
    ]);
    await tx.insert(books).values(bookRows);
  });

  console.log(
    `Seeded 1 admin, ${authorRows.length} authors, ${bookRows.length} books.`,
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
