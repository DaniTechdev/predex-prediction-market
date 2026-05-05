"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync, getAccount } from "@solana/spl-token";
import { USDC_MINT } from "@/lib/config";
import { fromUsdcRaw } from "@/lib/format";

export function useUsdcBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery({
    queryKey: ["usdc-balance", publicKey?.toBase58() ?? null],
    queryFn: async () => {
      if (!publicKey) return null;
      const ata = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      try {
        const acc = await getAccount(connection, ata);
        return { ata, raw: acc.amount, ui: fromUsdcRaw(acc.amount) };
      } catch {
        return { ata, raw: 0n, ui: 0 };
      }
    },
    enabled: Boolean(publicKey),
    staleTime: 10_000,
  });
}
