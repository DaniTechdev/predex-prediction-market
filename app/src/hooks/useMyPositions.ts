"use client";

import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { positionPda } from "@/lib/pdas";
import type { MarketView } from "./useMarkets";

export interface MyPositionRow {
  publicKey: PublicKey;
  market: MarketView["market"];
  pool: MarketView["pool"];
  position: Awaited<
    ReturnType<ReturnType<typeof useProgram>["program"]["account"]["position"]["fetch"]>
  >;
}

export function useMyPositions(markets: MarketView[] | undefined) {
  const { program } = useProgram();
  const { publicKey } = useWallet();

  return useQuery<MyPositionRow[]>({
    queryKey: [
      "my-positions",
      publicKey?.toBase58() ?? null,
      markets?.length ?? 0,
    ],
    queryFn: async () => {
      if (!publicKey || !markets) return [];

      const candidates = markets.map((m) => ({
        marketView: m,
        pda: positionPda(publicKey, m.publicKey),
      }));

      const infos = await program.account.position.fetchMultiple(
        candidates.map((c) => c.pda),
      );

      const rows: MyPositionRow[] = [];
      infos.forEach((p, i) => {
        if (!p) return;
        const total = (p.yesAmount as { toNumber(): number }).toNumber() + (p.noAmount as { toNumber(): number }).toNumber();
        if (total === 0) return;
        rows.push({
          publicKey: candidates[i].marketView.publicKey,
          market: candidates[i].marketView.market,
          pool: candidates[i].marketView.pool,
          position: p,
        });
      });

      return rows;
    },
    enabled: Boolean(publicKey && markets),
  });
}
