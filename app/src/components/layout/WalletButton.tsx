"use client";

import dynamic from "next/dynamic";

export const WalletButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false, loading: () => <div className="h-[42px] w-[140px] rounded-[10px] skeleton" /> },
);
