export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

export type DayHours = { open: string; close: string };

export type BusinessHours = {
  enabled: boolean;
  closed_message: string | null;
  days: Partial<Record<DayKey, DayHours>>;
};

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

const DEFAULT_TZ = "America/Argentina/Buenos_Aires";

export function parseBusinessHours(raw: unknown): BusinessHours {
  if (!raw || typeof raw !== "object") {
    return { enabled: false, closed_message: null, days: {} };
  }

  const obj = raw as Record<string, unknown>;
  const days: Partial<Record<DayKey, DayHours>> = {};
  const rawDays = (obj.days ?? obj.schedule) as Record<string, unknown> | undefined;

  if (rawDays && typeof rawDays === "object") {
    for (const key of DAY_KEYS) {
      const d = rawDays[key];
      if (d && typeof d === "object" && "open" in d && "close" in d) {
        const open = String((d as DayHours).open).slice(0, 5);
        const close = String((d as DayHours).close).slice(0, 5);
        if (open && close) days[key] = { open, close };
      }
    }
  }

  return {
    enabled: obj.enabled === true,
    closed_message:
      typeof obj.closed_message === "string" ? obj.closed_message : null,
    days,
  };
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getNowInTz(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return {
    dayKey: WEEKDAY_TO_KEY[weekday],
    minutes: hour * 60 + minute,
  };
}

export function isStoreOpen(
  hours: BusinessHours,
  now = new Date(),
  tz = DEFAULT_TZ,
): boolean {
  if (!hours.enabled) return true;

  const { dayKey, minutes } = getNowInTz(now, tz);
  if (!dayKey) return false;

  const day = hours.days[dayKey];
  if (!day) return false;

  const openMin = parseTimeToMinutes(day.open);
  const closeMin = parseTimeToMinutes(day.close);

  if (closeMin > openMin) {
    return minutes >= openMin && minutes < closeMin;
  }

  return minutes >= openMin || minutes < closeMin;
}

export function getClosedMessage(hours: BusinessHours): string {
  return (
    hours.closed_message?.trim() ||
    "El local está cerrado en este momento. Volvé en nuestro horario de atención."
  );
}

export function parseBusinessHoursFromForm(formData: FormData): BusinessHours {
  const enabled = formData.get("hours_enabled") === "on";
  const closed_message =
    String(formData.get("closed_message") ?? "").trim() || null;
  const days: Partial<Record<DayKey, DayHours>> = {};

  for (const key of DAY_KEYS) {
    if (formData.get(`hours_${key}_open`) === "on") {
      const open = String(formData.get(`hours_${key}_start`) ?? "").slice(0, 5);
      const close = String(formData.get(`hours_${key}_end`) ?? "").slice(0, 5);
      if (open && close) days[key] = { open, close };
    }
  }

  return { enabled, closed_message, days };
}

// ponytail: sanity check
if (parseTimeToMinutes("18:30") !== 1110) {
  throw new Error("business-hours: parseTimeToMinutes broken");
}
