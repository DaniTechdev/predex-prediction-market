"use client";

import { useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram, getReadOnlyProgram } from "@/lib/anchor";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(
    () => (wallet ? getProgram(connection, wallet) : getReadOnlyProgram(connection)),
    [connection, wallet],
  );

  return { program, wallet, connection };
}
