"use client";

import { useActionState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  inputClass,
} from "@/components/form-ui";
import type { ActionState, ModifierGroup, ModifierOption } from "@/types/database";

type GroupWithOptions = ModifierGroup & { modifier_options: ModifierOption[] };

const btnPrimary =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60";
const btnSecondary =
  "rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60";
const btnDanger = "text-sm font-medium text-red-600 hover:text-red-700";

export function ModifierPanels({
  groups,
  saveGroup,
  deleteGroup,
  saveOption,
  deleteOption,
}: {
  groups: GroupWithOptions[];
  saveGroup: (id: string | null, prev: ActionState, fd: FormData) => Promise<ActionState>;
  deleteGroup: (id: string) => Promise<void>;
  saveOption: (
    groupId: string,
    id: string | null,
    prev: ActionState,
    fd: FormData,
  ) => Promise<ActionState>;
  deleteOption: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700">
        <p className="font-medium text-zinc-900">¿Cómo funciona?</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Creá un <strong>grupo</strong> (ej. &quot;Sazón en papas&quot;, &quot;Opcional&quot;).</li>
          <li>Agregá <strong>opciones</strong> con nombre y precio extra (ej. &quot;Con sazón&quot; +$1000).</li>
          <li>En cada producto, vinculá los grupos que correspondan.</li>
        </ol>
      </div>

      <NewGroupForm action={saveGroup.bind(null, null)} />

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
          Todavía no hay grupos. Creá el primero arriba.
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Tus grupos ({groups.length})
          </h3>
          {groups.map((group) => (
            <GroupPanel
              key={group.id}
              group={group}
              saveGroup={saveGroup.bind(null, group.id)}
              deleteGroup={deleteGroup.bind(null, group.id)}
              saveOption={saveOption}
              deleteOption={deleteOption}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewGroupForm({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form action={formAction} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-zinc-900">Nuevo grupo</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Ej: &quot;Opcional&quot;, &quot;Punto de cocción&quot;, &quot;Sazón en papas&quot;.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nombre del grupo" name="name" placeholder="Sazón en papas" required />
        </div>
        <Field
          label="Mínimo a elegir"
          name="min_selections"
          type="number"
          min="0"
          defaultValue={0}
        />
        <Field
          label="Máximo a elegir"
          name="max_selections"
          type="number"
          min="1"
          defaultValue={1}
        />
        <div>
          <Field label="Orden en el menú" name="sort_order" type="number" defaultValue={0} />
          <p className="mt-1 text-xs text-zinc-500">Número más bajo = se muestra primero.</p>
        </div>
        <div className="flex items-end pb-2">
          <Checkbox label="El cliente debe elegir al menos una opción" name="is_required" />
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Tip: para extras opcionales dejá mínimo en 0. Para &quot;elegí una salsa&quot; poné mínimo 1 y
        máximo 1.
      </p>

      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${btnPrimary} mt-4`}>
        {pending ? "Creando..." : "Crear grupo"}
      </button>
    </form>
  );
}

function GroupPanel({
  group,
  saveGroup,
  deleteGroup,
  saveOption,
  deleteOption,
}: {
  group: GroupWithOptions;
  saveGroup: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  deleteGroup: () => Promise<void>;
  saveOption: (
    groupId: string,
    id: string | null,
    prev: ActionState,
    fd: FormData,
  ) => Promise<ActionState>;
  deleteOption: (id: string) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(saveGroup, {} as ActionState);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{group.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Elige entre {group.min_selections} y {group.max_selections} opción
            {group.max_selections !== 1 ? "es" : ""}
            {group.is_required ? " · Obligatorio" : " · Opcional"}
          </p>
        </div>
        <form action={deleteGroup}>
          <button type="submit" className={btnDanger}>
            Eliminar grupo
          </button>
        </form>
      </div>

      <details className="border-b border-zinc-100 px-5 py-3">
        <summary className="cursor-pointer text-sm font-medium text-zinc-700">
          Editar reglas del grupo
        </summary>
        <form action={formAction} className="mt-4 space-y-4 pb-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Nombre" name="name" defaultValue={group.name} required />
            <Field
              label="Mínimo"
              name="min_selections"
              type="number"
              defaultValue={group.min_selections}
            />
            <Field
              label="Máximo"
              name="max_selections"
              type="number"
              defaultValue={group.max_selections}
            />
            <Field label="Orden" name="sort_order" type="number" defaultValue={group.sort_order} />
          </div>
          <Checkbox label="Obligatorio" name="is_required" defaultChecked={group.is_required} />
          <FormMessage state={state} />
          <button type="submit" disabled={pending} className={btnSecondary}>
            {pending ? "Guardando..." : "Guardar reglas"}
          </button>
        </form>
      </details>

      <div className="p-5">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">Opciones del grupo</h4>

        {group.modifier_options.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-500">Sin opciones todavía. Agregá la primera abajo.</p>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl border border-zinc-200">
            <div className="hidden bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_4rem_3.5rem_auto] sm:gap-3">
              <span>Nombre</span>
              <span>Precio</span>
              <span>Orden</span>
              <span>Activa</span>
              <span />
            </div>
            <div className="divide-y divide-zinc-100">
              {group.modifier_options.map((opt) => (
                <OptionRow
                  key={opt.id}
                  option={opt}
                  saveAction={saveOption.bind(null, group.id, opt.id)}
                  deleteAction={deleteOption.bind(null, opt.id)}
                />
              ))}
            </div>
          </div>
        )}

        <NewOptionForm action={saveOption.bind(null, group.id, null)} />
      </div>
    </article>
  );
}

function OptionRow({
  option,
  saveAction,
  deleteAction,
}: {
  option: ModifierOption;
  saveAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  deleteAction: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(saveAction, {} as ActionState);
  const formId = `opt-save-${option.id}`;

  return (
    <div className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_4rem_3.5rem_auto] sm:items-center sm:gap-3">
      <form id={formId} action={formAction} />
      <div>
        <span className="mb-1 block text-xs text-zinc-500 sm:hidden">Nombre</span>
        <input
          form={formId}
          name="name"
          defaultValue={option.name}
          required
          className={inputClass}
        />
      </div>
      <div>
        <span className="mb-1 block text-xs text-zinc-500 sm:hidden">Precio extra</span>
        <input
          form={formId}
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={option.price}
          className={inputClass}
        />
      </div>
      <div>
        <span className="mb-1 block text-xs text-zinc-500 sm:hidden">Orden</span>
        <input
          form={formId}
          name="sort_order"
          type="number"
          defaultValue={option.sort_order}
          className={inputClass}
        />
      </div>
      <div className="flex items-center sm:justify-center">
        <label className="flex items-center gap-2">
          <input
            form={formId}
            type="checkbox"
            name="is_active"
            defaultChecked={option.is_active}
            className="size-4 rounded border-zinc-300"
          />
          <span className="text-xs text-zinc-600 sm:sr-only">Activa</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button form={formId} type="submit" disabled={pending} className={btnSecondary}>
          {pending ? "..." : "Guardar"}
        </button>
        <form action={deleteAction}>
          <button type="submit" className={btnDanger}>
            Eliminar
          </button>
        </form>
      </div>
      {state.error && (
        <p className="col-span-full text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}

function NewOptionForm({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4"
    >
      <div className="min-w-[10rem] flex-1">
        <label htmlFor="new-opt-name" className="mb-1 block text-xs font-medium text-zinc-600">
          Nueva opción
        </label>
        <input
          id="new-opt-name"
          name="name"
          placeholder="Con sazón, Sin sazón..."
          required
          className={inputClass}
        />
      </div>
      <div className="w-28">
        <label htmlFor="new-opt-price" className="mb-1 block text-xs font-medium text-zinc-600">
          Precio extra
        </label>
        <input
          id="new-opt-price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={0}
          className={inputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Agregando..." : "+ Agregar opción"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="w-full text-sm text-green-700">{state.success}</p>
      )}
    </form>
  );
}
