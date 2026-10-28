"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TicketSummary } from "@/lib/types";
import {
  categoryLabel,
  formatDateTime,
  ticketStatusLabel,
} from "@/lib/format";
import { useTicketEvents } from "@/lib/ticket-events";
import { TicketDialog } from "./ticket-dialog";

const COLUMNS = [
  "Priority",
  "Subject",
  "Author",
  "Book",
  "Category",
  "Status",
  "Created",
  "",
];

// Rows arrive already sorted by the API: unresolved, then most urgent, then oldest.
export function TicketsTable({ tickets }: { tickets: TicketSummary[] }) {
  const router = useRouter();
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  // Any change (new reply, classification finished) re-fetches the queue
  // from the server, so sorting and labels stay correct.
  useTicketEvents(() => router.refresh());

  // One dialog outside the table: rows can re-sort under it without closing it.
  const openTicket = tickets.find((ticket) => ticket.id === openTicketId);

  return (
    <>
      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="p-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="p-2">{ticket.priority ?? "Not scored"}</td>
              <td className="p-2">{ticket.subject}</td>
              <td className="p-2">{ticket.authorName}</td>
              <td className="p-2">{ticket.bookTitle ?? "General / Account"}</td>
              <td className="p-2">{categoryLabel(ticket.category)}</td>
              <td className="p-2">{ticketStatusLabel(ticket.status)}</td>
              <td className="p-2">{formatDateTime(ticket.createdAt)}</td>
              <td className="p-2">
                <button onClick={() => setOpenTicketId(ticket.id)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openTicket && (
        <TicketDialog
          key={openTicket.id}
          ticket={openTicket}
          onClose={() => setOpenTicketId(null)}
        />
      )}
    </>
  );
}
