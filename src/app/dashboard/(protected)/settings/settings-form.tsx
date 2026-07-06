"use client";

import { useActionState, useState } from "react";
import {
  Checkbox,
  Field,
  FormMessage,
  checkboxClass,
  inputClass,
} from "@/components/form-ui";
import {
  DAY_KEYS,
  DAY_LABELS,
  parseBusinessHours,
  type DayKey,
} from "@/lib/business-hours";
import type { ActionState, Organization, OrganizationSettings } from "@/types/database";

const PAYMENT_METHODS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "mercado_pago", label: "Mercado Pago" },
  { key: "transferencia", label: "Transferencia" },
  { key: "tarjeta", label: "Tarjeta" },
] as const;

const TIME_OPTIONS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
  }
  return slots;
})();

export function SettingsForm({
  action,
  organization,
  settings,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  organization: Organization;
  settings: OrganizationSettings | null;
}) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const payments = settings?.payment_methods ?? ["efectivo", "mercado_pago", "transferencia"];
  const hours = parseBusinessHours(settings?.business_hours);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6"
    >
      <section className="space-y-4">
        <h3 className="font-semibold text-zinc-900">Contacto</h3>
        <Field
          label="WhatsApp (solo números)"
          name="whatsapp_number"
          defaultValue={organization.whatsapp_number}
          required
        />
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-zinc-900">Horario de atención</h3>
        <p className="text-sm text-zinc-600">
          Si está activo, los clientes no pueden pedir fuera de estos horarios (hora Argentina).
        </p>
        <Checkbox
          label="Restringir pedidos por horario"
          name="hours_enabled"
          defaultChecked={hours.enabled}
        />
        <div>
          <label htmlFor="closed_message" className="mb-1 block text-sm font-medium text-zinc-700">
            Mensaje cuando está cerrado
          </label>
          <textarea
            id="closed_message"
            name="closed_message"
            rows={2}
            defaultValue={hours.closed_message ?? ""}
            placeholder="Estamos cerrados. Abrimos hoy a las 18:00."
            className={inputClass}
          />
        </div>
        <div className="rounded-xl border border-zinc-200">
          <div className="hidden border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-500 sm:grid sm:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] sm:gap-3">
            <span>Día</span>
            <span className="text-center">Abierto</span>
            <span>Desde</span>
            <span>Hasta</span>
          </div>
          {DAY_KEYS.map((key) => (
            <DayHoursRow key={key} dayKey={key} hours={hours.days[key]} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold text-zinc-900">Entrega y pedidos</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox
            label="Delivery"
            name="delivery_enabled"
            defaultChecked={settings?.delivery_enabled ?? true}
          />
          <Checkbox
            label="Retiro en local"
            name="pickup_enabled"
            defaultChecked={settings?.pickup_enabled ?? true}
          />
        </div>
        <Field
          label="Pedido mínimo ($)"
          name="min_order_amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={settings?.min_order_amount ?? 0}
        />
        <div>
          <label htmlFor="welcome_message" className="mb-1 block text-sm font-medium text-zinc-700">
            Mensaje de bienvenida (opcional)
          </label>
          <textarea
            id="welcome_message"
            name="welcome_message"
            rows={2}
            defaultValue={settings?.welcome_message ?? ""}
            className={inputClass}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-zinc-900">Métodos de pago</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <Checkbox
              key={m.key}
              label={m.label}
              name={`pay_${m.key}`}
              defaultChecked={payments.includes(m.key)}
            />
          ))}
        </div>
      </section>

      <FormMessage state={state} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}

function DayHoursRow({
  dayKey,
  hours,
}: {
  dayKey: DayKey;
  hours?: { open: string; close: string };
}) {
  const [open, setOpen] = useState(Boolean(hours));
  const start = normalizeTime(hours?.open ?? "18:00");
  const end = normalizeTime(hours?.close ?? "23:00");

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem] sm:items-center sm:gap-3">
      <span className="text-sm font-medium text-zinc-900">{DAY_LABELS[dayKey]}</span>

      <div className="flex justify-start sm:justify-center">
        <input
          type="checkbox"
          name={`hours_${dayKey}_open`}
          checked={open}
          onChange={(e) => setOpen(e.target.checked)}
          className={checkboxClass}
          aria-label={`${DAY_LABELS[dayKey]} abierto`}
        />
      </div>

      <div className="flex items-center gap-2 sm:contents">
        <span className="text-xs text-zinc-500 sm:hidden">Desde</span>
        <TimeSelect
          name={`hours_${dayKey}_start`}
          defaultValue={start}
          disabled={!open}
        />
      </div>

      <div className="flex items-center gap-2 sm:contents">
        <span className="text-xs text-zinc-500 sm:hidden">Hasta</span>
        <TimeSelect name={`hours_${dayKey}_end`} defaultValue={end} disabled={!open} />
      </div>
    </div>
  );
}

function TimeSelect({
  name,
  defaultValue,
  disabled,
}: {
  name: string;
  defaultValue: string;
  disabled?: boolean;
}) {
  const value = TIME_OPTIONS.includes(defaultValue) ? defaultValue : "18:00";

  return (
    <select
      name={name}
      defaultValue={value}
      disabled={disabled}
      className={`${inputClass} disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400`}
    >
      {TIME_OPTIONS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

function normalizeTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const rounded = Math.round((m ?? 0) / 15) * 15;
  const mins = rounded === 60 ? 0 : rounded;
  const hours = rounded === 60 ? (h ?? 0) + 1 : (h ?? 0);
  return `${String(hours % 24).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
