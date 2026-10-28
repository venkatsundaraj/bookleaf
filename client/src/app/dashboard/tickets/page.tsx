import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getJSON } from "@/server/api";
import type { TicketSummary } from "@/lib/types";
import { MyTickets } from "./my-tickets";

async function AuthorTickets() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/dashboard");

  const tickets = await getJSON<TicketSummary[]>("/tickets");

  return tickets.length === 0 ? (
    <p>You haven&apos;t raised any queries yet.</p>
  ) : (
    <MyTickets tickets={tickets} />
  );
}

export default function MyTicketsPage() {
  return (
    <main className="flex flex-col gap-4 p-8">
      <h1>My Tickets</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <AuthorTickets />
      </Suspense>
    </main>
  );
}
