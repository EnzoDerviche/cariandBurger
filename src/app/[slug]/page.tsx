import { notFound } from "next/navigation";
import { MenuClient } from "@/app/[slug]/menu-client";
import {
  getClosedMessage,
  isStoreOpen,
  parseBusinessHours,
} from "@/lib/business-hours";
import { getStoreData } from "@/lib/store/get-store";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreData(slug);
  if (!store) notFound();

  const hours = parseBusinessHours(store.settings?.business_hours);
  const open = isStoreOpen(hours);

  return (
    <MenuClient
      store={store}
      isOpen={open}
      closedMessage={getClosedMessage(hours)}
    />
  );
}
