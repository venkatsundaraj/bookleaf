import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getJSON } from "@/server/api";
import type { Book } from "@/lib/types";
import { TicketForm } from "./ticket-form";

async function NewTicket() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/dashboard");

  const books = await getJSON<Book[]>("/books");

  return (
    <TicketForm books={books.map((book) => ({ id: book.id, title: book.title }))} />
  );
}

export default function NewTicketPage() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1>Raise a query</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewTicket />
      </Suspense>
    </main>
  );
}
