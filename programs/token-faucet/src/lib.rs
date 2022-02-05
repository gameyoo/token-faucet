use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, SetAuthority};
use spl_token::instruction::AuthorityType;
use solana_program::program_option::COption;
use std::convert::TryFrom;

declare_id!("3Yi5DE6ZfyS8vFRRMnuM4kE5XSvtmFgNE3wMHwpdzsHK");

#[constant]
pub const INIT_PRODUCTION_REDUCTION_BLOCK_HEIGHT: u64 = 2_625_000;
pub const DECIMALS: u8 = 9;
pub const BLOCK_GEN_RATE: u8 = 3;
pub const MAX_TOTAL_SUPPLY : u64 = 210_000_000 * 10_u64.pow(DECIMALS as u32);
pub const INIT_COIN_NUMS_PER_BLOCK: u64 = 30 * 10_u64.pow(DECIMALS as u32);  // 300_000_000_000
pub const P2E_GAMES_PERCENTAGE: f64 = 0.13333333333333333333333333333333;
pub const COMMUNITY_GAMES_PERCENTAGE: f64 = 0.13333333333333333333333333333333;
pub const ARENA_PERCENTAGE: f64 = 0.13333333333333333333333333333333;
pub const NFT_MINING_PERCENTAGE: f64 = 0.16;
pub const LIQUIDITY_MINING_PERCENTAGE: f64 = 0.26666666666666666666666666666667;
pub const MARKETING_AND_SALES_PERCENTAGE: f64 = 0.04;
pub const ECOSYSTEM_PERCENTAGE: f64 = 0.13333333333333333333333333333333;
    
#[program]
pub mod token_faucet {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        nonce: u8
    ) -> ProgramResult {
        
        msg!("program id:{}", ctx.program_id);
        msg!("config acount ower:{}", ctx.accounts.faucet_config_account.to_account_info().owner);

        let faucet_config_account = &mut ctx.accounts.faucet_config_account;
        faucet_config_account.token_program = *ctx.accounts.token_program.key;
        faucet_config_account.token_mint = *ctx.accounts.token_mint.to_account_info().key;
        faucet_config_account.token_authority = *ctx.accounts.token_authority.key;

        faucet_config_account.receiver_p2e_games = *ctx.accounts.receiver_p2e_games.key;
        faucet_config_account.receiver_community_games = *ctx.accounts.receiver_community_games.key;
        faucet_config_account.receiver_arena = *ctx.accounts.receiver_arena.key;
        faucet_config_account.receiver_nft_mining = *ctx.accounts.receiver_nft_mining.key;
        faucet_config_account.receiver_liquidity_mining = *ctx.accounts.receiver_liquidity_mining.key;
        faucet_config_account.receiver_marketing_and_sales = *ctx.accounts.receiver_marketing_and_sales.key;
        faucet_config_account.receiver_ecosystem = *ctx.accounts.receiver_ecosystem.key;
        
        faucet_config_account.magic = 0x544b4654;
        faucet_config_account.nonce = nonce;
        faucet_config_account.current_block_height = 0;
        faucet_config_account.next_production_reduction_block_height = INIT_PRODUCTION_REDUCTION_BLOCK_HEIGHT;
        faucet_config_account.last_gen_block_timestamp = ctx.accounts.clock.unix_timestamp;
        faucet_config_account.coin_nums_per_block = INIT_COIN_NUMS_PER_BLOCK;

        msg!("Token program key: {}", faucet_config_account.token_program);
        msg!("Token mint key: {}", faucet_config_account.token_mint);
        msg!("token authority key: {}", faucet_config_account.token_authority);
        msg!("Receiver p2e games key: {}", faucet_config_account.receiver_p2e_games);
        msg!("Receiver community games key: {}", faucet_config_account.receiver_community_games);
        msg!("Receiver arena key: {}", faucet_config_account.receiver_arena);
        msg!("Receiver nft mining key: {}", faucet_config_account.receiver_nft_mining);
        msg!("Receiver liquidity mining key: {}", faucet_config_account.receiver_liquidity_mining);
        msg!("Receiver marketing and sales key: {}", faucet_config_account.receiver_marketing_and_sales);
        msg!("Receiver ecosystem key: {}", faucet_config_account.receiver_ecosystem);
        msg!("Magic: 0x{:x}", faucet_config_account.magic);
        msg!("Nonce: {}", faucet_config_account.nonce);
        msg!("Current block height: {}", faucet_config_account.current_block_height);
        msg!("Next production reduction block height: {}", faucet_config_account.next_production_reduction_block_height);
        msg!("Last gen block timestamp: {}", faucet_config_account.last_gen_block_timestamp);
        msg!("Coin nums per block: {}\n", faucet_config_account.coin_nums_per_block);
        
        Ok(())
    }

    pub fn drip(ctx: Context<Drip>) -> ProgramResult {
                
        msg!("program id:{}", ctx.program_id);
        msg!("config acount ower:{}", ctx.accounts.faucet_config_account.to_account_info().owner);

        let current_time = ctx.accounts.clock.unix_timestamp;
        
        msg!("Current Token Supply: {}", ctx.accounts.token_mint.supply);
        if ctx.accounts.token_mint.supply >= MAX_TOTAL_SUPPLY {

            if ctx.accounts.token_mint.mint_authority != COption::None {

                token::set_authority(
                    ctx.accounts.into_set_authority_context(),
                    AuthorityType::MintTokens,
                    None,
                )?;
            }
            
            return Err(TokenFaucetError::TotalSupplyLimit.into());
        }

        let faucet_config_account = &mut ctx.accounts.faucet_config_account;
        let intervals = current_time.checked_sub(faucet_config_account.last_gen_block_timestamp).unwrap();
        msg!("Called Interval: {}s", intervals);
        if intervals < i64::try_from(BLOCK_GEN_RATE).unwrap() {
            return Err(TokenFaucetError::InsufficientIntervalError.into());
        }
        
        let remain_seconds_temp = (u64::try_from(intervals).unwrap()).checked_rem(u64::try_from(BLOCK_GEN_RATE).unwrap()).unwrap();
        msg!("Remain seconds: {}", remain_seconds_temp);

        let gen_block_nums = (u64::try_from(intervals).unwrap()).checked_div(u64::try_from(BLOCK_GEN_RATE).unwrap()).unwrap();

        let mut distribution_amounts = gen_block_nums.checked_mul(faucet_config_account.coin_nums_per_block).unwrap();

        msg!("Current block height: {}", faucet_config_account.current_block_height);
        msg!("Current coin number of per block: {}", faucet_config_account.coin_nums_per_block);
        msg!("Current next production reduction block height: {}", faucet_config_account.next_production_reduction_block_height);

        if (faucet_config_account.current_block_height).checked_add(gen_block_nums).unwrap()  >= faucet_config_account.next_production_reduction_block_height {

            if (faucet_config_account.current_block_height).checked_add(gen_block_nums).unwrap() > faucet_config_account.next_production_reduction_block_height {

                msg!("Intervals cross production reduction");

                let after_production_reduction_block_nums  = faucet_config_account.current_block_height.checked_add(gen_block_nums).unwrap().checked_sub(faucet_config_account.next_production_reduction_block_height).unwrap();
                let before_production_reduction_block_nums: u64 = gen_block_nums.checked_sub(after_production_reduction_block_nums).unwrap();
                distribution_amounts = before_production_reduction_block_nums.checked_mul(faucet_config_account.coin_nums_per_block).unwrap().checked_add(after_production_reduction_block_nums.checked_mul(faucet_config_account.coin_nums_per_block.checked_div(2).unwrap()).unwrap()).unwrap();
            }

            msg!("Perform production reduction...");
            faucet_config_account.coin_nums_per_block = faucet_config_account.coin_nums_per_block.checked_div(2).unwrap();
            faucet_config_account.next_production_reduction_block_height = faucet_config_account.next_production_reduction_block_height.checked_mul(2).unwrap();
            msg!("Now coin number of per block: {}", faucet_config_account.coin_nums_per_block);
            msg!("Now next production reduction block height: {}", faucet_config_account.next_production_reduction_block_height);
        }

        msg!("This time distribution token total amounts: {}", distribution_amounts);

        let receiver_p2e_games_amount: u64 = ((distribution_amounts as f64) * P2E_GAMES_PERCENTAGE) as u64;
        let receiver_community_games_amount: u64 = ((distribution_amounts as f64) * COMMUNITY_GAMES_PERCENTAGE) as u64;
        let receiver_arena_amount: u64 = ((distribution_amounts as f64) * ARENA_PERCENTAGE) as u64;
        let receiver_nft_mining_amount: u64 = ((distribution_amounts as f64) * NFT_MINING_PERCENTAGE) as u64;
        let receiver_liquidity_mining_amount: u64 = ((distribution_amounts as f64) * LIQUIDITY_MINING_PERCENTAGE) as u64;
        let receiver_marketing_and_sales_amount: u64 = ((distribution_amounts as f64) * MARKETING_AND_SALES_PERCENTAGE) as u64;
        let receiver_ecosystem_amount: u64 = ((distribution_amounts as f64) * ECOSYSTEM_PERCENTAGE) as u64;

        msg!("This time p2e_games should be distributed token's amounts: {}", receiver_p2e_games_amount);
        msg!("This time community_games should be distributed token's amounts: {}", receiver_community_games_amount);
        msg!("This time arena should be distributed token's amounts: {}", receiver_arena_amount);
        msg!("This time nft_mining should be distributed token's amounts: {}", receiver_nft_mining_amount);
        msg!("This time liquidity_mining should be distributed token's amounts: {}", receiver_liquidity_mining_amount);
        msg!("This time marketing_and_sales should be distributed token's amounts: {}", receiver_marketing_and_sales_amount);
        msg!("This time ecosystem should be distributed token's amounts: {}", receiver_ecosystem_amount);
        
        faucet_config_account.current_block_height = faucet_config_account.current_block_height.checked_add(gen_block_nums).unwrap();
        faucet_config_account.last_gen_block_timestamp = current_time.checked_sub(i64::try_from(remain_seconds_temp).unwrap()).unwrap();
        msg!("Update block height, now block height: {}", faucet_config_account.current_block_height);
        msg!("Update timestamp, now last gen block timestamp: {}", faucet_config_account.last_gen_block_timestamp);

        msg!("Start mint to receivers");
        ctx.accounts.token_mint_to(ctx.accounts.receiver_p2e_games.clone(), receiver_p2e_games_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_community_games.clone(), receiver_community_games_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_arena.clone(), receiver_arena_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_nft_mining.clone(), receiver_nft_mining_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_liquidity_mining.clone(), receiver_liquidity_mining_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_marketing_and_sales.clone(), receiver_marketing_and_sales_amount)?;
        ctx.accounts.token_mint_to(ctx.accounts.receiver_ecosystem.clone(), receiver_ecosystem_amount)?;
        msg!("Mint to receivers finished");
        msg!("Finished...\n\n");

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize <'info> {
    #[account(
        init_if_needed,
        payer = user,
        owner = id(),
        rent_exempt = enforce
    )]
    pub faucet_config_account: Account<'info, FaucetConfigAccount>,

    #[account()]
    pub user: Signer<'info>,

    #[account(address = token::ID @ TokenFaucetError::InvalidTokenProgram)]
    pub token_program: AccountInfo<'info>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    pub token_authority: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_p2e_games: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_community_games: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_arena: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_nft_mining: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_liquidity_mining: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_marketing_and_sales: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_ecosystem: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub clock: Sysvar<'info, Clock>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct Drip<'info> {

    #[account(
        mut,
        owner = id() @TokenFaucetError::InvalidConfigOwner,
        has_one = token_mint @TokenFaucetError::InvalidTokenMint,
        has_one = token_authority @TokenFaucetError::InvalidTokenAuthority,
        has_one = receiver_p2e_games @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_community_games @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_arena @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_nft_mining @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_liquidity_mining @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_marketing_and_sales @TokenFaucetError::InvalidReceiverTokenAccount,
        has_one = receiver_ecosystem @TokenFaucetError::InvalidReceiverTokenAccount,
        constraint = faucet_config_account.magic == 0x544b4654 @TokenFaucetError::InvalidMagic,
    )]  
    pub faucet_config_account: Account<'info, FaucetConfigAccount>,

    #[account(address = token::ID @ TokenFaucetError::InvalidTokenProgram)]
    pub token_program: AccountInfo<'info>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    pub token_authority: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_p2e_games: AccountInfo<'info>,
    
    #[account(mut)]
    pub receiver_community_games:AccountInfo<'info>,

    #[account(mut)]
    pub receiver_arena: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_nft_mining: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_liquidity_mining: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_marketing_and_sales: AccountInfo<'info>,

    #[account(mut)]
    pub receiver_ecosystem: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>
}

#[account]
pub struct FaucetConfigAccount {
    pub magic: u32,
    pub nonce: u8,
    pub current_block_height: u64,
    pub next_production_reduction_block_height: u64,
    pub last_gen_block_timestamp: i64,
    pub coin_nums_per_block: u64,

    pub token_program: Pubkey,
    pub token_mint: Pubkey,
    pub token_authority: Pubkey,

    pub receiver_p2e_games: Pubkey,
    pub receiver_community_games: Pubkey,
    pub receiver_arena: Pubkey,
    pub receiver_nft_mining: Pubkey,
    pub receiver_liquidity_mining: Pubkey,
    pub receiver_marketing_and_sales: Pubkey,
    pub receiver_ecosystem: Pubkey
}

impl Default for FaucetConfigAccount {

    fn default() -> FaucetConfigAccount {
        unsafe { std::mem::zeroed()}
    }

}

impl<'info> Drip<'info> {
    fn token_mint_to(&mut self, receiver: AccountInfo<'info>, amount: u64) -> ProgramResult {
        let cpi_program = self.token_program.clone();
        let cpi_accounts = token::MintTo {
            authority: self.token_authority.to_account_info(),
            mint: self.token_mint.to_account_info(),
            to: receiver.to_account_info()
        };  

        let seeds = &[self.faucet_config_account.to_account_info().key.as_ref(), &[self.faucet_config_account.nonce]];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::mint_to(cpi_ctx, amount)?;

        Ok(())
    }

    fn into_set_authority_context(&mut self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>>{
        let cpi_accounts = SetAuthority {
            account_or_mint: self.token_mint.to_account_info().clone(),
            current_authority: self.token_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

#[error]
pub enum TokenFaucetError {
    #[msg("This is an error message that contain invalid params.")]
    InvalidParamError,
    #[msg("Insufficient interval to generate a block.")]
    InsufficientIntervalError,
    #[msg("Token Supply has reached the max limit.")]
    TotalSupplyLimit,
    #[msg("Config account is invalid.")]
    InvalidConfigAccount,
    #[msg("Invalid magic number.")]
    InvalidMagic,
    #[msg("Invalid config owner.")]
    InvalidConfigOwner,
    #[msg("Invalid token receiver account.")]
    InvalidReceiverTokenAccount,
    #[msg("Invalid token authority.")]
    InvalidTokenAuthority,
    #[msg("Invalid token mint.")]
    InvalidTokenMint,
    #[msg("Invalid token program.")]
    InvalidTokenProgram,
}