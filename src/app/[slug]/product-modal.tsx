"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/order-format";
import {
  calcLineTotal,
  isPromoProduct,
  type CartModifier,
  type MenuModifierGroup,
  type MenuProduct,
} from "@/lib/store/types";
import { useStore } from "@/app/[slug]/store-provider";

type SelectedMod = { optionId: string; quantity: number };

export function ProductModal({
  product,
  brandColor,
  onClose,
}: {
  product: MenuProduct;
  brandColor: string;
  onClose: () => void;
}) {
  const { addItem } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, SelectedMod[]>>({});
  const [error, setError] = useState("");

  const groups = product.product_modifier_groups.map((pmg) => pmg.modifier_groups);

  function toggleOption(group: MenuModifierGroup, optionId: string, price: number) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      const exists = current.find((s) => s.optionId === optionId);

      if (group.max_selections === 1) {
        if (exists && !group.is_required && group.min_selections === 0) {
          return { ...prev, [group.id]: [] };
        }
        if (exists) return prev;
        return { ...prev, [group.id]: [{ optionId, quantity: 1 }] };
      }

      if (exists) {
        const next = current.filter((s) => s.optionId !== optionId);
        return { ...prev, [group.id]: next };
      }

      if (current.length >= group.max_selections) return prev;
      return { ...prev, [group.id]: [...current, { optionId, quantity: 1 }] };
    });
    setError("");
  }

  function validate(): CartModifier[] | null {
    const modifiers: CartModifier[] = [];

    for (const group of groups) {
      const picks = selected[group.id] ?? [];
      if (group.is_required && picks.length < group.min_selections) {
        setError(`Elegí una opción en "${group.name}"`);
        return null;
      }
      if (picks.length < group.min_selections) {
        setError(`"${group.name}" requiere al menos ${group.min_selections} opción(es)`);
        return null;
      }

      for (const pick of picks) {
        const opt = group.modifier_options.find((o) => o.id === pick.optionId);
        if (!opt) continue;
        modifiers.push({
          groupId: group.id,
          groupName: group.name,
          optionId: opt.id,
          optionName: opt.name,
          unitPrice: Number(opt.price),
          quantity: pick.quantity,
        });
      }
    }

    return modifiers;
  }

  function handleAdd() {
    const modifiers = validate();
    if (!modifiers) return;
    addItem(product, quantity, modifiers);
    onClose();
  }

  const previewMods = groups.flatMap((g) =>
    (selected[g.id] ?? []).flatMap((pick) => {
      const opt = g.modifier_options.find((o) => o.id === pick.optionId);
      return opt
        ? [{ groupName: g.name, optionName: opt.name, unitPrice: Number(opt.price), quantity: 1 }]
        : [];
    }),
  );
  const linePreview = calcLineTotal(
    Number(product.price),
    quantity,
    previewMods.map((m) => ({
      groupId: "",
      groupName: m.groupName,
      optionId: "",
      optionName: m.optionName,
      unitPrice: m.unitPrice,
      quantity: m.quantity,
    })),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="relative aspect-video shrink-0 bg-zinc-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🍔</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-lg text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-zinc-900">{product.name}</h2>
            {isPromoProduct(product) && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                PROMO
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">{product.description}</p>
          )}
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {formatPrice(Number(product.price))}
          </p>

          {groups.map((group) => (
            <div key={group.id} className="mt-5">
              <p className="font-semibold text-zinc-900">
                {group.name}
                {group.is_required && <span className="text-red-600"> *</span>}
              </p>
              <div className="mt-2 space-y-2">
                {group.modifier_options.map((opt) => {
                  const picked = (selected[group.id] ?? []).some((s) => s.optionId === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(group, opt.id, Number(opt.price))}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                        picked
                          ? "border-transparent text-white"
                          : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300"
                      }`}
                      style={picked ? { backgroundColor: brandColor } : undefined}
                    >
                      <span className="font-medium">{opt.name}</span>
                      {Number(opt.price) > 0 && (
                        <span className={picked ? "text-white/90" : "text-zinc-700"}>
                          +{formatPrice(Number(opt.price))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="border-t border-zinc-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-lg font-bold"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center text-lg font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 text-lg font-bold"
              >
                +
              </button>
            </div>
            <p className="text-lg font-bold text-zinc-900">{formatPrice(linePreview)}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            Agregar al pedido · {formatPrice(linePreview)}
          </button>
        </div>
      </div>
    </div>
  );
}
