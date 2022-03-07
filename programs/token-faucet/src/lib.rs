/*
    Token symbol name: GYC.
    The program mint GameYoo platform tokens.
    Generation mechanism: token generation simulates following block generation.
*/

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint};
use std::convert::TryFrom;

declare_id!("E7WGku7aoDV9GHh3cagcrraktA4nETXuCearm1WZvMNU");

#[constant]
pub const DECIMALS: u8 = 9; // Token decimals is 9.
pub const BLOCK_GEN_RATE: u8 = 3; // Generate a block every three seconds.
pub const MAX_TOTAL_SUPPLY: u64 = 210_000_000 * 10_u64.pow(DECIMALS as u32); // The supply of tokens is capped at 210 million.
pub const COIN_NUM_PER_BLOCK: u64 = 3 * 10_u64.pow(DECIMALS as u32); // Per block contains 3 tokens.
pub const ARENA_PERCENTAGE: f64 = 0.07352941176470588235294117647059; // Percentage of arena.
pub const NFT_MINING_PERCENTAGE: f64 = 0.17647058823529411764705882352941; // Percentage of NFT minting.
pub const LIQUIDITY_MINING_PERCENTAGE: f64 = 0.19117647058823529411764705882353; // Percentage of liquidity minting.
pub const MARKETING_PERCENTAGE: f64 = 0.04411764705882352941176470588235; // Percentage of NFT trading Market.
pub const ECOSYSTEM_PERCENTAGE: f64 = 0.29411764705882352941176470588235; // Percentage of ecosystem.
pub const GYC_STAKING_PERCENTAGE: f64 = 0.22058823529411764705882352941176; // Percentage of GYC staking.

#[program]
pub mod token_faucet {
    use super::*;

    // Initialize configuration account.
    /**
     * @param ctx : Initialize context
     * @param bump : Bump seed for program address.
     */
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        // Determine if the recipient's associated token account has been created; if not, return the corresponding error.
        require!(
            !ctx.accounts.receiver_arena.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );
        require!(
            !ctx.accounts.receiver_nft_mining.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );
        require!(
            !ctx.accounts.receiver_liquidity_mining.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );
        require!(
            !ctx.accounts.receiver_marketing.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );
        require!(
            !ctx.accounts.receiver_ecosystem.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );
        require!(
            !ctx.accounts.receiver_gyc_staking.data_is_empty(),
            StatusInfo::NotInitializedAssociatedTokenAccount
        );

        let config_account = &mut ctx.accounts.config_account;

        /*
            Record the relevant status to the configuration account.
        */
        // Record token mint address.
        config_account.mint = *ctx.accounts.mint.to_account_info().key;

        // Record token authority address.
        config_account.mint_authority = *ctx.accounts.mint_authority.key;

        // Record the recipient's associated token account address.
        config_account.receiver_arena = *ctx.accounts.receiver_arena.key;
        config_account.receiver_nft_mining = *ctx.accounts.receiver_nft_mining.key;
        config_account.receiver_liquidity_mining = *ctx.accounts.receiver_liquidity_mining.key;
        config_account.receiver_marketing = *ctx.accounts.receiver_marketing.key;
        config_account.receiver_ecosystem = *ctx.accounts.receiver_ecosystem.key;
        config_account.receiver_gyc_staking = *ctx.accounts.receiver_gyc_staking.key;

        // Record the magic number.
        config_account.magic = 0x544b4654;

        // Record bump seed for program address.
        config_account.bump = bump;

        // Record initial block height.
        config_account.current_block_height = 0;

        // Record the timestamp of the last generated block.
        config_account.last_gen_block_timestamp = ctx.accounts.clock.unix_timestamp;

        emit!(InitializeEvent {
            status_code: StatusInfo::Ok as u64,
            status_desc: "Ok".to_string(),
            mint: *ctx.accounts.mint.to_account_info().key,
            mint_authority: *ctx.accounts.mint_authority.key,
            receiver_arena: *ctx.accounts.receiver_arena.key,
            receiver_nft_mining: *ctx.accounts.receiver_nft_mining.key,
            receiver_liquidity_mining: *ctx.accounts.receiver_liquidity_mining.key,
            receiver_marketing: *ctx.accounts.receiver_marketing.key,
            receiver_ecosystem: *ctx.accounts.receiver_ecosystem.key,
            receiver_gyc_staking: *ctx.accounts.receiver_gyc_staking.key,
            current_block_height: config_account.current_block_height,
            last_gen_block_timestamp: config_account.last_gen_block_timestamp,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Mint tokens for recipients according to the corresponding ratio.
    /// This can be called by anyone.
    /**
     * @param ctx : Drip context
     */
    pub fn drip(ctx: Context<Drip>) -> ProgramResult {
        let current_time = Clock::get()?.unix_timestamp;

        // Check if token supply exceeds.
        require!(
            ctx.accounts.mint.supply < MAX_TOTAL_SUPPLY,
            StatusInfo::TotalSupplyLimit
        );

        // Check current timestamp validity.
        let config_account = &mut ctx.accounts.config_account;
        require!(
            current_time > config_account.last_gen_block_timestamp,
            StatusInfo::InvalidTimestamp
        );

        // Check call interval.
        let intervals = current_time
            .checked_sub(config_account.last_gen_block_timestamp)
            .unwrap();
        require!(
            intervals >= i64::try_from(BLOCK_GEN_RATE).unwrap(),
            StatusInfo::InsufficientIntervalError
        );

        // Calculate the number of seconds not enough to generate a block.
        let remain_seconds_temp = (u64::try_from(intervals).unwrap())
            .checked_rem(u64::try_from(BLOCK_GEN_RATE).unwrap())
            .unwrap();

        // Calculate the number of blocks that should be generated.
        let gen_block_num = (u64::try_from(intervals).unwrap())
            .checked_div(u64::try_from(BLOCK_GEN_RATE).unwrap())
            .unwrap();

        // Calculate the numbers of tokens that should be minted.
        let distribution_amounts = gen_block_num.checked_mul(COIN_NUM_PER_BLOCK).unwrap();

        // Calculate the number of tokens that should be distributed to each recipient.
        let receiver_arena_amount: u64 = ((distribution_amounts as f64) * ARENA_PERCENTAGE) as u64;
        let receiver_nft_mining_amount: u64 =
            ((distribution_amounts as f64) * NFT_MINING_PERCENTAGE) as u64;
        let receiver_liquidity_mining_amount: u64 =
            ((distribution_amounts as f64) * LIQUIDITY_MINING_PERCENTAGE) as u64;
        let receiver_marketing_amount: u64 =
            ((distribution_amounts as f64) * MARKETING_PERCENTAGE) as u64;
        let receiver_ecosystem_amount: u64 =
            ((distribution_amounts as f64) * ECOSYSTEM_PERCENTAGE) as u64;
        let receiver_gyc_staking_amount: u64 =
            ((distribution_amounts as f64) * GYC_STAKING_PERCENTAGE) as u64;

        // Update block height.
        let current_block_height = config_account
            .current_block_height
            .checked_add(gen_block_num)
            .unwrap();
        config_account.current_block_height = current_block_height;

        // Update the timestamp of the latest block generation.
        let last_gen_block_timestamp = current_time
            .checked_sub(i64::try_from(remain_seconds_temp).unwrap())
            .unwrap();
        config_account.last_gen_block_timestamp = last_gen_block_timestamp;

        // Minting tokens for each recipient.
        ctx.accounts
            .token_mint_to(ctx.accounts.receiver_arena.clone(), receiver_arena_amount)?;
        ctx.accounts.token_mint_to(
            ctx.accounts.receiver_nft_mining.clone(),
            receiver_nft_mining_amount,
        )?;
        ctx.accounts.token_mint_to(
            ctx.accounts.receiver_liquidity_mining.clone(),
            receiver_liquidity_mining_amount,
        )?;
        ctx.accounts.token_mint_to(
            ctx.accounts.receiver_marketing.clone(),
            receiver_marketing_amount,
        )?;
        ctx.accounts.token_mint_to(
            ctx.accounts.receiver_ecosystem.clone(),
            receiver_ecosystem_amount,
        )?;
        ctx.accounts.token_mint_to(
            ctx.accounts.receiver_gyc_staking.clone(),
            receiver_gyc_staking_amount,
        )?;

        let supply = ctx.accounts.mint.supply;

        emit!(DripEvent {
            status_code: StatusInfo::Ok as u64,
            status_desc: "Ok".to_string(),
            mint: ctx.accounts.mint.to_account_info().key().clone(),
            mint_authority: ctx.accounts.mint_authority.key().clone(),
            receiver_arena: ctx.accounts.receiver_arena.key().clone(),
            receiver_nft_mining: ctx.accounts.receiver_nft_mining.key().clone(),
            receiver_liquidity_mining: ctx.accounts.receiver_liquidity_mining.key().clone(),
            receiver_marketing: ctx.accounts.receiver_marketing.key().clone(),
            receiver_ecosystem: ctx.accounts.receiver_ecosystem.key().clone(),
            receiver_gyc_staking: ctx.accounts.receiver_gyc_staking.key().clone(),
            current_block_height: current_block_height,
            last_gen_block_timestamp: last_gen_block_timestamp,
            receiver_arena_amount: receiver_arena_amount,
            receiver_liquidity_mining_amount: receiver_liquidity_mining_amount,
            receiver_nft_mining_amount: receiver_nft_mining_amount,
            receiver_marketing_amount: receiver_marketing_amount,
            receiver_ecosystem_amount: receiver_ecosystem_amount,
            receiver_gyc_staking_amount: receiver_gyc_staking_amount,
            intervals: intervals,
            supply: supply,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

/// --------------------------------
/// Context Structs
/// --------------------------------

/* Initialize context */

/// Accounts for Initialize.
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    /// [config_account] of program.
    #[account(
        init,
        payer = payer,
        seeds = [b"GameYoo-Token".as_ref()],
        bump,
        rent_exempt = enforce
    )]
    pub config_account: Account<'info, ConfigAccount>,

    /// Payer of the [config_account] initialization.
    pub payer: Signer<'info>,

    /// Token program.
    #[account(address = token::ID @ StatusInfo::InvalidTokenProgram)]
    pub token_program: AccountInfo<'info>,

    /// GYC token mint.
    pub mint: Account<'info, Mint>,

    /// Authority who mint the token.
    #[account(
        seeds = [b"GYC-Mint-Auth".as_ref()],
        bump = bump
    )]
    pub mint_authority: AccountInfo<'info>,

    /// The associated token account of recipient for arena.
    pub receiver_arena: AccountInfo<'info>,

    /// The associated token account of recipient for nft mining.
    pub receiver_nft_mining: AccountInfo<'info>,

    /// The associated token account of recipient for liquidity mining.
    pub receiver_liquidity_mining: AccountInfo<'info>,

    /// The associated token account of recipient for marketing.
    pub receiver_marketing: AccountInfo<'info>,

    /// The associated token account of recipient for ecosystem.
    pub receiver_ecosystem: AccountInfo<'info>,

    /// The associated token account of recipient for GYC staking.
    pub receiver_gyc_staking: AccountInfo<'info>,

    /// System program.
    pub system_program: Program<'info, System>,

    /// Clock represents network time.
    pub clock: Sysvar<'info, Clock>,

    /// Rent for rent exempt.
    pub rent: Sysvar<'info, Rent>,
}

/* Drip context */

/// Accounts for Drip
#[derive(Accounts)]
pub struct Drip<'info> {
    /// [config_account] of program.
    #[account(
        mut,
        seeds = [b"GameYoo-Token".as_ref()],
        bump,
        has_one = mint @StatusInfo::InvalidTokenMint,
        has_one = mint_authority @StatusInfo::InvalidTokenAuthority,
        has_one = receiver_arena @StatusInfo::InvalidReceiverTokenAccount,
        has_one = receiver_nft_mining @StatusInfo::InvalidReceiverTokenAccount,
        has_one = receiver_liquidity_mining @StatusInfo::InvalidReceiverTokenAccount,
        has_one = receiver_marketing @StatusInfo::InvalidReceiverTokenAccount,
        has_one = receiver_ecosystem @StatusInfo::InvalidReceiverTokenAccount,
        has_one = receiver_gyc_staking @StatusInfo::InvalidReceiverTokenAccount,
        constraint = config_account.magic == 0x544b4654 @StatusInfo::InvalidMagic,
    )]
    pub config_account: Account<'info, ConfigAccount>,

    /// Token program.
    #[account(address = token::ID @ StatusInfo::InvalidTokenProgram)]
    pub token_program: AccountInfo<'info>,

    /// GYC token mint.
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// Authority who mint the token.
    #[account(
        seeds = [b"GYC-Mint-Auth".as_ref()],
        bump = config_account.bump
    )]
    pub mint_authority: AccountInfo<'info>,

    /// The associated token account of recipient for arena.
    #[account(mut)]
    pub receiver_arena: AccountInfo<'info>,

    /// The associated token account of recipient for nft mining.
    #[account(mut)]
    pub receiver_nft_mining: AccountInfo<'info>,

    /// The associated token account of recipient for liquidity mining.
    #[account(mut)]
    pub receiver_liquidity_mining: AccountInfo<'info>,

    /// The associated token account of recipient for marketing.
    #[account(mut)]
    pub receiver_marketing: AccountInfo<'info>,

    /// The associated token account of recipient for ecosystem.
    #[account(mut)]
    pub receiver_ecosystem: AccountInfo<'info>,

    /// The associated token account of recipient for GYC staking.
    #[account(mut)]
    pub receiver_gyc_staking: AccountInfo<'info>,

    /// Clock represents network time.
    pub clock: Sysvar<'info, Clock>,
}

// --------------------------------
// PDA Structs
// --------------------------------

/// A config controls token distribution.
#[account]
pub struct ConfigAccount {
    /// The magic number for current program.
    pub magic: u32,
    /// Bump seed for program address.
    pub bump: u8,

    /// The current block height.
    pub current_block_height: u64,

    /// The timestamp of the last block generation.
    pub last_gen_block_timestamp: i64,

    /// Mint for GYC.
    pub mint: Pubkey,
    /// Authority who mint the token.
    pub mint_authority: Pubkey,

    /// The associated token account of recipient for arena.
    pub receiver_arena: Pubkey,
    /// The associated token account of recipient for nft mining.
    pub receiver_nft_mining: Pubkey,
    /// The associated token account of recipient for liquidity mining.
    pub receiver_liquidity_mining: Pubkey,
    /// The associated token account of recipient for marketing.
    pub receiver_marketing: Pubkey,
    /// The associated token account of recipient for ecosystem.
    pub receiver_ecosystem: Pubkey,
    /// The associated token account of recipient for GYC staking.
    pub receiver_gyc_staking: Pubkey,
}

impl Default for ConfigAccount {
    fn default() -> ConfigAccount {
        unsafe { std::mem::zeroed() }
    }
}

impl<'info> Drip<'info> {
    /// Minting tokens for recipient.
    fn token_mint_to(&mut self, receiver: AccountInfo<'info>, amount: u64) -> ProgramResult {
        let cpi_program = self.token_program.clone();
        let cpi_accounts = token::MintTo {
            authority: self.mint_authority.to_account_info(),
            mint: self.mint.to_account_info(),
            to: receiver.to_account_info(),
        };

        let seeds = &[b"GYC-Mint-Auth".as_ref(), &[self.config_account.bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::mint_to(cpi_ctx, amount)?;

        Ok(())
    }
}

///-------------------------------------
/// Events
///-------------------------------------

// Triggered when initialize is success.
#[event]
pub struct InitializeEvent {
    /// Status code
    pub status_code: u64,
    /// Status description info.
    pub status_desc: String,
    /// [Mint] of [GYC] Token.
    #[index]
    pub mint: Pubkey,
    /// Authority mint.
    #[index]
    pub mint_authority: Pubkey,
    /// The associated token account of recipient for arena.
    #[index]
    pub receiver_arena: Pubkey,
    /// The associated token account of recipient for nft mining.
    #[index]
    pub receiver_nft_mining: Pubkey,
    /// The associated token account of recipient for liquidity mining.
    #[index]
    pub receiver_liquidity_mining: Pubkey,
    /// The associated token account of recipient for marketing.
    #[index]
    pub receiver_marketing: Pubkey,
    /// The associated token account of recipient for ecosystem.
    #[index]
    pub receiver_ecosystem: Pubkey,
    /// The associated token account of recipient for GYC staking.
    #[index]
    pub receiver_gyc_staking: Pubkey,
    /// The current block height.
    pub current_block_height: u64,
    /// The timestamp of last block generation.
    pub last_gen_block_timestamp: i64,
    /// When the event took place.
    pub timestamp: i64,
}

/// Triggered when new tokens are minted by a simulated follow block generation.
#[event]
pub struct DripEvent {
    /// Status code
    pub status_code: u64,
    /// Status description info.
    pub status_desc: String,
    /// [Mint] of [GYC] Token.
    #[index]
    pub mint: Pubkey,
    /// Authority mint.
    #[index]
    pub mint_authority: Pubkey,
    /// The associated token account of recipient for arena.
    #[index]
    pub receiver_arena: Pubkey,
    /// The associated token account of recipient for nft mining.
    #[index]
    pub receiver_nft_mining: Pubkey,
    /// The associated token account of recipient for liquidity mining.
    #[index]
    pub receiver_liquidity_mining: Pubkey,
    /// The associated token account of recipient for marketing.
    #[index]
    pub receiver_marketing: Pubkey,
    /// The associated token account of recipient for ecosystem.
    #[index]
    pub receiver_ecosystem: Pubkey,
    /// The associated token account of recipient for GYC staking.
    #[index]
    pub receiver_gyc_staking: Pubkey,
    /// The current block height.
    pub current_block_height: u64,
    /// The timestamp of last block generation.
    pub last_gen_block_timestamp: i64,
    /// Amount of token distribution to arena.
    pub receiver_arena_amount: u64,
    /// Amount of token distribution to nft mining.
    pub receiver_nft_mining_amount: u64,
    /// Amount of token distribution to liquidity mining.
    pub receiver_liquidity_mining_amount: u64,
    /// Amount of token distribution to marketing.
    pub receiver_marketing_amount: u64,
    /// Amount of token distribution to ecosystem.
    pub receiver_ecosystem_amount: u64,
    /// Amount of token distribution to GYC staking.
    pub receiver_gyc_staking_amount: u64,
    /// interval of invoke drip instruction.
    pub intervals: i64,
    /// Latest supply.
    pub supply: u64,
    /// When the event took place.
    pub timestamp: i64,
}

/// --------------------------------
/// Error Codes
/// --------------------------------
#[error]
pub enum StatusInfo {
    #[msg("Ok")]
    Ok,
    #[msg("Invalid params.")]
    InvalidParamError,
    #[msg("Insufficient interval to generate a block.")]
    InsufficientIntervalError,
    #[msg("Max token supply exceeded.")]
    TotalSupplyLimit,
    #[msg("Invalid config account.")]
    InvalidConfigAccount,
    #[msg("Invalid magic number.")]
    InvalidMagic,
    #[msg("Invalid config owner.")]
    InvalidConfigOwner,
    #[msg("Invalid token receiver account.")]
    InvalidReceiverTokenAccount,
    #[msg("Not initialized token associated account.")]
    NotInitializedAssociatedTokenAccount,
    #[msg("Invalid token authority.")]
    InvalidTokenAuthority,
    #[msg("Invalid token mint.")]
    InvalidTokenMint,
    #[msg("Invalid token program.")]
    InvalidTokenProgram,
    #[msg("Invalid timestamp.")]
    InvalidTimestamp,
}
