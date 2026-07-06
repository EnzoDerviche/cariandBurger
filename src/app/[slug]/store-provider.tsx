"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  calcCartCount,
  calcCartTotal,
  calcLineTotal,
  cartItemKey,
  type CartItem,
  type CartModifier,
  type MenuProduct,
} from "@/lib/store/types";

type StoreContextValue = {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (
    product: MenuProduct,
    quantity: number,
    modifiers: CartModifier[],
  ) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function storageKey(slug: string) {
  return `cart-${slug}`;
}

export function StoreProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ponytail: corrupt cart → empty
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey(slug), JSON.stringify(items));
  }, [items, slug, ready]);

  const addItem = useCallback(
    (product: MenuProduct, quantity: number, modifiers: CartModifier[]) => {
      const key = cartItemKey(
        product.id,
        modifiers.map((m) => ({ optionId: m.optionId, quantity: m.quantity })),
      );
      const unitPrice = Number(product.price);
      const lineTotal = calcLineTotal(unitPrice, quantity, modifiers);

      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  lineTotal: calcLineTotal(i.unitPrice, i.quantity + quantity, i.modifiers),
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            productName: product.name,
            categoryName: product.categories?.name ?? "General",
            unitPrice,
            quantity,
            modifiers,
            lineTotal,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              quantity,
              lineTotal: calcLineTotal(i.unitPrice, quantity, i.modifiers),
            }
          : i,
      ),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      total: calcCartTotal(items),
      count: calcCartCount(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, updateQuantity, removeItem, clearCart],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
