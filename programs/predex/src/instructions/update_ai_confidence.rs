use anchor_lang::prelude::*;

use crate::errors::CustomError;
use crate::state::{AiMetadata, Market};

#[derive(Accounts)]
pub struct UpdateAiConfidence<'info> {
    #[account(has_one = creator @ CustomError::Unauthorized)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"ai", market.key().as_ref()],
        bump = ai_metadata.bump
    )]
    pub ai_metadata: Account<'info, AiMetadata>,

    pub creator: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateAiConfidence>,
    confidence_score: u8,
    new_probability: u8,
    sentiment: i8,
    ai_recommendation: u8,
) -> Result<()> {
    require!(confidence_score <= 100, CustomError::InvalidConfidence);
    require!(new_probability <= 100, CustomError::InvalidProbability);
    require!(ai_recommendation <= 2, CustomError::InvalidRecommendation);

    let ai = &mut ctx.accounts.ai_metadata;
    ai.confidence_score = confidence_score;
    ai.current_probability = new_probability;
    ai.sentiment = sentiment;
    ai.ai_recommendation = ai_recommendation;
    ai.last_updated = Clock::get()?.unix_timestamp;

    Ok(())
}
