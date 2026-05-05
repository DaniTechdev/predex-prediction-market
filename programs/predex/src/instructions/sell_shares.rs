use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::CustomError;
use crate::state::{Market, MarketPool, Position};

#[derive(Accounts)]
#[instruction(outcome: u8, amount: u64)]
pub struct SellShares<'info> {
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
        mut,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump = position.bump,
        constraint = position.user == user.key() @ CustomError::Unauthorized
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

pub fn handler(ctx: Context<SellShares>, outcome: u8, amount: u64) -> Result<()> {
    require!(outcome == 0 || outcome == 1, CustomError::InvalidOutcome);
    require!(amount > 0, CustomError::InvalidAmount);

    let clock_ts = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.market.is_active(clock_ts),
        CustomError::MarketNotActive
    );

    let user_shares = match outcome {
        0 => ctx.accounts.position.yes_amount,
        1 => ctx.accounts.position.no_amount,
        _ => 0,
    };
    require!(user_shares >= amount, CustomError::InsufficientShares);

    let usdc_out = ctx.accounts.pool.calculate_cost(amount, outcome);
    require!(usdc_out > 0, CustomError::InsufficientLiquidity);
    require!(
        ctx.accounts.pool.liquidity_usdc >= usdc_out,
        CustomError::InsufficientLiquidity
    );

    let market_key = ctx.accounts.market.key();
    let pool_bump = ctx.accounts.pool.bump;

    {
        let pool = &mut ctx.accounts.pool;
        match outcome {
            0 => pool.yes_shares = pool.yes_shares.saturating_sub(amount),
            1 => pool.no_shares = pool.no_shares.saturating_sub(amount),
            _ => {}
        }
        pool.liquidity_usdc = pool.liquidity_usdc.saturating_sub(usdc_out);
        pool.last_price_yes = pool.calculate_price(0);
        pool.last_price_no = pool.calculate_price(1);
    }

    {
        let position = &mut ctx.accounts.position;
        match outcome {
            0 => {
                let proportion_spent = ((amount as u128)
                    * (position.total_spent_yes as u128)
                    / (user_shares as u128)) as u64;
                position.yes_amount = position.yes_amount.saturating_sub(amount);
                position.total_spent_yes =
                    position.total_spent_yes.saturating_sub(proportion_spent);
            }
            1 => {
                let proportion_spent = ((amount as u128)
                    * (position.total_spent_no as u128)
                    / (user_shares as u128)) as u64;
                position.no_amount = position.no_amount.saturating_sub(amount);
                position.total_spent_no =
                    position.total_spent_no.saturating_sub(proportion_spent);
            }
            _ => {}
        }
        position.last_updated = clock_ts;
    }

    {
        let market = &mut ctx.accounts.market;
        market.total_volume = market.total_volume.saturating_add(usdc_out);
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
    token::transfer(cpi_ctx, usdc_out)?;

    Ok(())
}
