use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::CustomError;
use crate::state::{AiMetadata, Market, MarketPool};

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", creator.key().as_ref(), &market_id.to_le_bytes()],
        bump
    )]
    pub market: Box<Account<'info, Market>>,

    #[account(
        init,
        payer = creator,
        space = 8 + MarketPool::INIT_SPACE,
        seeds = [b"pool", market.key().as_ref()],
        bump
    )]
    pub pool: Box<Account<'info, MarketPool>>,

    #[account(
        init,
        payer = creator,
        space = 8 + AiMetadata::INIT_SPACE,
        seeds = [b"ai", market.key().as_ref()],
        bump
    )]
    pub ai_metadata: Box<Account<'info, AiMetadata>>,

    pub usdc_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = creator,
        seeds = [b"vault", market.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = pool,
    )]
    pub pool_usdc_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateMarket>,
    market_id: u64,
    question: String,
    end_time: i64,
    initial_probability: u8,
) -> Result<()> {
    let clock = Clock::get()?;

    require!(
        question.len() <= Market::MAX_QUESTION_LEN,
        CustomError::QuestionTooLong
    );
    require!(end_time > clock.unix_timestamp, CustomError::EndTimeInPast);
    require!(initial_probability <= 100, CustomError::InvalidProbability);

    let market = &mut ctx.accounts.market;
    market.id = market_id;
    market.creator = ctx.accounts.creator.key();
    market.question = question;
    market.end_time = end_time;
    market.resolved = false;
    market.winning_outcome = 2;
    market.total_volume = 0;
    market.created_at = clock.unix_timestamp;
    market.bump = ctx.bumps.market;

    let pool = &mut ctx.accounts.pool;
    pool.market = market.key();
    pool.yes_shares = 0;
    pool.no_shares = 0;
    pool.liquidity_usdc = 0;
    pool.last_price_yes = 500_000;
    pool.last_price_no = 500_000;
    pool.bump = ctx.bumps.pool;
    pool.vault_bump = ctx.bumps.pool_usdc_vault;

    let ai = &mut ctx.accounts.ai_metadata;
    ai.market = market.key();
    ai.initial_probability = initial_probability;
    ai.current_probability = initial_probability;
    ai.confidence_score = 70;
    ai.sentiment = 0;
    ai.last_updated = clock.unix_timestamp;
    ai.ai_recommendation = 2;
    ai.bump = ctx.bumps.ai_metadata;

    Ok(())
}
