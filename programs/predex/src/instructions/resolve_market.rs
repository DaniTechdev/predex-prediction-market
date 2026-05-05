use anchor_lang::prelude::*;

use crate::errors::CustomError;
use crate::state::Market;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = creator @ CustomError::Unauthorized
    )]
    pub market: Account<'info, Market>,

    pub creator: Signer<'info>,
}

pub fn handler(ctx: Context<ResolveMarket>, winning_outcome: u8) -> Result<()> {
    require!(
        winning_outcome == 0 || winning_outcome == 1,
        CustomError::InvalidOutcome
    );

    let now = Clock::get()?.unix_timestamp;
    let market = &mut ctx.accounts.market;

    require!(!market.resolved, CustomError::MarketAlreadyResolved);
    require!(market.is_expired(now), CustomError::MarketStillActive);

    market.resolved = true;
    market.winning_outcome = winning_outcome;

    Ok(())
}
