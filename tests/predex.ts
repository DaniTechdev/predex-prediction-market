import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";

import { Predex } from "../target/types/predex";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("predex", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.predex as Program<Predex>;

  // The default provider wallet acts as the market creator.
  const creator = (provider.wallet as anchor.Wallet).payer;
  const trader = Keypair.generate();
  const stranger = Keypair.generate();

  let usdcMint: PublicKey;
  let creatorAta: PublicKey;
  let traderAta: PublicKey;
  let strangerAta: PublicKey;

  const usdc = (n: number) => new BN(n).mul(new BN(1_000_000)); // 6 decimals

  const marketPdas = (creatorKey: PublicKey, marketId: BN) => {
    const [market] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), creatorKey.toBuffer(), marketId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), market.toBuffer()],
      program.programId
    );
    const [aiMetadata] = PublicKey.findProgramAddressSync(
      [Buffer.from("ai"), market.toBuffer()],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), market.toBuffer()],
      program.programId
    );
    return { market, pool, aiMetadata, vault };
  };

  const positionPda = (user: PublicKey, market: PublicKey) => {
    const [position] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user.toBuffer(), market.toBuffer()],
      program.programId
    );
    return position;
  };

  before(async () => {
    // Fund secondary signers.
    for (const kp of [trader, stranger]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");
    }

    // Mock USDC mint with 6 decimals, creator is the mint authority.
    usdcMint = await createMint(
      provider.connection,
      creator,
      creator.publicKey,
      null,
      6
    );

    creatorAta = (
      await getOrCreateAssociatedTokenAccount(provider.connection, creator, usdcMint, creator.publicKey)
    ).address;
    traderAta = (
      await getOrCreateAssociatedTokenAccount(provider.connection, creator, usdcMint, trader.publicKey)
    ).address;
    strangerAta = (
      await getOrCreateAssociatedTokenAccount(provider.connection, creator, usdcMint, stranger.publicKey)
    ).address;

    await mintTo(provider.connection, creator, usdcMint, creatorAta, creator, 1_000_000_000); // 1000 USDC
    await mintTo(provider.connection, creator, usdcMint, traderAta, creator, 1_000_000_000);
    await mintTo(provider.connection, creator, usdcMint, strangerAta, creator, 1_000_000_000);
  });

  describe("active market lifecycle", () => {
    const marketId = new BN(1);
    let pdas: ReturnType<typeof marketPdas>;
    const farFutureEnd = new BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour out

    before(() => {
      pdas = marketPdas(creator.publicKey, marketId);
    });

    it("creates a market", async () => {
      await program.methods
        .createMarket(marketId, "Will BTC reach $100k by Dec 2026?", farFutureEnd, 60)
        .accounts({
          creator: creator.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          aiMetadata: pdas.aiMetadata,
          usdcMint,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      const market = await program.account.market.fetch(pdas.market);
      expect(market.id.toNumber()).to.eq(1);
      expect(market.creator.toBase58()).to.eq(creator.publicKey.toBase58());
      expect(market.question).to.eq("Will BTC reach $100k by Dec 2026?");
      expect(market.resolved).to.eq(false);
      expect(market.winningOutcome).to.eq(2);
      expect(market.totalVolume.toNumber()).to.eq(0);

      const ai = await program.account.aiMetadata.fetch(pdas.aiMetadata);
      expect(ai.initialProbability).to.eq(60);
      expect(ai.currentProbability).to.eq(60);

      const pool = await program.account.marketPool.fetch(pdas.pool);
      expect(pool.yesShares.toNumber()).to.eq(0);
      expect(pool.noShares.toNumber()).to.eq(0);
    });

    it("rejects create with end_time in the past", async () => {
      const badId = new BN(99);
      const badPdas = marketPdas(creator.publicKey, badId);
      const past = new BN(Math.floor(Date.now() / 1000) - 10);

      try {
        await program.methods
          .createMarket(badId, "stale market", past, 50)
          .accounts({
            creator: creator.publicKey,
            market: badPdas.market,
            pool: badPdas.pool,
            aiMetadata: badPdas.aiMetadata,
            usdcMint,
            poolUsdcVault: badPdas.vault,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        assert.fail("should have thrown EndTimeInPast");
      } catch (err: any) {
        expect(String(err)).to.include("EndTimeInPast");
      }
    });

    it("trader buys YES shares", async () => {
      const traderPosition = positionPda(trader.publicKey, pdas.market);

      await program.methods
        .buyShares(0, usdc(10))
        .accounts({
          user: trader.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: traderPosition,
          userUsdcAccount: traderAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([trader])
        .rpc();

      const pool = await program.account.marketPool.fetch(pdas.pool);
      expect(pool.yesShares.toNumber()).to.be.greaterThan(0);
      expect(pool.liquidityUsdc.toNumber()).to.eq(10_000_000);

      const pos = await program.account.position.fetch(traderPosition);
      expect(pos.yesAmount.toNumber()).to.be.greaterThan(0);
      expect(pos.totalSpentYes.toNumber()).to.eq(10_000_000);

      const vaultAcc = await getAccount(provider.connection, pdas.vault);
      expect(Number(vaultAcc.amount)).to.eq(10_000_000);
    });

    it("stranger buys NO shares", async () => {
      const strangerPosition = positionPda(stranger.publicKey, pdas.market);

      await program.methods
        .buyShares(1, usdc(10))
        .accounts({
          user: stranger.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: strangerPosition,
          userUsdcAccount: strangerAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([stranger])
        .rpc();

      const pool = await program.account.marketPool.fetch(pdas.pool);
      expect(pool.noShares.toNumber()).to.be.greaterThan(0);
      expect(pool.liquidityUsdc.toNumber()).to.eq(20_000_000);

      const market = await program.account.market.fetch(pdas.market);
      expect(market.totalVolume.toNumber()).to.eq(20_000_000);
    });

    it("rejects buy with invalid outcome", async () => {
      const pos = positionPda(trader.publicKey, pdas.market);
      try {
        await program.methods
          .buyShares(2, usdc(1))
          .accounts({
            user: trader.publicKey,
            market: pdas.market,
            pool: pdas.pool,
            position: pos,
            userUsdcAccount: traderAta,
            poolUsdcVault: pdas.vault,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([trader])
          .rpc();
        assert.fail("should have thrown InvalidOutcome");
      } catch (err: any) {
        expect(String(err)).to.include("InvalidOutcome");
      }
    });

    it("trader sells some YES shares", async () => {
      const traderPosition = positionPda(trader.publicKey, pdas.market);
      const before = await program.account.position.fetch(traderPosition);
      const sellAmt = before.yesAmount.divn(2); // sell half

      await program.methods
        .sellShares(0, sellAmt)
        .accounts({
          user: trader.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: traderPosition,
          userUsdcAccount: traderAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([trader])
        .rpc();

      const after = await program.account.position.fetch(traderPosition);
      expect(after.yesAmount.toNumber()).to.eq(before.yesAmount.sub(sellAmt).toNumber());
    });

    it("creator updates AI confidence", async () => {
      await program.methods
        .updateAiConfidence(85, 70, 25, 0)
        .accounts({
          market: pdas.market,
          aiMetadata: pdas.aiMetadata,
          creator: creator.publicKey,
        })
        .rpc();

      const ai = await program.account.aiMetadata.fetch(pdas.aiMetadata);
      expect(ai.confidenceScore).to.eq(85);
      expect(ai.currentProbability).to.eq(70);
      expect(ai.sentiment).to.eq(25);
      expect(ai.aiRecommendation).to.eq(0);
    });

    it("rejects AI update from non-creator", async () => {
      try {
        await program.methods
          .updateAiConfidence(50, 50, 0, 2)
          .accounts({
            market: pdas.market,
            aiMetadata: pdas.aiMetadata,
            creator: stranger.publicKey,
          })
          .signers([stranger])
          .rpc();
        assert.fail("should have rejected non-creator");
      } catch (err: any) {
        const msg = String(err);
        expect(msg.includes("Unauthorized") || msg.includes("ConstraintHasOne")).to.eq(true);
      }
    });

    it("rejects resolve before end_time", async () => {
      try {
        await program.methods
          .resolveMarket(0)
          .accounts({
            market: pdas.market,
            creator: creator.publicKey,
          })
          .rpc();
        assert.fail("should have thrown MarketStillActive");
      } catch (err: any) {
        expect(String(err)).to.include("MarketStillActive");
      }
    });
  });

  describe("resolution lifecycle", () => {
    const marketId = new BN(2);
    let pdas: ReturnType<typeof marketPdas>;

    before(async () => {
      pdas = marketPdas(creator.publicKey, marketId);
      const shortEnd = new BN(Math.floor(Date.now() / 1000) + 3); // 3 seconds

      await program.methods
        .createMarket(marketId, "Test market for resolution", shortEnd, 50)
        .accounts({
          creator: creator.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          aiMetadata: pdas.aiMetadata,
          usdcMint,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Trader buys YES, stranger buys NO. Trader will be the winner.
      await program.methods
        .buyShares(0, usdc(20))
        .accounts({
          user: trader.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: positionPda(trader.publicKey, pdas.market),
          userUsdcAccount: traderAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([trader])
        .rpc();

      await program.methods
        .buyShares(1, usdc(10))
        .accounts({
          user: stranger.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: positionPda(stranger.publicKey, pdas.market),
          userUsdcAccount: strangerAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([stranger])
        .rpc();

      // Wait for end_time to pass.
      await sleep(5_000);
    });

    it("rejects resolve from non-creator", async () => {
      try {
        await program.methods
          .resolveMarket(0)
          .accounts({
            market: pdas.market,
            creator: stranger.publicKey,
          })
          .signers([stranger])
          .rpc();
        assert.fail("should have rejected non-creator resolve");
      } catch (err: any) {
        const msg = String(err);
        expect(msg.includes("Unauthorized") || msg.includes("ConstraintHasOne")).to.eq(true);
      }
    });

    it("creator resolves market with YES winning", async () => {
      await program.methods
        .resolveMarket(0)
        .accounts({
          market: pdas.market,
          creator: creator.publicKey,
        })
        .rpc();

      const market = await program.account.market.fetch(pdas.market);
      expect(market.resolved).to.eq(true);
      expect(market.winningOutcome).to.eq(0);
    });

    it("rejects double-resolve", async () => {
      try {
        await program.methods
          .resolveMarket(1)
          .accounts({
            market: pdas.market,
            creator: creator.publicKey,
          })
          .rpc();
        assert.fail("should have thrown MarketAlreadyResolved");
      } catch (err: any) {
        expect(String(err)).to.include("MarketAlreadyResolved");
      }
    });

    it("winning trader claims proportional payout", async () => {
      const balBefore = (await getAccount(provider.connection, traderAta)).amount;
      const traderPosition = positionPda(trader.publicKey, pdas.market);

      await program.methods
        .claimWinnings()
        .accounts({
          user: trader.publicKey,
          market: pdas.market,
          pool: pdas.pool,
          position: traderPosition,
          userUsdcAccount: traderAta,
          poolUsdcVault: pdas.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([trader])
        .rpc();

      const balAfter = (await getAccount(provider.connection, traderAta)).amount;
      const gained = Number(balAfter - balBefore);

      // Trader was sole YES holder, total pot was 30 USDC. Should receive ~30 USDC (= 30_000_000).
      expect(gained).to.be.greaterThan(29_000_000);
      expect(gained).to.be.lessThanOrEqual(30_000_000);

      const pos = await program.account.position.fetch(traderPosition);
      expect(pos.claimed).to.eq(true);
    });

    it("rejects double-claim", async () => {
      const traderPosition = positionPda(trader.publicKey, pdas.market);
      try {
        await program.methods
          .claimWinnings()
          .accounts({
            user: trader.publicKey,
            market: pdas.market,
            pool: pdas.pool,
            position: traderPosition,
            userUsdcAccount: traderAta,
            poolUsdcVault: pdas.vault,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([trader])
          .rpc();
        assert.fail("should have thrown AlreadyClaimed");
      } catch (err: any) {
        expect(String(err)).to.include("AlreadyClaimed");
      }
    });

    it("losing user gets nothing on claim attempt", async () => {
      const strangerPosition = positionPda(stranger.publicKey, pdas.market);
      try {
        await program.methods
          .claimWinnings()
          .accounts({
            user: stranger.publicKey,
            market: pdas.market,
            pool: pdas.pool,
            position: strangerPosition,
            userUsdcAccount: strangerAta,
            poolUsdcVault: pdas.vault,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([stranger])
          .rpc();
        assert.fail("should have thrown NothingToClaim");
      } catch (err: any) {
        expect(String(err)).to.include("NothingToClaim");
      }
    });
  });
});
