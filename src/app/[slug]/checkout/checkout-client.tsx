"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, paymentLabel } from "@/lib/order-format";
import type { OrganizationSettings } from "@/types/database";
import { placeOrderAction } from "@/app/[slug]/actions";
import { useStore } from "@/app/[slug]/store-provider";

export function CheckoutClient({
  slug,
  orgName,
  brandColor,
  settings,
}: {
  slug: string;
  orgName: string;
  brandColor: string;
  settings: OrganizationSettings;
}) {
  const { items, total, updateQuantity, removeItem, clearCart } = useStore();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const paymentMethods = settings.payment_methods ?? ["efectivo", "mercado_pago"];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const result = await placeOrderAction({
      slug,
      customerName: String(fd.get("customer_name") ?? ""),
      customerPhone: String(fd.get("customer_phone") ?? "") || undefined,
      deliveryMethod: String(fd.get("delivery_method")) as "delivery" | "pickup",
      deliveryAddress: String(fd.get("delivery_address") ?? "") || undefined,
      deliveryNotes: String(fd.get("delivery_notes") ?? "") || undefined,
      scheduledTime: String(fd.get("scheduled_time") ?? "Lo antes posible"),
      paymentMethod: String(fd.get("payment_method") ?? ""),
      items,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clearCart();
    window.location.href = result.whatsappUrl;
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-700">Tu carrito está vacío.</p>
        <Link
          href={`/${slug}`}
          className="mt-4 inline-block font-semibold"
          style={{ color: brandColor }}
        >
          Volver al menú
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 pb-8"
      style={{ accentColor: brandColor, "--brand": brandColor } as React.CSSProperties}
    >
      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-bold text-zinc-900">Tu pedido</h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.key} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">{item.productName}</p>
                  <p className="text-sm text-zinc-700">{item.categoryName}</p>
                  {item.modifiers.map((m) => (
                    <p key={m.optionId} className="text-sm text-zinc-600">
                      + {m.optionName}
                      {m.unitPrice > 0 && ` (${formatPrice(m.unitPrice)})`}
                    </p>
                  ))}
                </div>
                <p className="shrink-0 font-bold text-zinc-900">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.key, item.quantity - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 font-bold"
                >
                  −
                </button>
                <span className="font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.key, item.quantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 font-bold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="ml-auto text-sm font-semibold"
                  style={{ color: brandColor }}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-lg font-bold text-zinc-900">
          Total: {formatPrice(total)}
        </p>
        {Number(settings.min_order_amount) > 0 && (
          <p className="mt-1 text-right text-sm text-zinc-700">
            Pedido mínimo: {formatPrice(Number(settings.min_order_amount))}
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="font-bold text-zinc-900">Entrega</h2>

        <div className="flex flex-wrap gap-3">
          {settings.delivery_enabled && (
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
              <input type="radio" name="delivery_method" value="delivery" defaultChecked />
              Delivery
            </label>
          )}
          {settings.pickup_enabled && (
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
              <input
                type="radio"
                name="delivery_method"
                value="pickup"
                defaultChecked={!settings.delivery_enabled}
              />
              Retiro en local
            </label>
          )}
        </div>

        <Field label="Tu nombre *" name="customer_name" required />
        <Field label="Teléfono (opcional)" name="customer_phone" type="tel" />
        <Field label="Dirección" name="delivery_address" placeholder="Calle, número, entre calles" />
        <Field label="Notas de entrega" name="delivery_notes" placeholder="Timbre, piso, etc." />
        <Field
          label="Horario"
          name="scheduled_time"
          defaultValue="Lo antes posible"
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="font-bold text-zinc-900">Forma de pago</h2>
        {paymentMethods.map((method) => (
          <label
            key={method}
            className="flex items-center gap-2 text-sm font-medium text-zinc-800"
          >
            <input
              type="radio"
              name="payment_method"
              value={method}
              defaultChecked={method === paymentMethods[0]}
              required
            />
            {paymentLabel(method)}
          </label>
        ))}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-4 text-sm font-bold text-white disabled:opacity-60"
        style={{ backgroundColor: brandColor }}
      >
        {pending ? "Procesando..." : `Enviar pedido por WhatsApp · ${formatPrice(total)}`}
      </button>

      <p className="text-center text-xs text-zinc-600">
        Se abrirá WhatsApp de {orgName} con el detalle del pedido.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-zinc-100"
      />
    </div>
  );
}
