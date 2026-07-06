"use client";

import {
  Checkbox,
  Field,
  FormMessage,
  useFormAction,
} from "@/components/form-ui";
import type { Category } from "@/types/database";

type Props = {
  action: (
    prev: import("@/types/database").ActionState,
    formData: FormData,
  ) => Promise<import("@/types/database").ActionState>;
  category?: Category;
  submitLabel: string;
  deleteAction?: () => Promise<void>;
};

export function CategoryForm({ action, category, submitLabel, deleteAction }: Props) {
  const [state, formAction, pending] = useFormAction(action);

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" defaultValue={category?.name} required />
          <Field
            label="Slug (URL interna)"
            name="slug"
            defaultValue={category?.slug}
            placeholder="promos"
          />
          <div>
            <Field
              label="Orden"
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Número más bajo = aparece primero en el menú (ej. PROMOS = 0).
            </p>
          </div>
        </div>
        <Checkbox label="Activa" name="is_active" defaultChecked={category?.is_active ?? true} />
        <FormMessage state={state} />
        <button
          type="submit"
          disabled={pending}
          className="dash-btn-brand disabled:opacity-60"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </form>
      {deleteAction && (
        <form action={deleteAction}>
          <button
            type="submit"
            className="dash-btn-brand-outline"
          >
            Eliminar categoría
          </button>
        </form>
      )}
    </div>
  );
}
