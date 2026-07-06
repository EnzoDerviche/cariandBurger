import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Sin permisos</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tu cuenta no tiene acceso al panel de super administrador.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          </form>
          <Link
            href="/"
            className="block rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
