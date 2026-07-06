export function formatPrice(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPricePlain(amount: number) {
  return `$ ${Math.round(amount).toLocaleString("es-AR")}`;
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  mercado_pago: "Mercado Pago",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export function paymentLabel(method: string) {
  return PAYMENT_LABELS[method] ?? method;
}

export type WhatsAppOrderItem = {
  productName: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  modifiers: {
    groupName: string;
    optionName: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type WhatsAppOrderData = {
  orgName: string;
  orderNumber: string;
  deliveryMethod: "delivery" | "pickup";
  customerName: string;
  deliveryAddress?: string;
  scheduledTime: string;
  paymentMethod: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  total: number;
};

export function buildWhatsAppMessage(data: WhatsAppOrderData) {
  const now = new Date();
  const time = formatOrderTime(now);
  const date = now.toLocaleDateString("es-AR");

  const lines: string[] = [
    `Hola ${data.orgName}! Quiero hacer un pedido, este es el detalle:`,
    "",
    `Orden Nº ${data.orderNumber}`,
    `${time}   ${date}`,
    "",
    ...buildOrderBodyLines(data, "check"),
    ...buildOrderFooterLines(data, "check"),
  ];

  return lines.join("\n");
}

/** Mismo detalle que WhatsApp, sin emojis — para ticketera 80mm */
export function buildPrintTicket(data: WhatsAppOrderData, createdAt?: Date) {
  const when = createdAt ?? new Date();
  const time = formatOrderTime(when);
  const date = when.toLocaleDateString("es-AR");

  const lines: string[] = [
    data.orgName.toUpperCase(),
    `Orden Nº ${data.orderNumber}`,
    `${time}   ${date}`,
    "--------------------------------",
    "",
    ...buildOrderBodyLines(data, "plain"),
    ...buildOrderFooterLines(data, "plain"),
  ];

  return lines.join("\n");
}

function formatOrderTime(date: Date) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildOrderBodyLines(data: WhatsAppOrderData, style: "check" | "plain") {
  const lines: string[] = [];
  const prefix = style === "check" ? "✅ " : "- ";

  for (const item of data.items) {
    lines.push(
      `${prefix}${item.quantity} x ${item.productName} [${item.categoryName}] | ${formatPricePlain(item.unitPrice)}`,
    );
    const byGroup = new Map<string, typeof item.modifiers>();
    for (const mod of item.modifiers) {
      const list = byGroup.get(mod.groupName) ?? [];
      list.push(mod);
      byGroup.set(mod.groupName, list);
    }
    for (const [groupName, mods] of byGroup) {
      lines.push(`  ${groupName}`);
      for (const mod of mods) {
        const bullet = style === "check" ? "•" : "-";
        lines.push(`  ${bullet} ${mod.quantity} x ${mod.optionName} | ${formatPricePlain(mod.unitPrice)}`);
      }
    }
    lines.push("");
  }

  return lines;
}

function buildOrderFooterLines(data: WhatsAppOrderData, style: "check" | "plain") {
  const b = style === "check" ? "•" : "-";

  const lines: string[] = [
    "Forma de Entrega",
    `  ${b} ${style === "check" ? "Método de Entrega: " : "Metodo: "}${data.deliveryMethod === "delivery" ? "Delivery" : "Retiro en local"}`,
    `  ${b} Recibe: ${data.customerName}`,
  ];

  if (data.deliveryMethod === "delivery" && data.deliveryAddress) {
    lines.push(
      `  ${b} ${style === "check" ? "Dirección: " : "Direccion: "}${data.deliveryAddress}`,
    );
  }
  lines.push(
    `  ${b} ${style === "check" ? "Hora de Envío: " : "Hora: "}${data.scheduledTime}`,
    "",
  );
  lines.push(
    "Forma de Pago",
    `  ${b} ${style === "check" ? "Método de Pago: " : ""}${paymentLabel(data.paymentMethod)}`,
    "",
  );
  lines.push(
    "Totales",
    style === "check"
      ? `* Subtotal del Pedido: ${formatPricePlain(data.subtotal)}`
      : `  Subtotal: ${formatPricePlain(data.subtotal)}`,
    style === "check"
      ? `* Total del Pedido: ${formatPricePlain(data.total)}`
      : `  TOTAL: ${formatPricePlain(data.total)}`,
  );

  return lines;
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
