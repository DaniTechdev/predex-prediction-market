use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MarketPool {
    pub market: Pubkey,
    pub yes_shares: u64,      // Total YES shares outstanding
    pub no_shares: u64,       // Total NO shares outstanding
    pub liquidity_usdc: u64,   // USDC in pool
    pub last_price_yes: u64,   // Scaled by 10^6 (USDC decimals)
    pub last_price_no: u64,
}

impl MarketPool {
    // Simple ratio-based AMM
    pub fn calculate_price(&self, outcome: u8) -> u64 {
        let total_shares = self.yes_shares + self.no_shares;
        if total_shares == 0 {
            return 500_000; // 0.5 USDC default (scaled)
        }
        
        match outcome {
            0 => (self.yes_shares * 1_000_000) / total_shares, // YES price
            1 => (self.no_shares * 1_000_000) / total_shares,  // NO price
            _ => 0,
        }
    }
    
    // Calculate how many shares user gets for amount USDC
    pub fn calculate_shares_from_usdc(&self, usdc_amount: u64, outcome: u8) -> u64 {
        let price = self.calculate_price(outcome);
        if price == 0 {
            return usdc_amount * 1_000_000; // Fallback, should not happen
        }
        (usdc_amount * 1_000_000) / price
    }
    
    // Calculate USDC needed to buy shares
    pub fn calculate_cost(&self, shares: u64, outcome: u8) -> u64 {
        let price = self.calculate_price(outcome);
        (shares * price) / 1_000_000
    }
}