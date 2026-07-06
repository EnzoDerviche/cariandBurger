"use client";

import { useActionState, useState } from "react";
import { uploadOrganizationLogoAction } from "@/app/admin/upload-actions";
import { Checkbox, FormMessage, ColorField, inputClass } from "@/components/form-ui";
import { slugify } from "@/lib/slugify";
import type { ActionState, Organization } from "@/types/database";

type Props = {
  action: (
    prev: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  organization?: Organization;
  submitLabel: string;
  deleteAction?: () => Promise<void>;
};

const initial: ActionState = {};

export function OrganizationForm({
  action,
  organization,
  submitLabel,
  deleteAction,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? "");
  const [slug, setSlug] = useState(organization?.slug ?? "");
  const [primary, setPrimary] = useState(organization?.theme_primary ?? "#E63946");
  const [secondary, setSecondary] = useState(organization?.theme_secondary ?? "#1D3557");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const uploadAction = uploadOrganizationLogoAction.bind(null, organization?.id ?? "");

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setUploadError("La imagen no puede superar 4 MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setFileName(file.name);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("slug", slugify(slug));

    const result = await uploadAction({}, fd);
    setUploading(false);

    if (result.error) {
      setUploadError(result.error);
      return;
    }
    if (result.url) setLogoUrl(result.url);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="name" defaultValue={organization?.name} required />
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-semibold text-zinc-800">
              Slug (URL)
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={organization?.slug}
              placeholder="cariand-burger"
              required
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
            />
          </div>
          <Field
            label="WhatsApp (solo números)"
            name="whatsapp_number"
            defaultValue={organization?.whatsapp_number}
            placeholder="5492235551234"
            required
          />
          <Field
            label="Moneda"
            name="currency"
            defaultValue={organization?.currency ?? "ARS"}
          />
          <Field
            label="Prefijo de pedido"
            name="order_prefix"
            defaultValue={organization?.order_prefix ?? "PED"}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Logo</p>
          <input type="hidden" name="logo_url" value={logoUrl} />
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              className="mb-3 h-20 w-20 rounded-full border border-zinc-200 object-cover"
            />
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-red-400 hover:bg-red-50 ${
                uploading ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="sr-only"
              />
              {uploading ? "Subiendo..." : "Elegir logo"}
            </label>
            <span className="truncate text-sm text-zinc-600">
              {fileName || "PNG, JPG o WebP (máx. 4 MB)"}
            </span>
          </div>
          {!organization && (
            <p className="mt-1 text-xs text-zinc-600">
              Completá el slug antes de subir el logo.
            </p>
          )}
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Color primario" name="theme_primary" value={primary} onChange={setPrimary} />
          <ColorField
            label="Color secundario"
            name="theme_secondary"
            value={secondary}
            onChange={setSecondary}
          />
        </div>

        <Checkbox
          label="Activa (visible en la tienda)"
          name="is_active"
          defaultChecked={organization?.is_active ?? true}
        />

        <FormMessage state={state} />

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Guardando..." : submitLabel}
        </button>
      </form>

      {deleteAction && (
        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Eliminar hamburguesería
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </div>
  );
}
