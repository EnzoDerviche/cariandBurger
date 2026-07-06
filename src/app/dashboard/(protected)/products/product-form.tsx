"use client";

import { useState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  checkboxClass,
  inputClass,
  useFormAction,
} from "@/components/form-ui";
import { uploadProductImageAction } from "@/app/dashboard/actions";
import type { Category, ModifierGroup, Product } from "@/types/database";

type Props = {
  action: (
    prev: import("@/types/database").ActionState,
    formData: FormData,
  ) => Promise<import("@/types/database").ActionState>;
  product?: Product;
  categories: Category[];
  modifierGroups: ModifierGroup[];
  selectedModifierGroupIds?: string[];
  submitLabel: string;
  deleteAction?: () => Promise<void>;
};

export function ProductForm({
  action,
  product,
  categories,
  modifierGroups,
  selectedModifierGroupIds = [],
  submitLabel,
  deleteAction,
}: Props) {
  const [state, formAction, pending] = useFormAction(action);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setFileName(file.name);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductImageAction({}, fd);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setImageUrl(result.url);
  }

  return (
    <div className="space-y-4">
      <form
        action={formAction}
        className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" defaultValue={product?.name} required />
          <Field
            label="Precio"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price ?? 0}
            required
          />
          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-zinc-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="category_id" className="mb-1 block text-sm font-medium text-zinc-700">
              Categoría
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={product?.category_id ?? ""}
              className={inputClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Field
              label="Orden"
              name="sort_order"
              type="number"
              defaultValue={product?.sort_order ?? 0}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Número más bajo = aparece primero dentro de su categoría.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Imagen</p>
          <input type="hidden" name="image_url" value={imageUrl} />
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Vista previa"
              className="mb-3 h-32 w-32 rounded-xl border border-zinc-200 object-cover"
            />
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              className={`dash-upload-label inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                disabled={uploading}
                className="sr-only"
              />
              {uploading ? "Subiendo..." : "Elegir imagen"}
            </label>
            <span className="truncate text-sm text-zinc-600">
              {fileName || "JPG, PNG o WebP"}
            </span>
          </div>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Checkbox label="Promo" name="is_promo" defaultChecked={product?.is_promo} />
          <Checkbox label="Activo" name="is_active" defaultChecked={product?.is_active ?? true} />
        </div>

        {modifierGroups.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">
              Grupos de modificadores
            </p>
            <div className="flex flex-wrap gap-3">
              {modifierGroups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                  <input
                    type="checkbox"
                    name="modifier_groups"
                    value={g.id}
                    defaultChecked={selectedModifierGroupIds.includes(g.id)}
                    className={checkboxClass}
                  />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
        )}

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
            Eliminar producto
          </button>
        </form>
      )}
    </div>
  );
}
