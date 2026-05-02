use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Market, MarketPool, Position};

#[derive(Accounts)]
#[instruction(outcome: u8, amount: u64)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        constraint = market.is_active(Clock::get()?.unix_timestamp)
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, MarketPool>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    
    #[account(
        mut,
        constraint = user_usdc_account.owner == user.key()
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = pool_usdc_vault.owner == program_id
    )]
    pub pool_usdc_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BuyShares>, outcome: u8, amount: u64) -> Result<()> {
    require!(outcome == 0 || outcome == 1, ErrorCode::InvalidOutcome);
    require!(amount > 0, ErrorCode::InvalidAmount);
    
    let pool = &mut ctx.accounts.pool;
    let position = &mut ctx.accounts.position;
    let clock = Clock::get()?;
    
    // Calculate shares to mint
    let shares = pool.calculate_shares_from_usdc(amount, outcome);
    require!(shares > 0, ErrorCode::InsufficientLiquidity);
    
    // Update pool based on outcome
    match outcome {
        0 => {
            pool.yes_shares += shares;
            pool.last_price_yes = pool.calculate_price(0);
        }
        1 => {
            pool.no_shares += shares;
            pool.last_price_no = pool.calculate_price(1);
        }
        _ => {}
    }
    pool.liquidity_usdc += amount;
    
    // Update user position
    if position.user == Pubkey::default() {
        position.user = ctx.accounts.user.key();
        position.market = ctx.accounts.market.key();
        position.yes_amount = 0;
        position.no_amount = 0;
        position.total_spent_yes = 0;
        position.total_spent_no = 0;
    }
    
    match outcome {
        0 => {
            position.yes_amount += shares;
            position.total_spent_yes += amount;
        }
        1 => {
            position.no_amount += shares;
            position.total_spent_no += amount;
        }
        _ => {}
    }
    position.last_updated = clock.unix_timestamp;
    
    // Transfer USDC from user to pool vault
    let transfer_instruction = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.pool_usdc_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_instruction);
    token::transfer(cpi_ctx, amount)?;
    
    // Update market volume
    let market = &mut ctx.accounts.market;
    market.total_volume += amount;
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Outcome must be 0 (YES) or 1 (NO)")]
    InvalidOutcome,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Not enough liquidity in pool")]
    InsufficientLiquidity,
}