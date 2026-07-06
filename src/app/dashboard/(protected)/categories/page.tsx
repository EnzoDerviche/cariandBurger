import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export default async function CategoriesPage() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("organization_id", organization.id)
    .order("sort_order");

  const categories = (data ?? []) as Category[];

  return (
    <div>
      <PageHeader
        title="Categorías"
        description="Organizá el menú por secciones."
        action={{ href: "/dashboard/categories/new", label: "Nueva categoría" }}
      />

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-700">
          Sin categorías. Creá la primera (ej: PROMOS, Hamburguesas).
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-800">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-zinc-800">Orden</th>
                  <th className="px-4 py-3 font-semibold text-zinc-800">Estado</th>
                  <th className="px-4 py-3 font-semibold text-zinc-800"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{cat.name}</td>
                    <td className="px-4 py-3 text-zinc-800">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          cat.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-zinc-200 text-zinc-800"
                        }`}
                      >
                        {cat.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/categories/${cat.id}`}
                        className="dash-text-brand font-semibold hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
