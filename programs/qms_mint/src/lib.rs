use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::{self, get_associated_token_address, AssociatedToken};
use anchor_spl::metadata::{self, CreateMetadataAccountsV3};
use anchor_spl::token::{
  self, InitializeMint2, Mint, MintTo, SetAuthority, Token, TokenAccount,
};
use anchor_spl::token::spl_token::instruction::AuthorityType;

mod errors;
mod events;
mod state;

use errors::QmsError;
use events::MintCreated;
use state::Config;

declare_id!("ATGum78vwJBzsnJ6hk8kN8QjEhfoRjT1EFLx3S5K2pJ4");

#[program]
pub mod qms_mint {
  use super::*;

  pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    treasury: Pubkey,
    fee_lamports: u64,
  ) -> Result<()> {
    require!(fee_lamports > 0, QmsError::InvalidFee);
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.treasury = treasury;
    config.fee_lamports = fee_lamports;
    config.bump = ctx.bumps.config;
    Ok(())
  }

  pub fn update_config(
    ctx: Context<UpdateConfig>,
    new_treasury: Pubkey,
    new_fee_lamports: u64,
  ) -> Result<()> {
    require!(new_fee_lamports > 0, QmsError::InvalidFee);
    let config = &mut ctx.accounts.config;
    require_keys_eq!(config.admin, ctx.accounts.admin.key(), QmsError::Unauthorized);
    config.treasury = new_treasury;
    config.fee_lamports = new_fee_lamports;
    Ok(())
  }

  pub fn mint_token(ctx: Context<MintToken>, args: MintTokenArgs) -> Result<()> {
    require!(args.initial_supply > 0, QmsError::InvalidSupply);
    require!(args.decimals <= 9, QmsError::InvalidDecimals);
    require_keys_eq!(
      ctx.accounts.treasury.key(),
      ctx.accounts.config.treasury,
      QmsError::InvalidTreasury
    );
    require_keys_eq!(
      ctx.accounts.destination_owner.key(),
      args.mint_to,
      QmsError::InvalidMintToOwner
    );

    let expected_ata =
      get_associated_token_address(&ctx.accounts.destination_owner.key(), &ctx.accounts.mint.key());
    require_keys_eq!(
      ctx.accounts.destination_ata.key(),
      expected_ata,
      QmsError::InvalidATA
    );

    let rent = Rent::get()?;
    let mint_rent = rent.minimum_balance(Mint::LEN);
    let ata_rent = rent.minimum_balance(TokenAccount::LEN);
    let required = ctx
      .accounts
      .config
      .fee_lamports
      .checked_add(mint_rent)
      .and_then(|v| v.checked_add(ata_rent))
      .ok_or(QmsError::MathOverflow)?;
    let payer_lamports = **ctx.accounts.payer.to_account_info().lamports.borrow();
    require!(payer_lamports >= required, QmsError::InsufficientFunds);

    system_program::transfer(
      CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
          from: ctx.accounts.payer.to_account_info(),
          to: ctx.accounts.treasury.to_account_info(),
        },
      ),
      ctx.accounts.config.fee_lamports,
    )?;

    system_program::create_account(
      CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::CreateAccount {
          from: ctx.accounts.payer.to_account_info(),
          to: ctx.accounts.mint.to_account_info(),
        },
      ),
      mint_rent,
      Mint::LEN as u64,
      &ctx.accounts.token_program.key(),
    )?;

    token::initialize_mint2(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        InitializeMint2 {
          mint: ctx.accounts.mint.to_account_info(),
        },
      ),
      args.decimals,
      &ctx.accounts.program_authority.key(),
      Some(&ctx.accounts.program_authority.key()),
    )?;

    associated_token::create(CpiContext::new(
      ctx.accounts.associated_token_program.to_account_info(),
      associated_token::Create {
        payer: ctx.accounts.payer.to_account_info(),
        associated_token: ctx.accounts.destination_ata.to_account_info(),
        authority: ctx.accounts.destination_owner.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
      },
    ))?;

    let authority_bump = ctx.bumps.program_authority;
    let signer_seeds: &[&[u8]] = &[b"mint-authority", &[authority_bump]];

    token::mint_to(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
          mint: ctx.accounts.mint.to_account_info(),
          to: ctx.accounts.destination_ata.to_account_info(),
          authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      args.initial_supply,
    )?;

    token::set_authority(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
          account_or_mint: ctx.accounts.mint.to_account_info(),
          current_authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      AuthorityType::MintTokens,
      args.final_mint_authority,
    )?;

    token::set_authority(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
          account_or_mint: ctx.accounts.mint.to_account_info(),
          current_authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      AuthorityType::FreezeAccount,
      args.final_freeze_authority,
    )?;

    emit!(MintCreated {
      payer: ctx.accounts.payer.key(),
      mint: ctx.accounts.mint.key(),
      destination_owner: ctx.accounts.destination_owner.key(),
      destination_ata: ctx.accounts.destination_ata.key(),
      decimals: args.decimals,
      initial_supply: args.initial_supply,
      fee_lamports: ctx.accounts.config.fee_lamports,
      treasury: ctx.accounts.treasury.key(),
      final_mint_authority: args.final_mint_authority,
      final_freeze_authority: args.final_freeze_authority,
      client_ref: args.client_ref,
      metadata_pda: None,
      metadata_uri: None,
      update_authority: None,
    });

    Ok(())
  }

  pub fn mint_token_with_metadata(
    ctx: Context<MintTokenWithMetadata>,
    args: MintTokenArgs,
    meta_args: MetadataArgs,
  ) -> Result<()> {
    require!(args.initial_supply > 0, QmsError::InvalidSupply);
    require!(args.decimals <= 9, QmsError::InvalidDecimals);
    require_keys_eq!(
      ctx.accounts.treasury.key(),
      ctx.accounts.config.treasury,
      QmsError::InvalidTreasury
    );
    require_keys_eq!(
      ctx.accounts.destination_owner.key(),
      args.mint_to,
      QmsError::InvalidMintToOwner
    );

    let expected_ata =
      get_associated_token_address(&ctx.accounts.destination_owner.key(), &ctx.accounts.mint.key());
    require_keys_eq!(
      ctx.accounts.destination_ata.key(),
      expected_ata,
      QmsError::InvalidATA
    );

    let metadata_program = ctx.accounts.token_metadata_program.key();
    let mint_key = ctx.accounts.mint.key();
    let metadata_seeds = &[b"metadata", metadata_program.as_ref(), mint_key.as_ref()];
    let (expected_metadata, _) = Pubkey::find_program_address(metadata_seeds, &metadata_program);
    require_keys_eq!(
      ctx.accounts.metadata_pda.key(),
      expected_metadata,
      QmsError::InvalidMetadataPda
    );

    validate_metadata_args(&meta_args)?;

    let rent = Rent::get()?;
    let mint_rent = rent.minimum_balance(Mint::LEN);
    let ata_rent = rent.minimum_balance(TokenAccount::LEN);
    let required = ctx
      .accounts
      .config
      .fee_lamports
      .checked_add(mint_rent)
      .and_then(|v| v.checked_add(ata_rent))
      .ok_or(QmsError::MathOverflow)?;
    let payer_lamports = **ctx.accounts.payer.to_account_info().lamports.borrow();
    require!(payer_lamports >= required, QmsError::InsufficientFunds);

    system_program::transfer(
      CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
          from: ctx.accounts.payer.to_account_info(),
          to: ctx.accounts.treasury.to_account_info(),
        },
      ),
      ctx.accounts.config.fee_lamports,
    )?;

    system_program::create_account(
      CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::CreateAccount {
          from: ctx.accounts.payer.to_account_info(),
          to: ctx.accounts.mint.to_account_info(),
        },
      ),
      mint_rent,
      Mint::LEN as u64,
      &ctx.accounts.token_program.key(),
    )?;

    token::initialize_mint2(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        InitializeMint2 {
          mint: ctx.accounts.mint.to_account_info(),
        },
      ),
      args.decimals,
      &ctx.accounts.program_authority.key(),
      Some(&ctx.accounts.program_authority.key()),
    )?;

    associated_token::create(CpiContext::new(
      ctx.accounts.associated_token_program.to_account_info(),
      associated_token::Create {
        payer: ctx.accounts.payer.to_account_info(),
        associated_token: ctx.accounts.destination_ata.to_account_info(),
        authority: ctx.accounts.destination_owner.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
      },
    ))?;

    let authority_bump = ctx.bumps.program_authority;
    let signer_seeds: &[&[u8]] = &[b"mint-authority", &[authority_bump]];

    token::mint_to(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
          mint: ctx.accounts.mint.to_account_info(),
          to: ctx.accounts.destination_ata.to_account_info(),
          authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      args.initial_supply,
    )?;

    require_keys_eq!(
      ctx.accounts.update_authority.key(),
      meta_args.update_authority,
      QmsError::InvalidUpdateAuthority
    );

    let metadata_uri = meta_args.uri.clone();
    let update_authority = meta_args.update_authority;

    let data = metadata::mpl_token_metadata::types::DataV2 {
      name: meta_args.name,
      symbol: meta_args.symbol,
      uri: metadata_uri.clone(),
      seller_fee_basis_points: meta_args.seller_fee_basis_points,
      creators: None,
      collection: None,
      uses: None,
    };

    metadata::create_metadata_accounts_v3(
      CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
          metadata: ctx.accounts.metadata_pda.to_account_info(),
          mint: ctx.accounts.mint.to_account_info(),
          mint_authority: ctx.accounts.program_authority.to_account_info(),
          payer: ctx.accounts.payer.to_account_info(),
          update_authority: ctx.accounts.update_authority.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
          rent: ctx.accounts.rent.to_account_info(),
        },
        &[signer_seeds],
      ),
      data,
      meta_args.is_mutable,
      false,
      None,
    )?;

    token::set_authority(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
          account_or_mint: ctx.accounts.mint.to_account_info(),
          current_authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      AuthorityType::MintTokens,
      args.final_mint_authority,
    )?;

    token::set_authority(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SetAuthority {
          account_or_mint: ctx.accounts.mint.to_account_info(),
          current_authority: ctx.accounts.program_authority.to_account_info(),
        },
        &[signer_seeds],
      ),
      AuthorityType::FreezeAccount,
      args.final_freeze_authority,
    )?;

    emit!(MintCreated {
      payer: ctx.accounts.payer.key(),
      mint: ctx.accounts.mint.key(),
      destination_owner: ctx.accounts.destination_owner.key(),
      destination_ata: ctx.accounts.destination_ata.key(),
      decimals: args.decimals,
      initial_supply: args.initial_supply,
      fee_lamports: ctx.accounts.config.fee_lamports,
      treasury: ctx.accounts.treasury.key(),
      final_mint_authority: args.final_mint_authority,
      final_freeze_authority: args.final_freeze_authority,
      client_ref: args.client_ref,
      metadata_pda: Some(ctx.accounts.metadata_pda.key()),
      metadata_uri: Some(metadata_uri),
      update_authority: Some(update_authority),
    });

    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
  #[account(mut)]
  pub admin: Signer<'info>,
  #[account(
    init,
    payer = admin,
    space = 8 + Config::LEN,
    seeds = [b"config"],
    bump
  )]
  pub config: Account<'info, Config>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
  #[account(mut)]
  pub admin: Signer<'info>,
  #[account(
    mut,
    seeds = [b"config"],
    bump = config.bump
  )]
  pub config: Account<'info, Config>,
}

#[derive(Accounts)]
pub struct MintToken<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    seeds = [b"config"],
    bump = config.bump
  )]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub treasury: SystemAccount<'info>,
  #[account(mut)]
  pub mint: Signer<'info>,
  /// CHECK: PDA authority used as temporary mint authority.
  #[account(
    seeds = [b"mint-authority"],
    bump
  )]
  pub program_authority: UncheckedAccount<'info>,
  /// CHECK: Destination owner for the ATA. Validated against args.mint_to.
  pub destination_owner: UncheckedAccount<'info>,
  /// CHECK: Destination ATA derived for (mint, destination_owner).
  #[account(mut)]
  pub destination_ata: UncheckedAccount<'info>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokenWithMetadata<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    seeds = [b"config"],
    bump = config.bump
  )]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub treasury: SystemAccount<'info>,
  #[account(mut)]
  pub mint: Signer<'info>,
  /// CHECK: PDA authority used as temporary mint authority.
  #[account(
    seeds = [b"mint-authority"],
    bump
  )]
  pub program_authority: UncheckedAccount<'info>,
  /// CHECK: Destination owner for the ATA. Validated against args.mint_to.
  pub destination_owner: UncheckedAccount<'info>,
  /// CHECK: Destination ATA derived for (mint, destination_owner).
  #[account(mut)]
  pub destination_ata: UncheckedAccount<'info>,
  /// CHECK: Metadata PDA derived from Metaplex seeds.
  #[account(mut)]
  pub metadata_pda: UncheckedAccount<'info>,
  /// CHECK: Update authority account (must match meta_args.update_authority).
  pub update_authority: UncheckedAccount<'info>,
  /// CHECK: Metaplex token metadata program.
  pub token_metadata_program: UncheckedAccount<'info>,
  pub token_program: Program<'info, Token>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MintTokenArgs {
  pub decimals: u8,
  pub initial_supply: u64,
  pub mint_to: Pubkey,
  pub final_mint_authority: Option<Pubkey>,
  pub final_freeze_authority: Option<Pubkey>,
  pub client_ref: Option<[u8; 16]>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetadataArgs {
  pub name: String,
  pub symbol: String,
  pub uri: String,
  pub seller_fee_basis_points: u16,
  pub is_mutable: bool,
  pub update_authority: Pubkey,
}

fn validate_metadata_args(args: &MetadataArgs) -> Result<()> {
  let uri = args.uri.as_str();
  require!(uri.len() <= 256, QmsError::InvalidMetadataUri);
  require!(
    uri.starts_with("https://") || uri.starts_with("ipfs://"),
    QmsError::InvalidMetadataUri
  );
  require!(args.name.len() <= 32, QmsError::InvalidMetadataName);
  require!(args.symbol.len() <= 10, QmsError::InvalidMetadataSymbol);
  Ok(())
}
