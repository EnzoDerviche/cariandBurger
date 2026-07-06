import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignUserToOrgAction,
  deleteOrganizationAction,
  updateOrganizationAction,
} from "@/app/admin/actions";
import { AssignUserForm } from "@/app/admin/(protected)/organizations/assign-user-form";
import { OrganizationForm } from "@/app/admin/(protected)/organizations/organization-form";
import { createClient } from "@/lib/supabase/server";
import type { Organization } from "@/types/database";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const organization = data as Organization;
  const boundUpdate = updateOrganizationAction.bind(null, id);
  const boundDelete = deleteOrganizationAction.bind(null, id);

  return (
    <div>
      <Link
        href="/admin/organizations"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← Volver
      </Link>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-zinc-900">{organization.name}</h2>
        <Link
          href={`/${organization.slug}`}
          className="text-sm font-medium text-red-600 hover:underline"
          target="_blank"
        >
          Ver tienda →
        </Link>
      </div>
      <OrganizationForm
        action={boundUpdate}
        organization={organization}
        submitLabel="Guardar cambios"
        deleteAction={boundDelete}
      />
      <AssignUserForm action={assignUserToOrgAction.bind(null, id)} />
    </div>
  );
}
