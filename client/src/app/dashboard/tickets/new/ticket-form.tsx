"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

// Select value for "General / Account Level"; sent to the API as bookId: null.
const GENERAL = "general";

type TicketFormProps = {
  books: { id: string; title: string }[];
};

type CreatedTicket = { id: string; subject: string };

export function TicketForm({ books }: TicketFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreatedTicket | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const bookId = String(form.get("bookId"));

    setError(null);
    setPending(true);
    try {
      // The attachment is UI-only for now, so it isn't sent.
      const ticket = await apiRequest<CreatedTicket>("/tickets", {
        method: "POST",
        body: {
          bookId: bookId === GENERAL ? null : bookId,
          subject: String(form.get("subject")).trim(),
          description: String(form.get("description")).trim(),
        },
      });
      setCreated(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  if (created) {
    return (
      <section className="flex flex-col gap-3">
        <h2>We&apos;ve received your query</h2>
        <p>
          &ldquo;{created.subject}&rdquo; has been sent to the BookLeaf support
          team. Their reply will appear on this portal.
        </p>
        <div className="flex gap-4">
          <button onClick={() => setCreated(null)}>Raise another query</button>
          <Link href="/dashboard/tickets">View my tickets</Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        Which book is this about?
        <select name="bookId" required defaultValue="">
          <option value="" disabled>
            Choose a book…
          </option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
          <option value={GENERAL}>General / Account Level</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        Subject
        <input
          name="subject"
          required
          minLength={5}
          maxLength={150}
          placeholder="e.g. Royalty for last quarter not received"
        />
      </label>

      <label className="flex flex-col gap-1">
        Describe the issue
        <textarea
          name="description"
          required
          minLength={20}
          rows={8}
          placeholder="Include dates, amounts, order numbers or platform names where you can. It helps us answer in one go."
        />
      </label>

      <label className="flex flex-col gap-1">
        Attachment (optional)
        <input name="attachment" type="file" accept="image/*,.pdf" />
        <small>
          Photos of a defective copy or a screenshot of the listing help. File
          upload isn&apos;t enabled yet, so mention it in the description too.
        </small>
      </label>

      {error && <p role="alert">{error}</p>}

      <div className="flex gap-4">
        <button type="submit" disabled={pending} className="px-4 py-2">
          {pending ? "Submitting…" : "Submit query"}
        </button>
        <Link href="/dashboard" className="self-center">
          Cancel
        </Link>
      </div>
    </form>
  );
}
