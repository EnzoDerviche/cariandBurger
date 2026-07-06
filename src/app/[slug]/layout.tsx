import { notFound } from "next/navigation";
import { StoreProvider } from "@/app/[slug]/store-provider";
import { getStoreData } from "@/lib/store/get-store";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreData(slug);
  if (!store) notFound();

  return (
    <StoreProvider slug={slug}>
      <div className="min-h-screen bg-zinc-100">{children}</div>
    </StoreProvider>
  );
}
