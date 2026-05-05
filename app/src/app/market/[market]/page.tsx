import { MarketDetail } from "@/components/market/MarketDetail";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  return <MarketDetail marketAddress={market} />;
}
