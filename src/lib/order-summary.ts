import { formatPrice } from "@/lib/order-format";

const TZ = "America/Argentina/Buenos_Aires";

export type OrderPeriod = "today" | "week" | "month" | "last30";

export type OrderForSummary = {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: string;
};

export type DayBucket = {
  key: string;
  label: string;
  shortLabel: string;
  count: number;
  total: number;
};

export type PeriodSummary = {
  period: OrderPeriod;
  periodLabel: string;
  orderCount: number;
  revenue: number;
  buckets: DayBucket[];
  averageTicket: number;
};

const PERIOD_LABELS: Record<OrderPeriod, string> = {
  today: "Hoy",
  week: "Últimos 7 días",
  month: "Este mes",
  last30: "Últimos 30 días",
};

export function parsePeriod(value?: string): OrderPeriod {
  if (value === "week" || value === "month" || value === "last30") return value;
  return "today";
}

export function dateKeyInTz(date: Date, tz = TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfMonthInTz(now: Date, tz = TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}-01`;
}

function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function daysBetweenKeys(start: string, end: string): string[] {
  const keys: string[] = [];
  let cur = start;
  while (cur <= end) {
    keys.push(cur);
    cur = addDaysToKey(cur, 1);
  }
  return keys;
}

function formatDayLabel(key: string, style: "short" | "long"): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (style === "short") {
    return date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
  }
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function summarizeOrders(
  orders: OrderForSummary[],
  period: OrderPeriod,
  now = new Date(),
): PeriodSummary {
  const active = orders.filter((o) => o.status !== "cancelled");
  const todayKey = dateKeyInTz(now);

  let startKey: string;
  let endKey = todayKey;

  if (period === "today") {
    startKey = todayKey;
  } else if (period === "week") {
    startKey = addDaysToKey(todayKey, -6);
  } else if (period === "month") {
    startKey = startOfMonthInTz(now);
  } else {
    startKey = addDaysToKey(todayKey, -29);
  }

  const inRange = active.filter((o) => {
    const key = dateKeyInTz(new Date(o.created_at));
    return key >= startKey && key <= endKey;
  });

  const dayKeys =
    period === "today" ? [todayKey] : daysBetweenKeys(startKey, endKey);

  const buckets: DayBucket[] = dayKeys.map((key) => {
    const dayOrders = inRange.filter((o) => dateKeyInTz(new Date(o.created_at)) === key);
    const total = dayOrders.reduce((s, o) => s + Number(o.total), 0);
    return {
      key,
      label: formatDayLabel(key, "long"),
      shortLabel: formatDayLabel(key, "short"),
      count: dayOrders.length,
      total,
    };
  });

  const orderCount = inRange.length;
  const revenue = inRange.reduce((s, o) => s + Number(o.total), 0);

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    orderCount,
    revenue,
    buckets,
    averageTicket: orderCount > 0 ? revenue / orderCount : 0,
  };
}

export function formatRevenue(amount: number) {
  return formatPrice(amount);
}

// ponytail: sanity check
if (addDaysToKey("2026-07-01", 1) !== "2026-07-02") {
  throw new Error("order-summary: date key math broken");
}
