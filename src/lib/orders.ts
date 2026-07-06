import type { WhatsAppOrderData } from "@/lib/order-format";
import type { OrderWithItems } from "@/types/database";

export function orderToTicketData(
  order: OrderWithItems,
  orgName: string,
): WhatsAppOrderData {
  return {
    orgName,
    orderNumber: order.order_number,
    deliveryMethod: order.delivery_method,
    customerName: order.customer_name,
    deliveryAddress: order.delivery_address ?? undefined,
    scheduledTime: order.scheduled_time,
    paymentMethod: order.payment_method,
    items: order.order_items.map((item) => ({
      productName: item.product_name,
      categoryName: item.category_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      modifiers: (item.order_item_modifiers ?? []).map((m) => ({
        groupName: m.group_name,
        optionName: m.modifier_name,
        quantity: m.quantity,
        unitPrice: Number(m.unit_price),
      })),
    })),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
  };
}

export const ORDER_SELECT = `
  *,
  order_items (
    *,
    order_item_modifiers (*)
  )
`;
