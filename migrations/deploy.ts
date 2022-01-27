// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.
import * as anchor from '@project-serum/anchor';
// import { Program } from '@project-serum/anchor';
// import { workspace } from "@project-serum/anchor";
// import { getMintInfo } from "@project-serum/common";
// import { PublicKey } from '@solana/web3.js';
// import { TokenFaucet } from '../target/types/token_faucet';

// const { TokenInstructions } = require("@project-serum/serum");

// const { SystemProgram } = anchor.web3;

// const TOKEN_ADDRESS = "ATu5CuLE9hQTofz2ABNtfaWNmURMQ2n2DzUhw8NGXzfP";
// const P2E_GAMES_ADDRESS = "";
// const COMMUNITY_GAMES_ADDRESS = "";
// const ARENA_ADDRESS = "";
// const NFT_MINING_ADDRESS = "";
// const LIQUIDITY_MINING_ADDRESS = "";
// const MARKETING_AND_SALES_ADDRESS = "";
// const ECOSYSTEM_ADDRESS = "";

// const INTERVALS = 1000 * 60 * 10;

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
  // const program = anchor.workspace.TokenFaucet as Program<TokenFaucet>;
  // const wallet = provider.wallet;

  // const tokenMint = new PublicKey(TOKEN_ADDRESS);
  // const associated_token_account_of_receiver_p2e_games = new PublicKey(P2E_GAMES_ADDRESS);
  // const associated_token_account_of_receiver_community_games = new PublicKey(COMMUNITY_GAMES_ADDRESS);
  // const associated_token_account_of_receiver_arena = new PublicKey(ARENA_ADDRESS);
  // const associated_token_account_of_receiver_nft_mining = new PublicKey(NFT_MINING_ADDRESS);
  // const associated_token_account_of_receiver_liquidity_mining = new PublicKey(LIQUIDITY_MINING_ADDRESS);
  // const associated_token_account_of_receiver_marketing_and_sales = new PublicKey(MARKETING_AND_SALES_ADDRESS);
  // const associated_token_account_of_receiver_ecosystem = new PublicKey(ECOSYSTEM_ADDRESS);

  // let faucetConfig: anchor.web3.Keypair;
  // let tokenAuthority: anchor.web3.PublicKey;
  // let nonce: number;

  // faucetConfig = anchor.web3.Keypair.generate();
  // [tokenAuthority, nonce] = await anchor.web3.PublicKey.findProgramAddress(
  //   [faucetConfig.publicKey.toBuffer()],
  //   program.programId
  // );

  // const tx = await program.rpc.initialize(
  //   nonce, {
  //   accounts: {
  //     faucetConfigAccount: faucetConfig.publicKey,
  //     user: provider.wallet.publicKey,
  //     tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
  //     tokenMint: tokenMint,
  //     tokenAuthority: tokenAuthority,
  //     receiverP2eGames: associated_token_account_of_receiver_p2e_games,
  //     receiverCommunityGames: associated_token_account_of_receiver_community_games,
  //     receiverArena: associated_token_account_of_receiver_arena,
  //     receiverNftMining: associated_token_account_of_receiver_nft_mining,
  //     receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
  //     receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
  //     receiverEcosystem: associated_token_account_of_receiver_ecosystem,
  //     systemProgram: SystemProgram.programId,
  //     clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
  //   },
  //   signers: [faucetConfig],
  // }
  // );

  // console.log("initialize transaction signature", tx);

  // while (true) {

  //   await sleep(INTERVALS);

  //   try {

  //     const tx = await program.rpc.drip({
  //       accounts: {
  //         faucetConfigAccount: faucetConfig.publicKey,
  //         tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
  //         tokenMint: tokenMint,
  //         tokenAuthority: tokenAuthority,
  //         receiverP2eGames: associated_token_account_of_receiver_p2e_games,
  //         receiverCommunityGames: associated_token_account_of_receiver_community_games,
  //         receiverArena: associated_token_account_of_receiver_arena,
  //         receiverNftMining: associated_token_account_of_receiver_nft_mining,
  //         receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
  //         receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
  //         receiverEcosystem: associated_token_account_of_receiver_ecosystem,
  //         clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
  //       },
  //       signers: [
  //       ],
  //     });

  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
}
