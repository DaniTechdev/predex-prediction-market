use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub user: Pubkey,
    pub market: Pubkey,
    pub yes_amount: u64,
    pub no_amount: u64,
    pub total_spent_yes: u64,
    pub total_spent_no: u64,
    pub last_updated: i64,
}

impl Position {
    pub fn get_payout(&self, winning_outcome: u8, pool: &MarketPool) -> u64 {
        match winning_outcome {
            0 => self.yes_amount, // Each YES share = $1
            1 => self.no_amount,
            _ => 0,
        }
    }
    
    pub fn get_avg_price_yes(&self) -> u64 {
        if self.yes_amount == 0 {
            return 0;
        }
        (self.total_spent_yes * 1_000_000) / self.yes_amount
    }
    
    pub fn get_avg_price_no(&self) -> u64 {
        if self.no_amount == 0 {
            return 0;
        }
        (self.total_spent_no * 1_000_000) / self.no_amount
    }
}