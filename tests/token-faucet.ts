import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TokenFaucet } from '../target/types/token_faucet';
import { TokenInstructions } from '@project-serum/serum';
import {
  createMint, createTokenAccountInstrs, getMintInfo, getTokenAccount
} from '@project-serum/common';
import assert from 'assert';

import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';

const { SystemProgram } = anchor.web3;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createTokenAccount(provider, mint, owner) {
  const vault = anchor.web3.Keypair.generate();
  const tx = new anchor.web3.Transaction();
  tx.add(
    ...(await createTokenAccountInstrs(provider, vault.publicKey, mint, owner))
  );
  await provider.send(tx, [vault]);
  return vault.publicKey;
}

describe('token-faucet', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();

  anchor.setProvider(provider);

  const program = anchor.workspace.TokenFaucet as Program<TokenFaucet>;
  const tokenDecimals = 9;

  let receiver_p2e_games: anchor.web3.Keypair;
  let receiver_community_games: anchor.web3.Keypair;
  let receiver_arena: anchor.web3.Keypair;
  let receiver_nft_mining: anchor.web3.Keypair;
  let receiver_liquidity_mining: anchor.web3.Keypair;
  let receiver_marketing_and_sales: anchor.web3.Keypair;
  let receiver_ecosystem: anchor.web3.Keypair;

  let associated_token_account_of_receiver_p2e_games: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_community_games: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_arena: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_nft_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_liquidity_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_marketing_and_sales: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_ecosystem: anchor.web3.PublicKey;

  let faucetConfig: anchor.web3.Keypair;
  let faucetConfig2: anchor.web3.Keypair;
  let tokenMint: anchor.web3.PublicKey;
  let tokenAuthority: anchor.web3.PublicKey;
  let nonce: number;

  before(async () => {
    receiver_p2e_games = anchor.web3.Keypair.generate();
    receiver_community_games = anchor.web3.Keypair.generate();
    receiver_arena = anchor.web3.Keypair.generate();
    receiver_nft_mining = anchor.web3.Keypair.generate();
    receiver_liquidity_mining = anchor.web3.Keypair.generate();
    receiver_marketing_and_sales = anchor.web3.Keypair.generate();
    receiver_ecosystem = anchor.web3.Keypair.generate();

    faucetConfig = anchor.web3.Keypair.generate();
    [tokenAuthority, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [faucetConfig.publicKey.toBuffer()],
      program.programId
    );

    console.log("-- config pubkey: %s, nonce: %d\n",
      faucetConfig.publicKey.toBase58(),
      nonce);

    tokenMint = await createMint(provider, tokenAuthority, tokenDecimals);

    associated_token_account_of_receiver_p2e_games = await createTokenAccount(provider, tokenMint, receiver_p2e_games.publicKey);
    associated_token_account_of_receiver_community_games = await createTokenAccount(provider, tokenMint, receiver_community_games.publicKey);
    associated_token_account_of_receiver_arena = await createTokenAccount(provider, tokenMint, receiver_arena.publicKey);
    associated_token_account_of_receiver_nft_mining = await createTokenAccount(provider, tokenMint, receiver_nft_mining.publicKey);
    associated_token_account_of_receiver_liquidity_mining = await createTokenAccount(provider, tokenMint, receiver_liquidity_mining.publicKey);
    associated_token_account_of_receiver_marketing_and_sales = await createTokenAccount(provider, tokenMint, receiver_marketing_and_sales.publicKey);
    associated_token_account_of_receiver_ecosystem = await createTokenAccount(provider, tokenMint, receiver_ecosystem.publicKey);

    // await TokenInstructions.setAuthority({
    //   target: tokenMint,
    //   currentAuthority: provider.wallet.publicKey,
    //   newAuthority: tokenAuthority,
    //   authorityType: "MintTokens"
    // });
  });

  describe("#Initialize", () => {

    it("Initialize program state once", async () => {

      const tx = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig.publicKey,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [faucetConfig],
      }
      );

      console.log("initialize transaction signature", tx);

      const faucetConfigAccount = await program.account.faucetConfigAccount.fetch(faucetConfig.publicKey);

      //console.log("config:\n", faucetConfigAccount);

      assert.strictEqual(
        faucetConfigAccount.tokenProgram.toBase58(),
        TokenInstructions.TOKEN_PROGRAM_ID.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.tokenMint.toBase58(),
        tokenMint.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.tokenAuthority.toBase58(),
        tokenAuthority.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverP2EGames.toBase58(),
        associated_token_account_of_receiver_p2e_games.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverCommunityGames.toBase58(),
        associated_token_account_of_receiver_community_games.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverArena.toBase58(),
        associated_token_account_of_receiver_arena.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverNftMining.toBase58(),
        associated_token_account_of_receiver_nft_mining.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverLiquidityMining.toBase58(),
        associated_token_account_of_receiver_liquidity_mining.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverMarketingAndSales.toBase58(),
        associated_token_account_of_receiver_marketing_and_sales.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverEcosystem.toBase58(),
        associated_token_account_of_receiver_ecosystem.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.nonce,
        nonce
      );
    });

    it("Initialize program state twice with the same account", async () => {

      const tx = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig.publicKey,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [faucetConfig],
      }
      );

      console.log("initialize transaction signature", tx);

      const tx1 = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig.publicKey,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [faucetConfig],
      }
      );

      console.log("initialize transaction signature", tx1);
    });

    it("Initialize program state twice with the diff account", async () => {

      const tx = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig.publicKey,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [faucetConfig],
      }
      );

      console.log("initialize transaction signature", tx);

      faucetConfig2 = anchor.web3.Keypair.generate();

      const tx1 = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig2.publicKey,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [faucetConfig2],
      }
      );

      console.log("initialize transaction signature", tx1);
    });

  });
  
  describe("#Drip", () => {

    it("Drip once", async () => {

      await sleep(3000);

      const mintInfo = await getMintInfo(provider, tokenMint);

      assert.strictEqual(
        mintInfo.mintAuthority.toBase58(),
        tokenAuthority.toBase58()
      );

      const tx = await program.rpc.drip({
        accounts: {
          faucetConfigAccount: faucetConfig.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: mintInfo.mintAuthority,
          receiverP2eGames: associated_token_account_of_receiver_p2e_games,
          receiverCommunityGames: associated_token_account_of_receiver_community_games,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [
        ],
      });

      console.log("drip transaction signature", tx);

      let _associated_token_account_of_receiver_p2e_games = await getTokenAccount(provider, associated_token_account_of_receiver_p2e_games);
      console.log("p2e_games associated_token: %s, amount: %d", associated_token_account_of_receiver_p2e_games.toBase58(), _associated_token_account_of_receiver_p2e_games.amount);

      let _associated_token_account_of_receiver_community_games = await getTokenAccount(provider, associated_token_account_of_receiver_community_games);
      console.log("community_games associated_token: %s, amount: %d", associated_token_account_of_receiver_community_games.toBase58(), _associated_token_account_of_receiver_community_games.amount);

      let _associated_token_account_of_receiver_arena = await getTokenAccount(provider, associated_token_account_of_receiver_arena);
      console.log("arena associated_token: %s, amount: %d", associated_token_account_of_receiver_arena.toBase58(), _associated_token_account_of_receiver_arena.amount);

      let _associated_token_account_of_receiver_nft_mining = await getTokenAccount(provider, associated_token_account_of_receiver_nft_mining);
      console.log("nft_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_nft_mining.toBase58(), _associated_token_account_of_receiver_nft_mining.amount);

      let _associated_token_account_of_receiver_liquidity_mining = await getTokenAccount(provider, associated_token_account_of_receiver_liquidity_mining);
      console.log("liquidity_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_liquidity_mining.toBase58(), _associated_token_account_of_receiver_liquidity_mining.amount);

      let _associated_token_account_of_receiver_marketing_and_sales = await getTokenAccount(provider, associated_token_account_of_receiver_marketing_and_sales);
      console.log("marketing_and_sales associated_token: %s, amount: %d", associated_token_account_of_receiver_marketing_and_sales.toBase58(), _associated_token_account_of_receiver_marketing_and_sales.amount);

      let _associated_token_account_of_receiver_ecosystem = await getTokenAccount(provider, associated_token_account_of_receiver_ecosystem);
      console.log("ecosystem associated_token: %s, amount: %d", associated_token_account_of_receiver_ecosystem.toBase58(), _associated_token_account_of_receiver_ecosystem.amount);
    });

    it("Drip 100 times", async () => {

      let i = 1;

      while (i <= 100) {
        
        await sleep(3000);

        try {
            
          const mintInfo = await getMintInfo(provider, tokenMint);

          assert.strictEqual(
            mintInfo.mintAuthority.toBase58(),
            tokenAuthority.toBase58()
          );
  
          const tx = await program.rpc.drip({
            accounts: {
              faucetConfigAccount: faucetConfig.publicKey,
              tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
              tokenMint: tokenMint,
              tokenAuthority: mintInfo.mintAuthority,
              receiverP2eGames: associated_token_account_of_receiver_p2e_games,
              receiverCommunityGames: associated_token_account_of_receiver_community_games,
              receiverArena: associated_token_account_of_receiver_arena,
              receiverNftMining: associated_token_account_of_receiver_nft_mining,
              receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
              receiverMarketingAndSales: associated_token_account_of_receiver_marketing_and_sales,
              receiverEcosystem: associated_token_account_of_receiver_ecosystem,
              clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
            },
            signers: [
            ],
          });
  
          console.log("drip transaction signature: %s, index: %d ", tx, i);
  
          let _associated_token_account_of_receiver_p2e_games = await getTokenAccount(provider, associated_token_account_of_receiver_p2e_games);
          console.log("p2e_games associated_token: %s, amount: %d", associated_token_account_of_receiver_p2e_games.toBase58(), _associated_token_account_of_receiver_p2e_games.amount);
  
          let _associated_token_account_of_receiver_community_games = await getTokenAccount(provider, associated_token_account_of_receiver_community_games);
          console.log("community_games associated_token: %s, amount: %d", associated_token_account_of_receiver_community_games.toBase58(), _associated_token_account_of_receiver_community_games.amount);
  
          let _associated_token_account_of_receiver_arena = await getTokenAccount(provider, associated_token_account_of_receiver_arena);
          console.log("arena associated_token: %s, amount: %d", associated_token_account_of_receiver_arena.toBase58(), _associated_token_account_of_receiver_arena.amount);
  
          let _associated_token_account_of_receiver_nft_mining = await getTokenAccount(provider, associated_token_account_of_receiver_nft_mining);
          console.log("nft_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_nft_mining.toBase58(), _associated_token_account_of_receiver_nft_mining.amount);
  
          let _associated_token_account_of_receiver_liquidity_mining = await getTokenAccount(provider, associated_token_account_of_receiver_liquidity_mining);
          console.log("liquidity_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_liquidity_mining.toBase58(), _associated_token_account_of_receiver_liquidity_mining.amount);
  
          let _associated_token_account_of_receiver_marketing_and_sales = await getTokenAccount(provider, associated_token_account_of_receiver_marketing_and_sales);
          console.log("marketing_and_sales associated_token: %s, amount: %d", associated_token_account_of_receiver_marketing_and_sales.toBase58(), _associated_token_account_of_receiver_marketing_and_sales.amount);
  
          let _associated_token_account_of_receiver_ecosystem = await getTokenAccount(provider, associated_token_account_of_receiver_ecosystem);
          console.log("ecosystem associated_token: %s, amount: %d\r\n\r\n", associated_token_account_of_receiver_ecosystem.toBase58(), _associated_token_account_of_receiver_ecosystem.amount);

        } catch (error) {
            console.log(error);
        }

        i++;
      }
    });

  });
});
