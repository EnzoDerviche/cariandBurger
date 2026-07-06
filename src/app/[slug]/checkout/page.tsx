import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutClient } from "@/app/[slug]/checkout/checkout-client";
import {
  getClosedMessage,
  isStoreOpen,
  parseBusinessHours,
} from "@/lib/business-hours";
import { getStoreData } from "@/lib/store/get-store";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreData(slug);
  if (!store) notFound();

  const brand = store.organization.theme_primary ?? "#E63946";
  const hours = parseBusinessHours(store.settings?.business_hours);
  const open = isStoreOpen(hours);

  if (!open) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/${slug}`}
          className="mb-4 inline-flex items-center text-sm font-semibold text-zinc-800 hover:text-zinc-900"
        >
          ← Volver al menú
        </Link>
        <div
          className="rounded-2xl border px-6 py-10 text-center"
          style={{
            borderColor: `${brand}44`,
            backgroundColor: `${brand}11`,
          }}
        >
          <p className="text-4xl">🕐</p>
          <h1 className="mt-3 text-xl font-bold text-zinc-900">Local cerrado</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-700">
            {getClosedMessage(hours)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center text-sm font-semibold text-zinc-800 hover:text-zinc-900"
      >
        ← Volver al menú
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Confirmar pedido</h1>
      <div className="lg:max-w-2xl">
        <CheckoutClient
          slug={slug}
          orgName={store.organization.name}
          brandColor={brand}
          settings={store.settings}
        />
      </div>
    </div>
  );
}
