"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { TicketDraft, TicketMessage, TicketSummary } from "@/lib/types";
import { categoryLabel, formatDateTime, ticketStatusLabel } from "@/lib/format";
import { useTicketEvents } from "@/lib/ticket-events";

type DraftState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; aiRunId: string }
  | { kind: "unavailable"; message: string };

type Props = { ticket: TicketSummary; onClose: () => void };

export function TicketDialog({ ticket, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [messages, setMessages] = useState<TicketMessage[] | null>(null);
  const [draftState, setDraftState] = useState<DraftState>({ kind: "idle" });
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function loadDraft(regenerate: boolean) {
    setDraftState({ kind: "loading" });
    try {
      const draft = await apiRequest<TicketDraft>(
        `/tickets/${ticket.id}/draft`,
        {
          method: "POST",
          body: { regenerate },
        },
      );
      setReply(draft.draft);
      setDraftState({ kind: "ready", aiRunId: draft.aiRunId });
    } catch (err) {
      // Graceful degradation: keep whatever the admin typed and let them write it by hand.
      setDraftState({
        kind: "unavailable",
        message: err instanceof Error ? err.message : "AI draft unavailable",
      });
    }
  }

  useEffect(() => {
    dialogRef.current?.showModal();

    apiRequest<TicketMessage[]>(`/tickets/${ticket.id}/messages`)
      .then((loaded) => {
        setMessages(loaded);
        console.log(loaded);
        const answered = loaded.some(
          (message) => message.senderRole === "admin" && !message.isInternal,
        );
        if (!answered) loadDraft(false);
      })
      .catch(() => setMessages([]));
  }, []);

  function addMessage(message: TicketMessage) {
    setMessages((current) =>
      current?.some((m) => m.id === message.id)
        ? current
        : [...(current ?? []), message],
    );
  }

  useTicketEvents((event) => {
    if (event.type === "message" && event.ticketId === ticket.id) {
      addMessage(event.message);
    }
  });

  async function send(isInternal: boolean) {
    setSending(true);
    setSendError(null);
    try {
      const message = await apiRequest<TicketMessage>(
        `/tickets/${ticket.id}/messages`,
        {
          method: "POST",
          body: {
            body: reply,
            isInternal,
            aiRunId:
              !isInternal && draftState.kind === "ready"
                ? draftState.aiRunId
                : null,
          },
        },
      );
      addMessage(message);
      setReply("");
      setDraftState({ kind: "idle" });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  const loading = draftState.kind === "loading";
  const busy = loading || sending;

  return (
    <dialog ref={dialogRef} onClose={onClose} className="p-6">
      <div className="flex flex-col gap-4">
        <header className="flex gap-4">
          <h2>{ticket.subject}</h2>
          <form method="dialog" className="ml-auto">
            <button>Close</button>
          </form>
        </header>

        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
          <dt>Author</dt>
          <dd>{ticket.authorName}</dd>
          <dt>Book</dt>
          <dd>{ticket.bookTitle ?? "General / Account"}</dd>
          <dt>Category</dt>
          <dd>{categoryLabel(ticket.category)}</dd>
          <dt>Priority</dt>
          <dd>{ticket.priority ?? "Not scored"}</dd>
          <dt>Status</dt>
          <dd>{ticketStatusLabel(ticket.status)}</dd>
        </dl>

        <section className="flex flex-col gap-3">
          <h3>Conversation</h3>
          <article className="flex flex-col gap-1">
            <small>
              {ticket.authorName} · {formatDateTime(ticket.createdAt)}
            </small>
            <p>{ticket.description}</p>
          </article>
          {messages === null && <p>Loading conversation…</p>}
          {messages?.map((message) => (
            <article key={message.id} className="flex flex-col gap-1">
              <small>
                {message.isInternal && <strong>Internal note · </strong>}
                {message.senderName ?? "Deleted user"} ·{" "}
                {formatDateTime(message.createdAt)}
              </small>
              <p className="whitespace-pre-wrap">{message.body}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h3>Reply</h3>
          {loading && <p>Drafting a reply with AI…</p>}
          {draftState.kind === "ready" && (
            <p>
              <small>AI draft. Review and edit before sending.</small>
            </p>
          )}
          {draftState.kind === "unavailable" && (
            <p role="alert">{draftState.message}</p>
          )}
          {sendError && <p role="alert">{sendError}</p>}
          <textarea
            rows={12}
            cols={70}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={loading}
            placeholder="Write your reply to the author, or an internal note…"
          />
          <div className="flex gap-4">
            <button
              className="px-4 py-2"
              onClick={() => send(false)}
              disabled={busy || !reply.trim()}
            >
              Send reply
            </button>
            <button onClick={() => send(true)} disabled={busy || !reply.trim()}>
              Save as internal note
            </button>
            <button onClick={() => loadDraft(true)} disabled={busy}>
              {draftState.kind === "idle"
                ? "Draft with AI"
                : "Regenerate draft"}
            </button>
          </div>
        </section>
      </div>
    </dialog>
  );
}
