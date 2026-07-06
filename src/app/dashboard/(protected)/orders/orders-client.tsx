"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PrintTicket } from "@/app/dashboard/(protected)/orders/print-ticket";
import { formatPrice, paymentLabel } from "@/lib/order-format";
import { ORDER_SELECT, orderToTicketData } from "@/lib/orders";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/types/database";

const AUTO_PRINT_KEY = "dashboard-auto-print";
const PRINTED_KEY = "dashboard-printed-orders";

type Props = {
  orgId: string;
  orgName: string;
  initialOrders: OrderWithItems[];
};

const STATUS_LABEL: Record<string, string> = {
  sent_whatsapp: "Enviado",
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function OrdersClient({ orgId, orgName, initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [autoPrint, setAutoPrint] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(AUTO_PRINT_KEY) !== "false";
  });
  const [printData, setPrintData] = useState<{
    data: ReturnType<typeof orderToTicketData>;
    createdAt: string;
  } | null>(null);
  const printedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const printed = JSON.parse(sessionStorage.getItem(PRINTED_KEY) ?? "[]") as string[];
      printedRef.current = new Set(printed);
    } catch {
      printedRef.current = new Set();
    }
  }, []);

  const fetchOrder = useCallback(
    async (orderId: string): Promise<OrderWithItems | null> => {
      const supabase = createClient();
      for (let i = 0; i < 6; i++) {
        const { data } = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("id", orderId)
          .eq("organization_id", orgId)
          .single();

        const order = data as OrderWithItems | null;
        if (order?.order_items?.length) return order;
        await sleep(400);
      }

      const { data } = await supabase
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", orderId)
        .eq("organization_id", orgId)
        .single();

      return (data as OrderWithItems | null) ?? null;
    },
    [orgId],
  );

  const triggerPrint = useCallback(
    (order: OrderWithItems) => {
      const ticket = orderToTicketData(order, orgName);
      setPrintData({ data: ticket, createdAt: order.created_at });
      requestAnimationFrame(() => {
        window.print();
      });
    },
    [orgName],
  );

  const markPrinted = useCallback((orderId: string) => {
    printedRef.current.add(orderId);
    sessionStorage.setItem(PRINTED_KEY, JSON.stringify([...printedRef.current]));
  }, []);

  const handleNewOrder = useCallback(
    async (orderId: string) => {
      if (printedRef.current.has(orderId)) return;

      const order = await fetchOrder(orderId);
      if (!order) return;

      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      if (autoPrint) {
        triggerPrint(order);
        markPrinted(order.id);
      }
    },
    [autoPrint, fetchOrder, markPrinted, triggerPrint],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`orders-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const id = payload.new.id as string;
          void handleNewOrder(id);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, handleNewOrder]);

  function toggleAutoPrint() {
    const next = !autoPrint;
    setAutoPrint(next);
    localStorage.setItem(AUTO_PRINT_KEY, String(next));
  }

  async function printOrder(orderId: string) {
    let order = orders.find((o) => o.id === orderId);
    if (!order) {
      const fetched = await fetchOrder(orderId);
      if (!fetched) return;
      order = fetched;
    }
    triggerPrint(order);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-800">
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={toggleAutoPrint}
            className="size-4 rounded border-zinc-300"
          />
          Imprimir automáticamente pedidos nuevos
        </label>
        <span className="text-xs text-zinc-500">
          Dejá esta pantalla abierta en la PC del mostrador con la ticketera conectada.
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-700">
          Todavía no hay pedidos. Cuando un cliente confirme en la tienda, aparecerán acá.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-zinc-900">
                    {order.order_number}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {formatWhen(order.created_at)} · {order.customer_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => printOrder(order.id)}
                    className="dash-btn-brand text-sm"
                  >
                    Imprimir
                  </button>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-zinc-800">
                {order.order_items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product_name}{" "}
                    <span className="text-zinc-500">
                      ({formatPrice(Number(item.line_total))})
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-sm text-zinc-600">
                {order.delivery_method === "delivery" ? "Delivery" : "Retiro"} ·{" "}
                {paymentLabel(order.payment_method)} ·{" "}
                <strong className="text-zinc-900">
                  {formatPrice(Number(order.total))}
                </strong>
              </p>
            </article>
          ))}
        </div>
      )}

      <PrintTicket data={printData?.data ?? null} createdAt={printData?.createdAt} />
    </>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
