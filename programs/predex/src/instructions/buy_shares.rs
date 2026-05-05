use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CustomError;
use crate::state::{Market, MarketPool, Position};

#[derive(Accounts)]
#[instruction(outcome: u8, amount: u64)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump = pool.bump
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
        seeds = [b"vault", market.key().as_ref()],
        bump = pool.vault_bump
    )]
    pub pool_usdc_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BuyShares>, outcome: u8, amount: u64) -> Result<()> {
    require!(outcome == 0 || outcome == 1, CustomError::InvalidOutcome);
    require!(amount > 0, CustomError::InvalidAmount);

    let clock_ts = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.market.is_active(clock_ts),
        CustomError::MarketNotActive
    );

    let shares = ctx
        .accounts
        .pool
        .calculate_shares_from_usdc(amount, outcome);
    require!(shares > 0, CustomError::InsufficientLiquidity);

    {
        let pool = &mut ctx.accounts.pool;
        match outcome {
            0 => pool.yes_shares = pool.yes_shares.saturating_add(shares),
            1 => pool.no_shares = pool.no_shares.saturating_add(shares),
            _ => {}
        }
        pool.liquidity_usdc = pool.liquidity_usdc.saturating_add(amount);
        pool.last_price_yes = pool.calculate_price(0);
        pool.last_price_no = pool.calculate_price(1);
    }

    {
        let position = &mut ctx.accounts.position;
        if position.user == Pubkey::default() {
            position.user = ctx.accounts.user.key();
            position.market = ctx.accounts.market.key();
            position.yes_amount = 0;
            position.no_amount = 0;
            position.total_spent_yes = 0;
            position.total_spent_no = 0;
            position.claimed = false;
            position.bump = ctx.bumps.position;
        }

        match outcome {
            0 => {
                position.yes_amount = position.yes_amount.saturating_add(shares);
                position.total_spent_yes = position.total_spent_yes.saturating_add(amount);
            }
            1 => {
                position.no_amount = position.no_amount.saturating_add(shares);
                position.total_spent_no = position.total_spent_no.saturating_add(amount);
            }
            _ => {}
        }
        position.last_updated = clock_ts;
    }

    let transfer_ix = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.pool_usdc_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_ix);
    token::transfer(cpi_ctx, amount)?;

    let market = &mut ctx.accounts.market;
    market.total_volume = market.total_volume.saturating_add(amount);

    Ok(())
}
