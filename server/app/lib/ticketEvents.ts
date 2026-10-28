import { EventEmitter } from "node:events";

export type TicketMessageEvent = {
  id: string;
  ticketId: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  senderName: string | null;
  senderRole: "admin" | "author" | null;
};

export type TicketEvent =
  | { type: "message"; ticketId: string; message: TicketMessageEvent }
  | { type: "ticket"; ticketId: string };

type Envelope = { ownerId: string; internal: boolean; event: TicketEvent };

const bus = new EventEmitter();
bus.setMaxListeners(0);

export function publishTicketEvent(envelope: Envelope) {
  bus.emit("ticket-event", envelope);
}

export function onTicketEvent(listener: (envelope: Envelope) => void) {
  bus.on("ticket-event", listener);
  return () => {
    bus.off("ticket-event", listener);
  };
}
