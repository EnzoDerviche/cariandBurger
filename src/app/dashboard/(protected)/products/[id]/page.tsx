import { notFound } from "next/navigation";
import {
  deleteProductAction,
  saveProductAction,
} from "@/app/dashboard/actions";
import { ProductForm } from "@/app/dashboard/(protected)/products/product-form";
import { BackLink } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, ModifierGroup, Product } from "@/types/database";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireOrgMember();
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: modifierGroups }, { data: linked }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single(),
      supabase
        .from("categories")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order"),
      supabase
        .from("modifier_groups")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order"),
      supabase.from("product_modifier_groups").select("modifier_group_id").eq("product_id", id),
    ]);

  if (!product) notFound();

  return (
    <div>
      <BackLink href="/dashboard/products" />
      <h2 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">
        Editar: {(product as Product).name}
      </h2>
      <ProductForm
        action={saveProductAction.bind(null, id)}
        product={product as Product}
        categories={(categories ?? []) as Category[]}
        modifierGroups={(modifierGroups ?? []) as ModifierGroup[]}
        selectedModifierGroupIds={(linked ?? []).map((l) => l.modifier_group_id)}
        submitLabel="Guardar cambios"
        deleteAction={deleteProductAction.bind(null, id)}
      />
    </div>
  );
}
