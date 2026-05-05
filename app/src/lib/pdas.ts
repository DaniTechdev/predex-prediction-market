import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./config";

const enc = (s: string) => new TextEncoder().encode(s);

export const marketPda = (creator: PublicKey, marketId: BN) =>
  PublicKey.findProgramAddressSync(
    [enc("market"), creator.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID,
  )[0];

export const poolPda = (market: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc("pool"), market.toBuffer()],
    PROGRAM_ID,
  )[0];

export const positionPda = (user: PublicKey, market: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc("position"), user.toBuffer(), market.toBuffer()],
    PROGRAM_ID,
  )[0];

export const aiMetadataPda = (market: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc("ai"), market.toBuffer()],
    PROGRAM_ID,
  )[0];

export const vaultPda = (market: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [enc("vault"), market.toBuffer()],
    PROGRAM_ID,
  )[0];

export const allMarketPdas = (creator: PublicKey, marketId: BN) => {
  const market = marketPda(creator, marketId);
  return {
    market,
    pool: poolPda(market),
    position: (user: PublicKey) => positionPda(user, market),
    aiMetadata: aiMetadataPda(market),
    vault: vaultPda(market),
  };
};
