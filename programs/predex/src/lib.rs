// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// declare_id!("C9v9UddDthTPnZRuwmBpkARwJooFrzgGHZ5MzZJYXUGb");

// pub mod state;
// pub mod instructions;

// pub use instructions::*;

// #[program]
// pub mod predex {
//     use super::*;

//     pub fn create_market(
//         ctx: Context<CreateMarket>,
//         question: String,
//         end_time: i64,
//         initial_probability: u8,
//     ) -> Result<()> {
//         instructions::create_market::handler(ctx, question, end_time, initial_probability)
//     }

//     pub fn buy_shares(
//         ctx: Context<BuyShares>,
//         outcome: u8, // 0 = YES, 1 = NO
//         amount: u64, // USDC amount
//     ) -> Result<()> {
//         instructions::buy_shares::handler(ctx, outcome, amount)
//     }

//     pub fn sell_shares(
//         ctx: Context<SellShares>,
//         outcome: u8,
//         amount: u64, // Number of shares to sell
//     ) -> Result<()> {
//         instructions::sell_shares::handler(ctx, outcome, amount)
//     }

//     pub fn resolve_market(
//         ctx: Context<ResolveMarket>,
//         winning_outcome: u8,
//     ) -> Result<()> {
//         instructions::resolve_market::handler(ctx, winning_outcome)
//     }

//     pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
//         instructions::claim_winnings::handler(ctx)
//     }

//     pub fn update_ai_confidence(
//         ctx: Context<UpdateAiConfidence>,
//         confidence_score: u8,
//         new_probability: u8,
//     ) -> Result<()> {
//         instructions::update_ai_confidence::handler(ctx, confidence_score, new_probability)
//     }
// }

