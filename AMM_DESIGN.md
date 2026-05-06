# Predex — AMM and Liquidity Design

A reference for understanding how the current AMM works, why it's solvent, the
known flaw, and the production-grade alternatives.

---

## How the current Predex AMM works

It's two systems stitched together.

### Layer 1: Pricing (during trading)

Constant-sum-with-virtual-liquidity formula:

```
total = yes_shares + no_shares + 2 × VIRTUAL_LIQUIDITY
price_yes = (yes_shares + VIRTUAL_LIQUIDITY) / total      // 0..1
price_no  = 1 - price_yes
```

- `VIRTUAL_LIQUIDITY = 1_000_000` is bootstrap depth so the empty side never
  has price 0.
- **Buy** $X of YES → mints `X / price_yes` YES shares, USDC goes to the vault.
- **Sell** Y shares of YES → returns `Y × price_yes` USDC, shares burn.

### Layer 2: Resolution payout (after the market resolves)

Pari-mutuel proportional split:

```
your_payout = your_winning_shares / total_winning_shares × pool.liquidity_usdc
```

---

## Player vs player or player vs house?

**Pure player vs player.** Predex is never the counterparty. There is no
"house" taking the other side of bets. The protocol is just:

1. A custodian (USDC sits in the pool vault PDA)
2. A pricing engine (the AMM math)
3. A resolver (creator flips the `winning_outcome` bit)

Winners take what losers paid in, proportionally. The protocol's worst-case
payout obligation is exactly equal to what's been deposited.

---

## Can players win in a way we can't pay out?

For **resolution payouts** — *no, mathematically impossible*. Proof:

```
Sum of all winning payouts
  = Σ (user_winning_shares / total_winning_shares × pool.liquidity_usdc)
  = (Σ user_winning_shares / total_winning_shares) × pool.liquidity_usdc
  = pool.liquidity_usdc
```

The pool can never owe more than it holds. Insolvency at resolution is
impossible by construction.

---

## But the system has a real flaw — the sell mechanic

The buy/sell layer uses the **spot price after each trade** rather than a
true bonding curve. Concrete trace:

1. Pool empty. Alice buys $100 of YES at price 0.5 → gets 200 shares. Pool
   has $100, price moves to ~0.99.
2. Alice tries to sell those 200 shares at 0.99 → would need to pay her $198
   from a $100 pool. **The contract refuses** (insufficient liquidity check),
   so no actual drain.
3. But this means in many states, **Alice cannot sell all her shares
   mid-market** even though the displayed price says she could. UX problem,
   not a solvency problem.

Summary:

- ✅ Resolution: provably solvent
- ⚠️ Mid-market exit: may fail with `InsufficientLiquidity` despite shown prices

---

## The four real options for production

| Option | What it is | Solvent? | Complexity | Capital efficient |
|---|---|---|---|---|
| **A. Pure pari-mutuel, no mid-market sell** | Drop the sell instruction. Buy in, wait for resolution, claim. | ✅ Always | Lowest | Medium |
| **B. CPMM / FPAMM (Polymarket-style)** | Pool holds equal YES+NO inventory. Trades use constant product (yes × no = k). LPs deposit USDC and mint YES+NO 1:1. | ✅ Always | Medium-high | Highest |
| **C. LMSR (Augur-style)** | Cost-function-based, smooth pricing curve. | ✅ With subsidy | High | Medium |
| **D. Keep current + fix sell** | Replace spot-price sell with a proper bonding-curve sell that conserves an invariant. | ✅ Always | Medium | Medium |

---

## Recommendation for production

**Option B (CPMM)** is what real money uses — it's what Polymarket runs in
production at scale, it's well-audited mathematics, it's capital-efficient,
and it gives you LP incentive design later (LPs earn fees, can deposit /
withdraw). Predex would map cleanly onto it:

- Replace `MarketPool { yes_shares, no_shares, liquidity_usdc }` with
  `{ yes_reserve, no_reserve, k_invariant }`
- `create_market` seeds the pool by depositing X USDC, mints X YES + X NO
  into the pool reserves (price = 0.5/0.5)
- Buy YES with $D: pull $D into pool, mint D YES + D NO, then swap that D NO
  out of the pool's NO reserve into more YES out of the pool's YES reserve,
  holding `yes_reserve × no_reserve = k`. User receives the swapped-out YES.
- Sell YES: reverse — user deposits YES, swap reduces YES reserve, increases
  NO, user receives matching $D
- Resolution: winning side's tokens redeemable 1:1 for USDC; pool's
  losing-side tokens become worthless

**Option A** is the safe minimum: it's what we already mostly have. Strip the
sell instruction, force "buy and wait." Solvent by construction, simplest
mental model, but no exit liquidity for traders.

---

## Concrete path forward

1. **Now (devnet, investor demo):** keep what we have. The flaws don't show
   in light usage and the design *is* fundamentally solvent at resolution.
2. **Before mainnet:** rewrite the AMM to Option B (CPMM/FPAMM). Roughly a
   200–300 line program rewrite plus updated frontend math. Adds LP support
   as a bonus.
3. **Before scale:** add a 1–3% trading fee that goes to LPs. This is the
   sustainability and revenue model.
