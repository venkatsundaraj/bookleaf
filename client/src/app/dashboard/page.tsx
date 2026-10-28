import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getJSON } from "@/server/api";
import type { Book } from "@/lib/types";
import { BooksTable } from "./books-table";

async function AuthorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/dashboard");

  const books = await getJSON<Book[]>("/books");

  return (
    <>
      <h1>Welcome, {user.name}</h1>

      <section className="flex flex-col gap-2">
        <h2>My Books</h2>
        {books.length === 0 ? (
          <p>You don&apos;t have any books with BookLeaf yet.</p>
        ) : (
          <BooksTable books={books} />
        )}
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="flex flex-col gap-6 p-8">
      {/* cookies() is request-time data, so it must sit inside Suspense with cacheComponents on. */}
      <Suspense fallback={<p>Loading…</p>}>
        <AuthorDashboard />
      </Suspense>
    </main>
  );
}
