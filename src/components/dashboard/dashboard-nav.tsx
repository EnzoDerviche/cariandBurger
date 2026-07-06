"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/orders", label: "Pedidos" },
  { href: "/dashboard/resumen", label: "Resumen" },
  { href: "/dashboard/products", label: "Productos" },
  { href: "/dashboard/categories", label: "Categorías" },
  { href: "/dashboard/modifiers", label: "Modificadores" },
  { href: "/dashboard/settings", label: "Configuración" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto pb-px">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "dash-nav-active whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-semibold sm:px-4"
                : "whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 sm:px-4"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
