"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { aiMetadataPda, poolPda } from "@/lib/pdas";

export type MarketAccount = Awaited<
  ReturnType<ReturnType<typeof useProgram>["program"]["account"]["market"]["all"]>
>[number];

export type PoolAccount = Awaited<
  ReturnType<ReturnType<typeof useProgram>["program"]["account"]["marketPool"]["fetch"]>
>;

export type AiMetadataAccount = Awaited<
  ReturnType<ReturnType<typeof useProgram>["program"]["account"]["aiMetadata"]["fetch"]>
>;

export interface MarketView {
  publicKey: PublicKey;
  market: MarketAccount["account"];
  pool: PoolAccount;
  ai: AiMetadataAccount;
}

export function useMarkets() {
  const { program } = useProgram();

  return useQuery<MarketView[]>({
    queryKey: ["markets", program.programId.toBase58()],
    queryFn: async () => {
      const markets = await program.account.market.all();

      const views = await Promise.all(
        markets.map(async (m) => {
          const [pool, ai] = await Promise.all([
            program.account.marketPool.fetch(poolPda(m.publicKey)),
            program.account.aiMetadata.fetch(aiMetadataPda(m.publicKey)),
          ]);
          return {
            publicKey: m.publicKey,
            market: m.account,
            pool,
            ai,
          };
        }),
      );

      views.sort((a, b) => Number(b.market.createdAt) - Number(a.market.createdAt));
      return views;
    },
    staleTime: 15_000,
  });
}

export function useMarket(marketAddress: string | undefined) {
  const { program } = useProgram();

  return useQuery<MarketView | null>({
    queryKey: ["market", marketAddress],
    queryFn: async () => {
      if (!marketAddress) return null;
      const pk = new PublicKey(marketAddress);
      const market = await program.account.market.fetch(pk);
      const [pool, ai] = await Promise.all([
        program.account.marketPool.fetch(poolPda(pk)),
        program.account.aiMetadata.fetch(aiMetadataPda(pk)),
      ]);
      return { publicKey: pk, market, pool, ai };
    },
    enabled: Boolean(marketAddress),
    staleTime: 5_000,
  });
}
