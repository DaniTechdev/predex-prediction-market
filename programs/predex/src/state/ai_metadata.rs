use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct AiMetadata {
    pub market: Pubkey,
    pub initial_probability: u8,    // 0-100
    pub current_probability: u8,
    pub confidence_score: u8,        // 0-100
    pub sentiment: i8,               // -100 to 100
    pub last_updated: i64,
    pub ai_recommendation: u8,       // 0=BUY_YES, 1=BUY_NO, 2=HOLD
    pub bump: u8,
}
