import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getJSON } from "@/server/api";
import type { TicketSummary } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { TicketsTable } from "./tickets-table";

async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/login");

  const tickets = await getJSON<TicketSummary[]>("/tickets");

  return (
    <>
      <header className="flex gap-4">
        <h1>Support queue</h1>
        <p>Logged in as {user.email}</p>
        <LogoutButton redirectTo="/admin/login" />
      </header>

      <section className="flex flex-col gap-2">
        <h2>Tickets ({tickets.length})</h2>
        {tickets.length === 0 ? (
          <p>No tickets yet. New author queries will show up here.</p>
        ) : (
          <TicketsTable tickets={tickets} />
        )}
      </section>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <main className="flex flex-col gap-6 p-8">
      <Suspense fallback={<p>Loading…</p>}>
        <AdminDashboard />
      </Suspense>
    </main>
  );
}
