import type {
  Category,
  ModifierGroup,
  ModifierOption,
  Organization,
  OrganizationSettings,
  Product,
} from "@/types/database";

export type MenuModifierGroup = ModifierGroup & {
  modifier_options: ModifierOption[];
};

export type MenuProduct = Product & {
  categories: { name: string; slug: string } | null;
  product_modifier_groups: {
    sort_order: number;
    modifier_groups: MenuModifierGroup;
  }[];
};

export type StoreData = {
  organization: Organization;
  settings: OrganizationSettings;
  categories: Category[];
  products: MenuProduct[];
};

export type CartModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  unitPrice: number;
  quantity: number;
};

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  categoryName: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartModifier[];
  lineTotal: number;
};

export function cartItemKey(
  productId: string,
  modifiers: { optionId: string; quantity: number }[],
) {
  const modKey = modifiers
    .map((m) => `${m.optionId}:${m.quantity}`)
    .sort()
    .join("|");
  return `${productId}#${modKey}`;
}

export function calcLineTotal(
  unitPrice: number,
  quantity: number,
  modifiers: CartModifier[],
) {
  const modsTotal = modifiers.reduce((s, m) => s + m.unitPrice * m.quantity, 0);
  return (unitPrice + modsTotal) * quantity;
}

export function calcCartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.lineTotal, 0);
}

export function calcCartCount(items: CartItem[]) {
  return items.reduce((s, i) => s + i.quantity, 0);
}

export function isPromoProduct(product: MenuProduct) {
  if (product.is_promo) return true;
  const cat = product.categories;
  return cat?.slug === "promos" || cat?.name.toUpperCase() === "PROMOS";
}
