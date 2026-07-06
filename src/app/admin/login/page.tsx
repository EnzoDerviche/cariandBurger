import { LoginForm } from "@/app/admin/login/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Panel Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Super admin o admin del local
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
