"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/order-format";
import type { Category } from "@/types/database";
import { isPromoProduct, type MenuProduct, type StoreData } from "@/lib/store/types";
import { ProductModal } from "@/app/[slug]/product-modal";
import { useStore } from "@/app/[slug]/store-provider";

export function MenuClient({
  store,
  isOpen = true,
  closedMessage,
}: {
  store: StoreData;
  isOpen?: boolean;
  closedMessage?: string;
}) {
  const { count, total } = useStore();
  const [activeProduct, setActiveProduct] = useState<MenuProduct | null>(null);
  const brand = store.organization.theme_primary ?? "#E63946";

  const productsByCategory = groupProducts(store.categories, store.products);
  const uncategorized = store.products.filter((p) => !p.category_id);
  const hasCategories = store.categories.length > 0;

  const sectionSlugs = useMemo(
    () => [
      ...productsByCategory.map(({ category }) => category.slug),
      ...(uncategorized.length > 0 ? ["otros"] : []),
    ],
    [productsByCategory, uncategorized.length],
  );

  const [activeSection, setActiveSection] = useState(sectionSlugs[0] ?? "");

  useEffect(() => {
    if (sectionSlugs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.15, 0.4] },
    );

    for (const slug of sectionSlugs) {
      const el = document.getElementById(`cat-${slug}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionSlugs]);

  function navClass(slug: string, pill = false) {
    const active = activeSection === slug;
    if (pill) {
      return active
        ? "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
        : "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 transition hover:ring-zinc-300";
    }
    return active
      ? "block rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm"
      : "block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-white hover:shadow-sm";
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-zinc-200 bg-white shadow-sm"
        style={{ borderBottomColor: `${brand}33` }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {store.organization.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.organization.logo_url}
              alt=""
              className="h-11 w-11 rounded-full object-cover sm:h-14 sm:w-14"
            />
          ) : (
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-xl sm:h-14 sm:w-14 sm:text-2xl"
              style={{ backgroundColor: `${brand}22` }}
            >
              🍔
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-zinc-900 sm:text-2xl">
              {store.organization.name}
            </h1>
            {store.settings?.welcome_message && (
              <p className="mt-0.5 text-sm text-zinc-700 sm:text-base">
                {store.settings.welcome_message}
              </p>
            )}
          </div>
        </div>

        {hasCategories && (
          <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">
            {store.categories.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.slug}`}
                className={navClass(cat.slug, true)}
                style={activeSection === cat.slug ? { backgroundColor: brand } : undefined}
                onClick={() => setActiveSection(cat.slug)}
              >
                {cat.name}
              </a>
            ))}
          </nav>
        )}
      </header>

      {!isOpen && (
        <div
          className="border-b px-4 py-4 text-center sm:px-6"
          style={{ borderColor: `${brand}33`, backgroundColor: `${brand}14` }}
        >
          <p className="text-sm font-semibold text-zinc-900">Local cerrado</p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-zinc-700">
            {closedMessage}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:flex lg:gap-10 lg:px-8 lg:py-8">
        {hasCategories && (
          <aside className="hidden lg:block lg:w-52 lg:shrink-0">
            <nav className="sticky top-28 space-y-1">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Menú
              </p>
              {store.categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#cat-${cat.slug}`}
                  className={navClass(cat.slug)}
                  style={activeSection === cat.slug ? { backgroundColor: brand } : undefined}
                  onClick={() => setActiveSection(cat.slug)}
                >
                  {cat.name}
                </a>
              ))}
              {uncategorized.length > 0 && (
                <a
                  href="#cat-otros"
                  className={navClass("otros")}
                  style={activeSection === "otros" ? { backgroundColor: brand } : undefined}
                  onClick={() => setActiveSection("otros")}
                >
                  Otros
                </a>
              )}
            </nav>
          </aside>
        )}

        <main className="min-w-0 flex-1 pb-28 lg:pb-8">
          {store.products.length === 0 ? (
            <p className="py-16 text-center text-zinc-700">
              Todavía no hay productos en el menú.
            </p>
          ) : (
            <>
              {productsByCategory.map(({ category, products }) => (
                <section key={category.id} id={`cat-${category.slug}`} className="mb-10 scroll-mt-28">
                  <h2
                    className="mb-4 text-base font-bold uppercase tracking-wider sm:text-lg"
                    style={{ color: brand }}
                  >
                    {category.name}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        brand={brand}
                        disabled={!isOpen}
                        onSelect={() => isOpen && setActiveProduct(product)}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {uncategorized.length > 0 && (
                <section id="cat-otros" className="mb-10 scroll-mt-28">
                  <h2 className="mb-4 text-base font-bold uppercase tracking-wider text-zinc-800 sm:text-lg">
                    Otros
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {uncategorized.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        brand={brand}
                        disabled={!isOpen}
                        onSelect={() => isOpen && setActiveProduct(product)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {count > 0 && isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] lg:bottom-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <Link
            href={`/${store.organization.slug}/checkout`}
            className="mx-auto flex max-w-6xl items-center justify-between rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-105 sm:text-base lg:ml-auto lg:max-w-sm lg:mr-8"
            style={{ backgroundColor: brand }}
          >
            <span>Ver pedido ({count})</span>
            <span>{formatPrice(total)}</span>
          </Link>
        </div>
      )}

      {activeProduct && isOpen && (
        <ProductModal
          product={activeProduct}
          brandColor={brand}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </>
  );
}

function ProductCard({
  product,
  brand,
  disabled,
  onSelect,
}: {
  product: MenuProduct;
  brand: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-zinc-300 hover:shadow-md active:scale-[0.99]"
      }`}
    >
      <div className="aspect-[4/3] w-full bg-zinc-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl sm:text-5xl">🍔</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-zinc-900 sm:text-lg">{product.name}</p>
          {isPromoProduct(product) && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs"
              style={{ backgroundColor: brand }}
            >
              PROMO
            </span>
          )}
        </div>
        {product.description && (
          <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-700">
            {product.description}
          </p>
        )}
        <p className="mt-3 text-lg font-bold text-zinc-900">
          {formatPrice(Number(product.price))}
        </p>
      </div>
    </button>
  );
}

function groupProducts(categories: Category[], products: MenuProduct[]) {
  return categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.category_id === category.id),
    }))
    .filter((g) => g.products.length > 0);
}
