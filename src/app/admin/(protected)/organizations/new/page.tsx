import Link from "next/link";
import { createOrganizationAction } from "@/app/admin/actions";
import { OrganizationForm } from "@/app/admin/(protected)/organizations/organization-form";

export default function NewOrganizationPage() {
  return (
    <div>
      <Link
        href="/admin/organizations"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← Volver
      </Link>
      <h2 className="mb-6 text-2xl font-bold text-zinc-900">
        Nueva hamburguesería
      </h2>
      <OrganizationForm
        action={createOrganizationAction}
        submitLabel="Crear hamburguesería"
      />
    </div>
  );
}
