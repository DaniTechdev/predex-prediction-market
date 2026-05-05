"use client";

import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { positionPda } from "@/lib/pdas";

export function usePosition(market: PublicKey | string | undefined) {
  const { program, wallet } = useProgram();
  const marketKey = market
    ? typeof market === "string"
      ? new PublicKey(market)
      : market
    : undefined;

  return useQuery({
    queryKey: [
      "position",
      marketKey?.toBase58(),
      wallet?.publicKey?.toBase58() ?? null,
    ],
    queryFn: async () => {
      if (!marketKey || !wallet) return null;
      const pda = positionPda(wallet.publicKey, marketKey);
      try {
        return await program.account.position.fetch(pda);
      } catch {
        return null;
      }
    },
    enabled: Boolean(marketKey && wallet),
    staleTime: 5_000,
  });
}
