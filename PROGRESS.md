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

## 2. Current Status

See `DEPLOYMENT.md` for live program/USDC/wallet addresses on devnet.

### Phase 1 — compile-clean program ✅
- `state/mod.rs` and `instructions.rs` re-export sub-modules.
- `market_count` ghost variable replaced with explicit `market_id: u64` ix arg.
- `sell_shares`, `resolve_market`, `update_ai_confidence` handlers implemented.
- All errors consolidated in `errors.rs`.
- Vault is a `["vault", market]` PDA token account with pool PDA as authority;
  `sell_shares` / `claim_winnings` sign with the pool seeds correctly.
- `Position::get_payout` uses the proportional pot formula.
- `MarketPool` has `VIRTUAL_LIQUIDITY` so the empty-side bootstrap works.

### Phase 2 — TypeScript test suite ✅ (local-validator only)
- `tests/predex.ts` covers create / buy / sell / resolve / claim / AI lifecycle,
  plus the negative paths (double-claim, double-resolve, non-creator, end_time).
- `Anchor.toml` test script switched to `ts-mocha`.
- Old `programs/predex/tests/test_initialize.rs` is stale and should be deleted.
- **Not run on devnet** — devnet integration test would pollute on-chain state
  with throwaway markets. We rely on the local-validator suite + frontend
  smoke-testing for end-to-end coverage.

### Phase 3 — Devnet deploy ✅
- Program live at `C9v9UddDthTPnZRuwmBpkARwJooFrzgGHZ5MzZJYXUGb`.
- Mock USDC mint: `3VWGZuhBq23QoCvYquJ7JNRC1XfN7b12KLWCWJgiD3My` (6 decimals).
- `Anchor.toml` `[provider]` flipped to `cluster = "devnet"`.

### Phase 4 — Frontend ✅ v1 shipped
- Next.js 16 + React 19 + Tailwind 4 + TypeScript under `app/`.
- Pages: `/` (markets list + hero), `/create`, `/market/[market]`, `/portfolio`.
- Wallet adapter wired with Phantom, Solflare, and Solana Mobile Wallet
  Adapter — mobile users connect via OS deep-link, not just an extension.
- Anchor program client + React Query for cached on-chain reads.
- `CreatorPanel` (resolve + AI update) auto-renders on the market detail
  page when the connected wallet matches `market.creator` — no separate
  admin route, since the program has no global admin role.

### Not started / next polish
- ⏹ Frontend deploy (Vercel — single command once you're ready).
- ⏹ Better Anchor error parsing in toasts (currently shows raw sim errors).
- ⏹ "Mint test USDC to me" button (shortcut for handing out devnet USDC).
- ⏹ Search / filter / sort on the markets list.
- ⏹ Off-chain AI oracle script (Node/route handler that polls market
  questions, calls an LLM, signs `update_ai_confidence`).
- ⏹ Events (`MarketCreatedEvent`, `SharesBoughtEvent`, …) for clean
  indexer integration.

---

## 3. Permission model (so future-you doesn't get confused)

There is **no global admin role** on Predex.

- **Anyone** with a wallet can call `create_market` on the deployed program.
- The signer of that tx becomes that market's `creator` (stored on the
  `Market` account), and that grants them — and only them — two privileges
  scoped to **that single market**:
  - `resolve_market` (after `end_time`)
  - `update_ai_confidence`
- The frontend's `CreatorPanel` reads `market.creator` and only renders
  resolve / AI-update controls when the connected wallet matches.

So the right mental model is: every market is its own little fiefdom. A
"platform admin dashboard" doesn't exist because there's nothing platform-wide
to administer.

---

## 4. Sanity Commands

```bash
# program
cd ~/solana-projects/predex
anchor clean && cargo clean
anchor build
anchor test --skip-local-validator     # local-validator integration test
anchor deploy --provider.cluster devnet

# frontend (in WSL with Node 20+ via nvm)
cd ~/solana-projects/predex/app
npm run dev
npm run build
```
