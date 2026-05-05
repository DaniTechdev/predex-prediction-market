import { PublicKey } from "@solana/web3.js";

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "https://api.devnet.solana.com";

export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? "devnet") as
  | "devnet"
  | "mainnet-beta"
  | "testnet";

export const PROGRAM_ID = new PublicKey(
  "C9v9UddDthTPnZRuwmBpkARwJooFrzgGHZ5MzZJYXUGb",
);

export const USDC_MINT = new PublicKey(
  "3VWGZuhBq23QoCvYquJ7JNRC1XfN7b12KLWCWJgiD3My",
);

export const USDC_DECIMALS = 6;
export const SHARE_DECIMALS = 6;
export const PRICE_SCALE = 1_000_000;

export const SITE = {
  name: "Predex",
  tagline: "AI-assisted prediction markets on Solana",
  description:
    "Trade YES/NO outcomes on real-world events. Settled in USDC, priced by an on-chain AMM, augmented with AI confidence signals.",
};

export const explorerUrl = (
  address: string,
  kind: "address" | "tx" = "address",
) => {
  const base = "https://explorer.solana.com";
  const cluster = NETWORK === "mainnet-beta" ? "" : `?cluster=${NETWORK}`;
  return `${base}/${kind}/${address}${cluster}`;
};
