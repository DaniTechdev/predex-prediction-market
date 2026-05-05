use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CustomError;
use crate::state::{Market, MarketPool, Position};

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(constraint = market.resolved @ CustomError::MarketNotResolved)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, MarketPool>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump = position.bump,
        constraint = position.user == user.key() @ CustomError::Unauthorized,
        constraint = !position.claimed @ CustomError::AlreadyClaimed
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
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let winning_outcome = ctx.accounts.market.winning_outcome;
    let market_key = ctx.accounts.market.key();
    let pool_bump = ctx.accounts.pool.bump;

    let payout = ctx
        .accounts
        .position
        .get_payout(winning_outcome, &ctx.accounts.pool);
    require!(payout > 0, CustomError::NothingToClaim);
    require!(
        ctx.accounts.pool.liquidity_usdc >= payout,
        CustomError::InsufficientLiquidity
    );

    {
        let position = &mut ctx.accounts.position;
        position.claimed = true;
    }

    {
        let pool = &mut ctx.accounts.pool;
        pool.liquidity_usdc = pool.liquidity_usdc.saturating_sub(payout);
    }

    let signer_seeds: &[&[&[u8]]] = &[&[b"pool", market_key.as_ref(), &[pool_bump]]];

    let transfer_ix = Transfer {
        from: ctx.accounts.pool_usdc_vault.to_account_info(),
        to: ctx.accounts.user_usdc_account.to_account_info(),
        authority: ctx.accounts.pool.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_ix,
        signer_seeds,
    );
    token::transfer(cpi_ctx, payout)?;

    Ok(())
}
