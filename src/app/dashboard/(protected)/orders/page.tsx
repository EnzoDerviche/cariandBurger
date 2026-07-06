import { OrdersClient } from "@/app/dashboard/(protected)/orders/orders-client";
import { PageHeader } from "@/components/dashboard/page-header";
import { ORDER_SELECT } from "@/lib/orders";
import { requireOrgMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/types/database";

export default async function OrdersPage() {
  const { organization } = await requireOrgMember();
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos en tiempo real. Imprimí tickets en la ticketera del mostrador."
      />
      <OrdersClient
        orgId={organization.id}
        orgName={organization.name}
        initialOrders={(data ?? []) as OrderWithItems[]}
      />
    </div>
  );
}
