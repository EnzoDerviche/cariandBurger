import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { requireOrgMember } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization, email, profile } = await requireOrgMember();
  const brand = organization.theme_primary ?? "#E63946";

  return (
    <div
      className="min-h-screen bg-zinc-100"
      data-dashboard-brand
      style={{ "--brand": brand } as React.CSSProperties}
    >
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="dash-text-brand truncate text-xs font-bold uppercase tracking-wider">
                {organization.name}
              </p>
              <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">
                Panel del local
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/${organization.slug}`}
                target="_blank"
                className="dash-link-brand hidden rounded-lg px-2 py-1.5 text-sm font-medium sm:inline"
              >
                Ver tienda
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
          {profile.full_name ?? email ? (
            <p className="mt-1 truncate text-sm text-zinc-700 sm:hidden">
              {profile.full_name ?? email}
            </p>
          ) : null}
        </div>
        <div className="mx-auto max-w-6xl border-t border-zinc-100 px-4">
          <DashboardNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
