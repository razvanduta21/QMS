use anchor_lang::prelude::*;

#[error_code]
pub enum QmsError {
  #[msg("Invalid treasury account.")]
  InvalidTreasury,
  #[msg("Fee must be greater than zero.")]
  InvalidFee,
  #[msg("Mint-to owner does not match provided mint_to.")]
  InvalidMintToOwner,
  #[msg("Invalid associated token account address.")]
  InvalidATA,
  #[msg("Initial supply must be greater than zero.")]
  InvalidSupply,
  #[msg("Decimals must be between 0 and 9.")]
  InvalidDecimals,
  #[msg("Insufficient funds to cover fee and rent.")]
  InsufficientFunds,
  #[msg("Unauthorized admin.")]
  Unauthorized,
  #[msg("Math overflow.")]
  MathOverflow,
  #[msg("PDA derivation failed.")]
  PdaDerivationError,
  #[msg("Invalid metadata PDA.")]
  InvalidMetadataPda,
  #[msg("Invalid metadata URI.")]
  InvalidMetadataUri,
  #[msg("Metadata name too long.")]
  InvalidMetadataName,
  #[msg("Metadata symbol too long.")]
  InvalidMetadataSymbol,
  #[msg("Update authority account mismatch.")]
  InvalidUpdateAuthority,
}
