"use client";

import { useActionState } from "react";
import type { ActionState } from "@/types/database";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100";

const checkboxClass =
  "size-4 shrink-0 rounded border-zinc-300 accent-red-600 focus:ring-red-500 focus:ring-offset-0";

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        className={inputClass}
      />
    </div>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className={checkboxClass}
      />
      {label}
    </label>
  );
}

export function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-semibold text-zinc-800">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white p-2">
        <input
          id={name}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input type="hidden" name={name} value={value} />
        <span className="text-sm font-medium uppercase tracking-wide text-zinc-700">
          {value}
        </span>
      </div>
    </div>
  );
}

export function useFormAction(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
) {
  return useActionState(action, {} as ActionState);
}

export { inputClass, checkboxClass };
