# Predex — Data Structure & Progress

A decentralized YES/NO prediction market on Solana, with USDC trading and AI-assisted probability updates.

---

## 1. Data Structure (on-chain)

### 1.1 Accounts

| Account        | Purpose                                                | PDA seeds                                         |
| -------------- | ------------------------------------------------------ | ------------------------------------------------- |
| `Market`       | Market metadata: question, end_time, resolution state. | `["market", creator, market_id_le_bytes]`         |
| `MarketPool`   | Share supply + AMM price state.                        | `["pool", market]`                                |
| `Position`     | Per-user share holdings + cost basis.                  | `["position", user, market]`                      |
| `AiMetadata`   | Probability + AI confidence + sentiment.               | `["ai", market]`                                  |
| `PoolVault`    | SPL Token account holding USDC. Authority = pool PDA.  | `["vault", market]` (owned by SPL-Token program)  |
| `Config` *(optional)* | Global counter for `market_id`, fee recipient. | `["config"]`                                     |

> The current code uses a free Rust variable `market_count` in PDA seeds — this is not valid. We need either (a) a `Config` account with a counter, or (b) accept `market_id: u64` as an instruction argument and derive the PDA from that.

### 1.2 Field layouts

```rust
#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub question: String,
    pub end_time: i64,
    pub resolved: bool,
    pub winning_outcome: u8,   // 0 = YES, 1 = NO, 2 = INVALID/unresolved
    pub total_volume: u64,     // total USDC traded (6 decimals)
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct MarketPool {
    pub market: Pubkey,
    pub yes_shares: u64,       // share counts in micro-shares (1e6 scale)
    pub no_shares: u64,
    pub liquidity_usdc: u64,   // total USDC currently in vault
    pub last_price_yes: u64,   // scaled 1e6 (so 0.65 USDC -> 650_000)
    pub last_price_no: u64,
    pub vault_bump: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub user: Pubkey,
    pub market: Pubkey,
    pub yes_amount: u64,       // micro-shares
    pub no_amount: u64,
    pub total_spent_yes: u64,  // USDC, 6 decimals
    pub total_spent_no: u64,
    pub claimed: bool,
    pub last_updated: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AiMetadata {
    pub market: Pubkey,
    pub initial_probability: u8,  // 0-100
    pub current_probability: u8,
    pub confidence_score: u8,
    pub sentiment: i8,            // -100..100
    pub last_updated: i64,
    pub ai_recommendation: u8,    // 0=BUY_YES, 1=BUY_NO, 2=HOLD
    pub bump: u8,
}
```

### 1.3 Instructions

| Ix                       | Signer       | Effect                                                                                |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------- |
| `initialize_config`      | admin        | Creates `Config { next_market_id }`. (Run once.)                                      |
| `create_market`          | creator      | Inits Market + Pool + Vault + AiMetadata. Increments config counter.                  |
| `buy_shares`             | user         | Pulls USDC into vault; mints YES or NO shares to Position; updates pool prices.       |
| `sell_shares`            | user         | Burns shares; sends USDC from vault to user.                                          |
| `resolve_market`         | creator      | Sets `winning_outcome`. Requires `now >= end_time && !resolved`.                      |
| `claim_winnings`         | user         | Pays out `winning_shares / total_winning_shares × pot`. Marks `claimed = true`.       |
| `update_ai_confidence`   | oracle/admin | Updates `current_probability` + AI fields.                                            |

### 1.4 AMM math (single source of truth)

Pricing uses simple share-ratio AMM, prices scaled by `1e6`:

```
total = yes_shares + no_shares
price_yes = yes_shares * 1e6 / total      (when total > 0)
price_no  = no_shares  * 1e6 / total
shares_minted = usdc_amount * 1e6 / price_outcome
usdc_returned = shares * price_outcome / 1e6
payout_per_winning_share = liquidity_usdc / winning_total_shares (after resolution)
```

> **Bug to fix:** `Position::get_payout` currently returns raw `yes_amount` (1e6-scaled), which over-pays by 1e6. Replace with the formula above.

---

## 2. Current Status (audit of the repo)

### What exists & works
- ✅ Workspace `Cargo.toml` (root) is correct.
- ✅ `programs/predex/Cargo.toml` already on `anchor-lang 0.30.1` / `anchor-spl 0.30.1` (the brief was wrong — it is **not** `1.0.0`).
- ✅ `state/market.rs`, `state/pool.rs`, `state/position.rs`, `state/ai_metadata.rs` have reasonable starting structs.
- ✅ `instructions/create_market.rs`, `buy_shares.rs`, `claim_winnings.rs` have skeleton handlers.

### What's broken (must fix to compile)
- ❌ `src/state.rs` is empty — but `lib.rs` declares `pub mod state;`. No `state/mod.rs` either, so `state::{Market, MarketPool, ...}` cannot resolve.
- ❌ `src/instructions/` has no `mod.rs` either; `lib.rs` declares `pub mod instructions;` but cannot find children.
- ❌ `instructions/sell_shares.rs` and `instructions/resolve_market.rs` are **empty (0 bytes)**.
- ❌ `instructions/update_ai_confidence.rs` doesn't exist; `lib.rs` calls it.
- ❌ `create_market.rs` references undefined `market_count`.
- ❌ `pool_usdc_vault.owner == program_id` constraint is wrong (TokenAccount.owner is the SPL authority, not Solana program owner). Needs `pool` PDA as authority.
- ❌ `claim_winnings.rs` signs as the pool *data* PDA but tries to transfer from the *vault* token account → need a vault PDA + correct seeds + bump.
- ❌ `Position::get_payout` returns raw share count, overpaying by 1e6×.
- ❌ Test file `tests/test_initialize.rs` imports `litesvm`/`solana-message`/etc. that aren't in `Cargo.toml`, and calls a non-existent `Initialize` instruction.
- ❌ `Anchor.toml` `test` script is `cargo test`; should be the default `yarn run ts-mocha ...` or `anchor test --skip-local-validator`.

### Not started
- ⏹ `update_ai_confidence` handler.
- ⏹ Custom error codes consolidated in one module.
- ⏹ Events (`MarketCreatedEvent`, `SharesBoughtEvent`, …).
- ⏹ TS integration tests (`tests/predex.ts`).
- ⏹ Frontend app/ folder is empty.
- ⏹ Devnet deployment.

---

## 3. Roadmap to Devnet + Frontend

### Phase 1 — Make it compile (program-only)
1. Create `src/state/mod.rs` re-exporting all sub-modules; delete or empty `src/state.rs`.
2. Create `src/instructions/mod.rs` re-exporting all handler modules.
3. Replace `market_count` usage with either a `Config` account or an explicit `market_id: u64` instruction arg. Use the latter — simpler.
4. Implement `sell_shares.rs`, `resolve_market.rs`, `update_ai_confidence.rs`.
5. Add a single `errors.rs` with all `CustomError` variants; remove the per-file duplicate `ErrorCode` enums.
6. Fix vault account: declare a `["vault", market]` PDA token account, set its authority to the pool PDA in `create_market`, and sign with the pool PDA in `claim_winnings`/`sell_shares`.
7. Fix `Position::get_payout` to use the proportional pot formula.
8. `anchor build` cleanly.

### Phase 2 — Tests
9. Delete `programs/predex/tests/test_initialize.rs` (it's litesvm-based and references a missing `Initialize` ix). Replace with a TypeScript suite at `tests/predex.ts` driven by `anchor test`.
10. Cover: create_market happy path, buy/sell, resolve before/after end_time, claim, double-claim guard, ai update.

### Phase 3 — Devnet deploy
11. `solana config set --url https://api.devnet.solana.com`
12. `solana airdrop 2` (might need to retry; faucet rate-limited).
13. Generate a fresh program keypair if needed; update `declare_id!` and `Anchor.toml [programs.devnet]`.
14. Set `[provider] cluster = "devnet"` in `Anchor.toml`.
15. `anchor build && anchor deploy --provider.cluster devnet`.
16. Mint a mock USDC SPL on devnet for testing (`spl-token create-token --decimals 6` + `create-account` + `mint`).

### Phase 4 — Frontend (Next.js + TypeScript in `app/`)
17. Scaffold: `npx create-next-app@latest app --typescript --tailwind --eslint --app`.
18. Install: `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets`, `@solana/spl-token`.
19. Wire wallet adapter + connection provider (devnet).
20. Generate IDL types: `anchor build` produces `target/types/predex.ts` — copy/symlink into `app/lib/idl/`.
21. Pages:
    - `/` — list markets (fetch all `Market` accounts via `program.account.market.all()`).
    - `/market/[pubkey]` — show market detail, buy/sell forms, your position.
    - `/create` — create_market form.
    - `/admin` — resolve + ai update (creator-only buttons).
22. Off-chain: simple Node script or Next API route that polls market questions, calls an LLM, signs `update_ai_confidence` with an oracle keypair.

---

## 4. Sanity Commands

```powershell
# from repo root
anchor clean ; cargo clean
anchor build
anchor test --skip-local-validator     # after Phase 2
anchor deploy --provider.cluster devnet
```

Expected after Phase 1 success: `target/deploy/predex.so`, `target/idl/predex.json`, `target/types/predex.ts`.
