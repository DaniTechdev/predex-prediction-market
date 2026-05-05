use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Question exceeds 200 characters")]
    QuestionTooLong,
    #[msg("End time must be in the future")]
    EndTimeInPast,
    #[msg("Probability must be between 0 and 100")]
    InvalidProbability,
    #[msg("Confidence score must be between 0 and 100")]
    InvalidConfidence,
    #[msg("AI recommendation must be 0=BUY_YES, 1=BUY_NO, or 2=HOLD")]
    InvalidRecommendation,
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market has not been resolved")]
    MarketNotResolved,
    #[msg("Insufficient shares to sell")]
    InsufficientShares,
    #[msg("Market is still active")]
    MarketStillActive,
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Already claimed winnings")]
    AlreadyClaimed,
    #[msg("Invalid outcome (must be 0=YES or 1=NO)")]
    InvalidOutcome,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
    #[msg("Not enough liquidity in pool")]
    InsufficientLiquidity,
    #[msg("Nothing to claim")]
    NothingToClaim,
}
