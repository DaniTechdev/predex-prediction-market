use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Market, MarketPool, AiMetadata};

#[derive(Accounts)]
#[instruction(question: String, end_time: i64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", creator.key().as_ref(), &market_count.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + MarketPool::INIT_SPACE,
        seeds = [b"pool", market.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, MarketPool>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + AiMetadata::INIT_SPACE,
        seeds = [b"ai", market.key().as_ref()],
        bump
    )]
    pub ai_metadata: Account<'info, AiMetadata>,
    
    #[account(
        mut,
        constraint = creator_usdc_account.owner == creator.key()
    )]
    pub creator_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = pool_usdc_vault.owner == program_id
    )]
    pub pool_usdc_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateMarket>,
    question: String,
    end_time: i64,
    initial_probability: u8,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let pool = &mut ctx.accounts.pool;
    let ai = &mut ctx.accounts.ai_metadata;
    let clock = Clock::get()?;
    
    // Validation
    require!(question.len() <= 200, ErrorCode::QuestionTooLong);
    require!(end_time > clock.unix_timestamp, ErrorCode::InvalidEndTime);
    require!(initial_probability <= 100, ErrorCode::InvalidProbability);
    
    // Initialize Market
    market.id = market_count;
    market.creator = ctx.accounts.creator.key();
    market.question = question;
    market.end_time = end_time;
    market.resolved = false;
    market.winning_outcome = 2; // INVALID default
    market.total_volume = 0;
    market.created_at = clock.unix_timestamp;
    
    // Initialize Pool
    pool.market = market.key();
    pool.yes_shares = 0;
    pool.no_shares = 0;
    pool.liquidity_usdc = 0;
    pool.last_price_yes = 500_000; // 0.5 USDC initial
    pool.last_price_no = 500_000;
    
    // Initialize AI Metadata
    ai.market = market.key();
    ai.initial_probability = initial_probability;
    ai.current_probability = initial_probability;
    ai.confidence_score = 70; // Default
    ai.sentiment = 0;
    ai.last_updated = clock.unix_timestamp;
    ai.ai_recommendation = 2; // HOLD
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Question exceeds 200 characters")]
    QuestionTooLong,
    #[msg("End time must be in the future")]
    InvalidEndTime,
    #[msg("Probability must be between 0 and 100")]
    InvalidProbability,
}