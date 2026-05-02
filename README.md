# PREDEx - AI-Powered Prediction Market on Solana

PREDEx is a decentralized prediction market platform where users trade YES/NO shares on real-world outcomes using USDC stablecoins.

## Features

- 📊 Create and trade on any prediction market
- 🤖 AI-powered probability estimates and insights
- 💰 Trade with USDC stablecoins
- 📈 Real-time price updates via AMM
- 🎯 Earn rewards for accurate predictions

## Tech Stack

- **Blockchain:** Solana
- **Framework:** Anchor (Rust)
- **Frontend:** Next.js + TypeScript
- **Tokens:** USDC

## Smart Contract Functions

- `create_market` - Create new prediction market
- `buy_shares` - Purchase YES/NO shares
- `sell_shares` - Sell existing shares
- `resolve_market` - Admin resolves outcome
- `claim_winnings` - Claim payouts from winning bets

## Development

### Prerequisites
- Rust
- Solana CLI
- Anchor
- Node.js

### Build
```bash
anchor build# predex-prediction-market
# predex-prediction-market
