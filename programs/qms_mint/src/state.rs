use anchor_lang::prelude::*;

#[account]
pub struct Config {
  pub admin: Pubkey,
  pub treasury: Pubkey,
  pub fee_lamports: u64,
  pub bump: u8,
}

impl Config {
  pub const LEN: usize = 32 + 32 + 8 + 1;
}
