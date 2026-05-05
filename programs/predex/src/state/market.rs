use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub id: u64,
    pub creator: Pubkey,
    #[max_len(200)]
    pub question: String,
    pub end_time: i64,
    pub resolved: bool,
    pub winning_outcome: u8,   // 0=YES, 1=NO, 2=INVALID/unresolved
    pub total_volume: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl Market {
    pub const MAX_QUESTION_LEN: usize = 200;

    pub fn is_active(&self, current_time: i64) -> bool {
        !self.resolved && current_time < self.end_time
    }

    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time >= self.end_time
    }
}
