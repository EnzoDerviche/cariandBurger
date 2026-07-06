import Link from "next/link";

export default function HomePage() {
  return (
     <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-20 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-400">
        Burger Orders
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Pedidos por WhatsApp para hamburgueserías
      </h1>
      <p className="mt-4 max-w-xl text-zinc-400">
        Menú online, carrito y envío del pedido al local. Multi-tenant y
        personalizable por cliente.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/admin/login"
          className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500"
        >
          Panel admin
        </Link>
        <Link
          href="/cariand"
          className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
        >
          Ver demo tienda
        </Link>
      </div>
    </div>
  );
}
