"use server";

import {
  getClosedMessage,
  isStoreOpen,
  parseBusinessHours,
} from "@/lib/business-hours";
import { createClient } from "@/lib/supabase/server";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  paymentLabel,
} from "@/lib/order-format";
import type { CartItem } from "@/lib/store/types";

export type PlaceOrderInput = {
  slug: string;
  customerName: string;
  customerPhone?: string;
  deliveryMethod: "delivery" | "pickup";
  deliveryAddress?: string;
  deliveryNotes?: string;
  scheduledTime: string;
  paymentMethod: string;
  items: CartItem[];
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; whatsappUrl: string }
  | { ok: false; error: string };

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  if (!input.customerName.trim()) {
    return { ok: false, error: "Ingresá tu nombre." };
  }
  if (input.items.length === 0) {
    return { ok: false, error: "El carrito está vacío." };
  }
  if (input.deliveryMethod === "delivery" && !input.deliveryAddress?.trim()) {
    return { ok: false, error: "Ingresá la dirección de entrega." };
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*, organization_settings(*)")
    .eq("slug", input.slug)
    .eq("is_active", true)
    .single();

  if (!org) return { ok: false, error: "Local no encontrado." };

  const settingsRaw = org.organization_settings as
    | {
        min_order_amount: number;
        delivery_enabled: boolean;
        pickup_enabled: boolean;
        payment_methods: string[];
      }
    | {
        min_order_amount: number;
        delivery_enabled: boolean;
        pickup_enabled: boolean;
        payment_methods: string[];
      }[]
    | null;

  const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw;
  if (!settings) return { ok: false, error: "Configuración del local no encontrada." };

  const hours = parseBusinessHours(
    (settings as { business_hours?: unknown }).business_hours,
  );
  if (!isStoreOpen(hours)) {
    return { ok: false, error: getClosedMessage(hours) };
  }

  if (input.deliveryMethod === "delivery" && !settings.delivery_enabled) {
    return { ok: false, error: "Delivery no disponible." };
  }
  if (input.deliveryMethod === "pickup" && !settings.pickup_enabled) {
    return { ok: false, error: "Retiro no disponible." };
  }
  if (!settings.payment_methods.includes(input.paymentMethod)) {
    return { ok: false, error: "Método de pago no válido." };
  }

  const subtotal = input.items.reduce((s, i) => s + i.lineTotal, 0);
  if (subtotal < Number(settings.min_order_amount ?? 0)) {
    return {
      ok: false,
      error: `Pedido mínimo: $${Number(settings.min_order_amount).toLocaleString("es-AR")}`,
    };
  }

  const { data: orderNumber, error: numError } = await supabase.rpc(
    "next_order_number",
    { org_id: org.id },
  );

  if (numError || !orderNumber) {
    return { ok: false, error: "No se pudo generar el número de pedido." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: org.id,
      order_number: orderNumber,
      status: "sent_whatsapp",
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone?.trim() || null,
      delivery_method: input.deliveryMethod,
      delivery_address:
        input.deliveryMethod === "delivery"
          ? input.deliveryAddress?.trim()
          : null,
      delivery_notes: input.deliveryNotes?.trim() || null,
      scheduled_time: input.scheduledTime,
      payment_method: input.paymentMethod,
      subtotal,
      total: subtotal,
      whatsapp_sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Error al guardar pedido." };
  }

  for (const item of input.items) {
    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        category_name: item.categoryName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      })
      .select("id")
      .single();

    if (itemError || !orderItem) {
      return { ok: false, error: "Error al guardar ítems del pedido." };
    }

    if (item.modifiers.length > 0) {
      const { error: modError } = await supabase.from("order_item_modifiers").insert(
        item.modifiers.map((m) => ({
          order_item_id: orderItem.id,
          group_name: m.groupName,
          modifier_name: m.optionName,
          quantity: m.quantity,
          unit_price: m.unitPrice,
        })),
      );
      if (modError) return { ok: false, error: "Error al guardar modificadores." };
    }
  }

  const message = buildWhatsAppMessage({
    orgName: org.name,
    orderNumber,
    deliveryMethod: input.deliveryMethod,
    customerName: input.customerName.trim(),
    deliveryAddress: input.deliveryAddress?.trim(),
    scheduledTime: input.scheduledTime,
    paymentMethod: input.paymentMethod,
    items: input.items.map((i) => ({
      productName: i.productName,
      categoryName: i.categoryName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      modifiers: i.modifiers.map((m) => ({
        groupName: m.groupName,
        optionName: m.optionName,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
      })),
    })),
    subtotal,
    total: subtotal,
  });

  return {
    ok: true,
    orderNumber,
    whatsappUrl: buildWhatsAppUrl(org.whatsapp_number, message),
  };
}

export { paymentLabel };
