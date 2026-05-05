use anchor_lang::prelude::*;

use super::pool::MarketPool;

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub user: Pubkey,
    pub market: Pubkey,
    pub yes_amount: u64,
    pub no_amount: u64,
    pub total_spent_yes: u64,
    pub total_spent_no: u64,
    pub claimed: bool,
    pub last_updated: i64,
    pub bump: u8,
}

impl Position {
    /// Proportional payout: user_winning_shares / total_winning_shares × pot.
    pub fn get_payout(&self, winning_outcome: u8, pool: &MarketPool) -> u64 {
        let (winning_user_shares, total_winning_shares) = match winning_outcome {
            0 => (self.yes_amount, pool.yes_shares),
            1 => (self.no_amount, pool.no_shares),
            _ => return 0,
        };
        if total_winning_shares == 0 || winning_user_shares == 0 {
            return 0;
        }
        ((winning_user_shares as u128) * (pool.liquidity_usdc as u128)
            / (total_winning_shares as u128)) as u64
    }

    pub fn get_avg_price_yes(&self) -> u64 {
        if self.yes_amount == 0 {
            return 0;
        }
        ((self.total_spent_yes as u128) * 1_000_000 / (self.yes_amount as u128)) as u64
    }

    pub fn get_avg_price_no(&self) -> u64 {
        if self.no_amount == 0 {
            return 0;
        }
        ((self.total_spent_no as u128) * 1_000_000 / (self.no_amount as u128)) as u64
    }
}
