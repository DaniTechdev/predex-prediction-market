use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MarketPool {
    pub market: Pubkey,
    pub yes_shares: u64,       // outstanding YES shares (1e6-scaled micro-shares)
    pub no_shares: u64,
    pub liquidity_usdc: u64,   // USDC currently in the pool vault (6 decimals)
    pub last_price_yes: u64,   // 1e6-scaled
    pub last_price_no: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

/// Virtual depth added to each side so prices never collapse to 0 when one
/// side has no real shares yet. Prevents the bootstrap dead-end where buying
/// the empty side returns 0 shares.
pub const VIRTUAL_LIQUIDITY: u64 = 1_000_000;

impl MarketPool {
    pub fn calculate_price(&self, outcome: u8) -> u64 {
        let virtual_yes = self.yes_shares.saturating_add(VIRTUAL_LIQUIDITY);
        let virtual_no = self.no_shares.saturating_add(VIRTUAL_LIQUIDITY);
        let total = virtual_yes.saturating_add(virtual_no);
        match outcome {
            0 => ((virtual_yes as u128) * 1_000_000 / (total as u128)) as u64,
            1 => ((virtual_no as u128) * 1_000_000 / (total as u128)) as u64,
            _ => 0,
        }
    }

    pub fn calculate_shares_from_usdc(&self, usdc_amount: u64, outcome: u8) -> u64 {
        let price = self.calculate_price(outcome);
        if price == 0 {
            return 0;
        }
        ((usdc_amount as u128) * 1_000_000 / (price as u128)) as u64
    }

    pub fn calculate_cost(&self, shares: u64, outcome: u8) -> u64 {
        let price = self.calculate_price(outcome);
        ((shares as u128) * (price as u128) / 1_000_000) as u64
    }
}
