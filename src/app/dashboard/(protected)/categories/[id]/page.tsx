import { notFound } from "next/navigation";
import {
  deleteCategoryAction,
  saveCategoryAction,
} from "@/app/dashboard/actions";
import { CategoryForm } from "@/app/dashboard/(protected)/categories/category-form";
import { BackLink } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .single();

  if (!data) notFound();

  return (
    <div>
      <BackLink href="/dashboard/categories" />
      <h2 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">
        Editar: {(data as Category).name}
      </h2>
      <CategoryForm
        action={saveCategoryAction.bind(null, id)}
        category={data as Category}
        submitLabel="Guardar cambios"
        deleteAction={deleteCategoryAction.bind(null, id)}
      />
    </div>
  );
}
