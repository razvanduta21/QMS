use anchor_lang::prelude::*;

#[event]
pub struct MintCreated {
  pub payer: Pubkey,
  pub mint: Pubkey,
  pub destination_owner: Pubkey,
  pub destination_ata: Pubkey,
  pub decimals: u8,
  pub initial_supply: u64,
  pub fee_lamports: u64,
  pub treasury: Pubkey,
  pub final_mint_authority: Option<Pubkey>,
  pub final_freeze_authority: Option<Pubkey>,
  pub client_ref: Option<[u8; 16]>,
  pub metadata_pda: Option<Pubkey>,
  pub metadata_uri: Option<String>,
  pub update_authority: Option<Pubkey>,
}
