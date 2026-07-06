import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

export default async function ProductsPage() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("organization_id", organization.id)
    .order("sort_order");

  const list = (products ?? []) as (Product & { categories: { name: string } | null })[];

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Menú con precios, fotos y promos."
        action={{ href: "/dashboard/products/new", label: "Nuevo producto" }}
      />

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-700">
          Sin productos. Agregá hamburguesas, promos, etc.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/products/${p.id}`}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-md"
            >
              <div className="aspect-video bg-zinc-100">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">
                    🍔
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-900">{p.name}</h3>
                  {p.is_promo && (
                    <span className="dash-badge-brand">
                      PROMO
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-zinc-700">
                  {p.categories?.name ?? "Sin categoría"}
                </p>
                <p className="mt-2 text-lg font-bold text-zinc-900">
                  ${Number(p.price).toLocaleString("es-AR")}
                </p>
                {!p.is_active && (
                  <p className="mt-1 text-xs font-medium text-amber-700">Inactivo</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
