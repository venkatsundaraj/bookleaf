"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { TicketMessage, TicketSummary } from "@/lib/types";
import { formatDateTime, ticketStatusLabel } from "@/lib/format";
import { useTicketEvents } from "@/lib/ticket-events";

export function MyTickets({ tickets }: { tickets: TicketSummary[] }) {
  const router = useRouter();

  // A reply moves the ticket to "In Progress"; refresh so the status updates.
  // The server never sends internal notes or other authors' events here.
  useTicketEvents(() => router.refresh());

  return (
    <ul className="flex flex-col gap-4">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <TicketThread ticket={ticket} />
        </li>
      ))}
    </ul>
  );
}

function TicketThread({ ticket }: { ticket: TicketSummary }) {
  const [messages, setMessages] = useState<TicketMessage[] | null>(null);

  // Loaded the first time the ticket is expanded.
  function onToggle(event: React.ToggleEvent<HTMLDetailsElement>) {
    if (event.newState !== "open" || messages !== null) return;
    apiRequest<TicketMessage[]>(`/tickets/${ticket.id}/messages`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }

  // New replies appear without a page refresh.
  useTicketEvents((event) => {
    if (event.type !== "message" || event.ticketId !== ticket.id) return;
    setMessages((current) =>
      current === null || current.some((m) => m.id === event.message.id)
        ? current
        : [...current, event.message],
    );
  });

  return (
    <details onToggle={onToggle}>
      <summary>
        {ticket.subject} · {ticketStatusLabel(ticket.status)} ·{" "}
        {ticket.bookTitle ?? "General / Account"}
      </summary>

      <div className="flex flex-col gap-3 p-4">
        <article className="flex flex-col gap-1">
          <small>You · {formatDateTime(ticket.createdAt)}</small>
          <p>{ticket.description}</p>
        </article>

        {messages === null && <p>Loading replies…</p>}
        {messages?.length === 0 && (
          <p>No reply yet. Our team will get back to you here.</p>
        )}
        {messages?.map((message) => (
          <article key={message.id} className="flex flex-col gap-1">
            <small>
              {message.senderRole === "admin"
                ? "BookLeaf Support"
                : "You"}{" "}
              · {formatDateTime(message.createdAt)}
            </small>
            <p className="whitespace-pre-wrap">{message.body}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
