import { saveProductAction } from "@/app/dashboard/actions";
import { ProductForm } from "@/app/dashboard/(protected)/products/product-form";
import { BackLink } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, ModifierGroup } from "@/types/database";

export default async function NewProductPage() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  const [{ data: categories }, { data: modifierGroups }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("modifier_groups")
      .select("*")
      .eq("organization_id", organization.id)
      .order("sort_order"),
  ]);

  return (
    <div>
      <BackLink href="/dashboard/products" />
      <h2 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">Nuevo producto</h2>
      <ProductForm
        action={saveProductAction.bind(null, null)}
        categories={(categories ?? []) as Category[]}
        modifierGroups={(modifierGroups ?? []) as ModifierGroup[]}
        submitLabel="Crear producto"
      />
    </div>
  );
}
