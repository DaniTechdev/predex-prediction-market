"use client";

import { Program, BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import type { Predex } from "@/lib/idl/predex";
import { USDC_MINT } from "@/lib/config";
import {
  aiMetadataPda,
  marketPda,
  poolPda,
  positionPda,
  vaultPda,
} from "@/lib/pdas";

export interface CreateMarketArgs {
  marketId: BN;
  question: string;
  endTime: BN;
  initialProbability: number;
}

export async function createMarket(
  program: Program<Predex>,
  creator: PublicKey,
  args: CreateMarketArgs,
) {
  const market = marketPda(creator, args.marketId);
  return program.methods
    .createMarket(args.marketId, args.question, args.endTime, args.initialProbability)
    .accounts({
      creator,
      market,
      pool: poolPda(market),
      aiMetadata: aiMetadataPda(market),
      usdcMint: USDC_MINT,
      poolUsdcVault: vaultPda(market),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    } as never)
    .rpc();
}

const ensureUserUsdcAtaIx = (user: PublicKey): TransactionInstruction => {
  const ata = getAssociatedTokenAddressSync(USDC_MINT, user);
  return createAssociatedTokenAccountIdempotentInstruction(user, ata, user, USDC_MINT);
};

export async function buyShares(
  program: Program<Predex>,
  user: PublicKey,
  market: PublicKey,
  outcome: 0 | 1,
  amountUsdcRaw: BN,
) {
  const userUsdc = getAssociatedTokenAddressSync(USDC_MINT, user);
  return program.methods
    .buyShares(outcome, amountUsdcRaw)
    .accounts({
      user,
      market,
      pool: poolPda(market),
      position: positionPda(user, market),
      userUsdcAccount: userUsdc,
      poolUsdcVault: vaultPda(market),
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    } as never)
    .preInstructions([ensureUserUsdcAtaIx(user)])
    .rpc();
}

export async function sellShares(
  program: Program<Predex>,
  user: PublicKey,
  market: PublicKey,
  outcome: 0 | 1,
  amountSharesRaw: BN,
) {
  const userUsdc = getAssociatedTokenAddressSync(USDC_MINT, user);
  return program.methods
    .sellShares(outcome, amountSharesRaw)
    .accounts({
      user,
      market,
      pool: poolPda(market),
      position: positionPda(user, market),
      userUsdcAccount: userUsdc,
      poolUsdcVault: vaultPda(market),
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .preInstructions([ensureUserUsdcAtaIx(user)])
    .rpc();
}

export async function claimWinnings(
  program: Program<Predex>,
  user: PublicKey,
  market: PublicKey,
) {
  const userUsdc = getAssociatedTokenAddressSync(USDC_MINT, user);
  return program.methods
    .claimWinnings()
    .accounts({
      user,
      market,
      pool: poolPda(market),
      position: positionPda(user, market),
      userUsdcAccount: userUsdc,
      poolUsdcVault: vaultPda(market),
      tokenProgram: TOKEN_PROGRAM_ID,
    } as never)
    .preInstructions([ensureUserUsdcAtaIx(user)])
    .rpc();
}

export async function resolveMarket(
  program: Program<Predex>,
  creator: PublicKey,
  market: PublicKey,
  winningOutcome: 0 | 1,
) {
  return program.methods
    .resolveMarket(winningOutcome)
    .accounts({ market, creator } as never)
    .rpc();
}

export async function updateAiConfidence(
  program: Program<Predex>,
  creator: PublicKey,
  market: PublicKey,
  args: {
    confidenceScore: number;
    newProbability: number;
    sentiment: number;
    aiRecommendation: 0 | 1 | 2;
  },
) {
  return program.methods
    .updateAiConfidence(
      args.confidenceScore,
      args.newProbability,
      args.sentiment,
      args.aiRecommendation,
    )
    .accounts({
      market,
      aiMetadata: aiMetadataPda(market),
      creator,
    } as never)
    .rpc();
}

export const newMarketId = (): BN => new BN(Date.now());
