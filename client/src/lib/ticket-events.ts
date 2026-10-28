"use client";

import { useEffect, useRef } from "react";
import type { TicketEvent } from "@/lib/types";

type Listener = (event: TicketEvent) => void;

// One EventSource per tab, shared by every component that listens.
// The browser reconnects on its own if the connection drops.
let source: EventSource | null = null;
const listeners = new Set<Listener>();

function subscribe(listener: Listener) {
  listeners.add(listener);

  if (!source) {
    source = new EventSource("/api/tickets/events");
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as TicketEvent;
      listeners.forEach((notify) => notify(event));
    };
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      source?.close();
      source = null;
    }
  };
}

export function useTicketEvents(listener: Listener) {
  // Keep the latest callback without reconnecting on every render.
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });

  useEffect(() => subscribe((event) => listenerRef.current(event)), []);
}
