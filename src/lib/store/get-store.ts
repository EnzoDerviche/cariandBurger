import { createClient } from "@/lib/supabase/server";
import type { Category, Organization, OrganizationSettings } from "@/types/database";
import type { MenuProduct, StoreData } from "@/lib/store/types";

export function defaultOrganizationSettings(
  organizationId: string,
): OrganizationSettings {
  return {
    organization_id: organizationId,
    delivery_enabled: true,
    pickup_enabled: true,
    min_order_amount: 0,
    payment_methods: ["efectivo", "mercado_pago", "transferencia"],
    business_hours: { enabled: false, closed_message: null, days: {} },
    welcome_message: null,
    updated_at: new Date().toISOString(),
  };
}

export async function getStoreData(slug: string): Promise<StoreData | null> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!org) return null;

  const organization = org as Organization;

  const [{ data: settings }, { data: categories }, { data: products }] =
    await Promise.all([
      supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", organization.id)
        .single(),
      supabase
        .from("categories")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("products")
        .select(
          `*,
          categories(name, slug),
          product_modifier_groups(
            sort_order,
            modifier_groups(
              *,
              modifier_options(*)
            )
          )`,
        )
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("sort_order"),
    ]);

  const menuProducts = ((products ?? []) as MenuProduct[]).map((p) => ({
    ...p,
    product_modifier_groups: [...(p.product_modifier_groups ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pmg) => ({
        ...pmg,
        modifier_groups: {
          ...pmg.modifier_groups,
          modifier_options: [...(pmg.modifier_groups?.modifier_options ?? [])]
            .filter((o) => o.is_active)
            .sort((a, b) => a.sort_order - b.sort_order),
        },
      })),
  }));

  return {
    organization,
    settings: (settings as OrganizationSettings | null) ?? defaultOrganizationSettings(organization.id),
    categories: (categories ?? []) as Category[],
    products: menuProducts,
  };
}
