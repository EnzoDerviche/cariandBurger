"use client";

import { useActionState } from "react";
import type { ActionState } from "@/types/database";

export function AssignUserForm({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <div>
        <h3 className="font-semibold text-zinc-900">Asignar usuario al local</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Primero creá el usuario en Supabase Auth, luego asignalo acá.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email del usuario
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium">
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue="org_admin"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="org_admin">Admin del local</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Asignando..." : "Asignar usuario"}
      </button>
    </form>
  );
}
