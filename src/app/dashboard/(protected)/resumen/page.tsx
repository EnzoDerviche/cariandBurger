import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatRevenue, parsePeriod, summarizeOrders, type OrderPeriod } from "@/lib/order-summary";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { OrderForSummary } from "@/lib/order-summary";

const TABS: { id: OrderPeriod; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "7 días" },
  { id: "month", label: "Este mes" },
  { id: "last30", label: "30 días" },
];

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const { organization } = await requireOrgMember();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, created_at, total, status")
    .eq("organization_id", organization.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as OrderForSummary[];
  const summary = summarizeOrders(orders, period);
  const maxCount = Math.max(...summary.buckets.map((b) => b.count), 1);

  return (
    <div>
      <PageHeader
        title="Resumen"
        description="Pedidos y facturación de tu local."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/resumen?period=${tab.id}`}
            className={
              period === tab.id
                ? "dash-btn-brand !rounded-full px-4 py-2 text-sm font-semibold"
                : "rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <p className="mb-4 text-sm font-medium text-zinc-600">{summary.periodLabel}</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pedidos" value={String(summary.orderCount)} />
        <StatCard label="Total vendido" value={formatRevenue(summary.revenue)} />
        <StatCard
          label="Ticket promedio"
          value={summary.orderCount > 0 ? formatRevenue(summary.averageTicket) : "—"}
        />
      </div>

      {summary.orderCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
          Sin pedidos en este período.
        </div>
      ) : (
        <>
          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900">Pedidos por día</h3>
            <div
              className="flex items-end justify-between gap-1 sm:gap-2"
              style={{ minHeight: period === "today" ? "4rem" : "8rem" }}
            >
              {summary.buckets.map((bucket) => (
                <div
                  key={bucket.key}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  title={`${bucket.label}: ${bucket.count} pedidos`}
                >
                  <span className="text-xs font-semibold text-zinc-800">{bucket.count}</span>
                  <div className="flex h-24 w-full items-end justify-center sm:h-32">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-[var(--brand)] transition-all"
                      style={{
                        height: `${Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="w-full truncate text-center text-[10px] text-zinc-500 sm:text-xs">
                    {period === "today" ? "Hoy" : bucket.shortLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <h3 className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
              Detalle por día
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs font-semibold text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Día</th>
                    <th className="px-4 py-3 text-right">Pedidos</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...summary.buckets]
                    .reverse()
                    .filter((b) => b.count > 0)
                    .map((bucket) => (
                      <tr key={bucket.key} className="border-t border-zinc-100">
                        <td className="px-4 py-3 capitalize text-zinc-900">{bucket.label}</td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-800">
                          {bucket.count}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                          {formatRevenue(bucket.total)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-zinc-900">Total</td>
                    <td className="px-4 py-3 text-right text-zinc-900">{summary.orderCount}</td>
                    <td className="px-4 py-3 text-right text-zinc-900">
                      {formatRevenue(summary.revenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
