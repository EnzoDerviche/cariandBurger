"use client";

import { buildPrintTicket } from "@/lib/order-format";
import type { WhatsAppOrderData } from "@/lib/order-format";

export function PrintTicket({
  data,
  createdAt,
}: {
  data: WhatsAppOrderData | null;
  createdAt?: string;
}) {
  if (!data) return null;

  const text = buildPrintTicket(data, createdAt ? new Date(createdAt) : undefined);

  return (
    <div id="ticket-print-area" className="sr-only">
      <pre className="ticket-print-pre">{text}</pre>
    </div>
  );
}
