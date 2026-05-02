use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Market, MarketPool, Position};

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        constraint = market.resolved == true
    )]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [b"pool", market.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, MarketPool>,
    
    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), market.key().as_ref()],
        bump,
        constraint = position.user == user.key()
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
}

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let market = &ctx.accounts.market;
    let pool = &ctx.accounts.pool;
    let position = &ctx.accounts.position;
    
    // Calculate payout
    let payout = position.get_payout(market.winning_outcome, pool);
    require!(payout > 0, ErrorCode::NothingToClaim);
    
    // Zero out position (prevent double claim)
    let position_acc = &mut ctx.accounts.position;
    if market.winning_outcome == 0 {
        position_acc.yes_amount = 0;
        position_acc.total_spent_yes = 0;
    } else if market.winning_outcome == 1 {
        position_acc.no_amount = 0;
        position_acc.total_spent_no = 0;
    }
    
    // Transfer USDC from pool to user
    let transfer_instruction = Transfer {
        from: ctx.accounts.pool_usdc_vault.to_account_info(),
        to: ctx.accounts.user_usdc_account.to_account_info(),
        authority: ctx.accounts.pool_usdc_vault.to_account_info(),
    };
    
    // Pool vault is a PDA, so it signs
    let seeds = &[b"pool", market.key().as_ref(), &[ctx.bumps.pool]];
    let signer = &[&seeds[..]];
    
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        transfer_instruction,
        signer,
    );
    token::transfer(cpi_ctx, payout)?;
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("No winnings to claim")]
    NothingToClaim,
}