import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TokenFaucet } from '../target/types/token_faucet';
import { TokenInstructions } from '@project-serum/serum';
import {
  createMint, createTokenAccountInstrs, getMintInfo, getTokenAccount
} from '@project-serum/common';
import assert from 'assert';

import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from '@solana/spl-token';
import { PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';
import { token } from '@project-serum/anchor/dist/cjs/utils';

const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;
const magic = 0x544b4654;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getExactTime(time) {
  let date = new Date(time);
  let year = date.getFullYear() + '-';
  let month = (date.getMonth()+1 < 10 ? '0' + (date.getMonth()+1) : date.getMonth()+1) + '-';
  let dates = date.getDate() + ' ';
  let hour = date.getHours() + ':';
  let min = date.getMinutes() + ':';
  let second = date.getSeconds();
  return year + month + dates + hour + min + second ;
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

async function createAssociatedTokenAccount(provider, mint, associatedAccount, owner, payer, signer) {

  const tx = new anchor.web3.Transaction();
  tx.add(
    await Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      associatedAccount,
      owner,
      payer
    )
  );
  await provider.send(tx, [signer]);
  return associatedAccount;
}

describe('token-faucet', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();

  anchor.setProvider(provider);

  const program = anchor.workspace.TokenFaucet as Program<TokenFaucet>;
  const tokenDecimals = 9;

  let receiver_arena: anchor.web3.Keypair;
  let receiver_nft_mining: anchor.web3.Keypair;
  let receiver_liquidity_mining: anchor.web3.Keypair;
  let receiver_marketing: anchor.web3.Keypair;
  let receiver_ecosystem: anchor.web3.Keypair;

  let associated_token_account_of_receiver_arena: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_nft_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_liquidity_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_marketing: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_ecosystem: anchor.web3.PublicKey;

  let faucetConfig: anchor.web3.PublicKey;
  let tokenMint: anchor.web3.PublicKey;
  let tokenAuthority: anchor.web3.PublicKey;
  let nonce: number;
  let nonce_config: number;

  before(async () => {
    console.log("\nBefore:");
    receiver_arena = anchor.web3.Keypair.generate();
    receiver_nft_mining = anchor.web3.Keypair.generate();
    receiver_liquidity_mining = anchor.web3.Keypair.generate();
    receiver_marketing = anchor.web3.Keypair.generate();
    receiver_ecosystem = anchor.web3.Keypair.generate();

    [faucetConfig, nonce_config] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("GameYoo-Token")],
      program.programId
    );
    
    [tokenAuthority, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("GYC-Mint-Auth")],
      program.programId
    );

    console.log("-- config pubkey: %s, nonce: %d\n",
      faucetConfig.toBase58(),
      nonce);
    
    tokenMint = await createMint(provider, tokenAuthority, tokenDecimals);
    
    associated_token_account_of_receiver_arena = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      receiver_arena.publicKey
    );

    associated_token_account_of_receiver_nft_mining = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      receiver_nft_mining.publicKey
    );

    associated_token_account_of_receiver_liquidity_mining = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      receiver_liquidity_mining.publicKey
    );

    associated_token_account_of_receiver_marketing = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      receiver_marketing.publicKey
    );

    associated_token_account_of_receiver_ecosystem = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMint,
      receiver_ecosystem.publicKey
    );

    await createAssociatedTokenAccount(
      provider,
      tokenMint,
      associated_token_account_of_receiver_arena,
      receiver_arena.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      tokenMint,
      associated_token_account_of_receiver_nft_mining,
      receiver_nft_mining.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      tokenMint,
      associated_token_account_of_receiver_liquidity_mining,
      receiver_liquidity_mining.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      tokenMint,
      associated_token_account_of_receiver_marketing,
      receiver_marketing.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      tokenMint,
      associated_token_account_of_receiver_ecosystem,
      receiver_ecosystem.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    console.log("mint", tokenMint.toBase58());
    console.log("receiver_arena", receiver_arena.publicKey.toBase58());
    console.log("receiver_nft_mining", receiver_nft_mining.publicKey.toBase58());
    console.log("receiver_liquidity_mining", receiver_liquidity_mining.publicKey.toBase58());
    console.log("receiver_marketing", receiver_marketing.publicKey.toBase58());
    console.log("receiver_ecosystem", receiver_ecosystem.publicKey.toBase58());
    console.log("associated_token_account_of_receiver_arena", associated_token_account_of_receiver_arena.toBase58());
    console.log("associated_token_account_of_receiver_nft_mining", associated_token_account_of_receiver_nft_mining.toBase58());
    console.log("associated_token_account_of_receiver_liquidity_mining", associated_token_account_of_receiver_liquidity_mining.toBase58());
    console.log("associated_token_account_of_receiver_marketing", associated_token_account_of_receiver_marketing.toBase58());
    console.log("associated_token_account_of_receiver_ecosystem", associated_token_account_of_receiver_ecosystem.toBase58());
  });

  describe("#Initialize", () => {
    
    it("Initialize program state once", async () => {

      let listener = program.addEventListener("InitializeEvent", (event, slot) => {
        
        console.log("slot: ", slot);
        console.log("event data: ", getExactTime(event.data.toNumber() * 1000));
        console.log("event status: ", event.status);
      });

      const tx = await program.rpc.initialize(
        nonce, {
        accounts: {
          faucetConfigAccount: faucetConfig,
          user: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: tokenAuthority,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketing: associated_token_account_of_receiver_marketing,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
      }
      );

      console.log("initialize transaction signature", tx);

      const faucetConfigAccount = await program.account.faucetConfigAccount.fetch(faucetConfig);

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
        faucetConfigAccount.receiverMarketing.toBase58(),
        associated_token_account_of_receiver_marketing.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.receiverEcosystem.toBase58(),
        associated_token_account_of_receiver_ecosystem.toBase58()
      );

      assert.strictEqual(
        faucetConfigAccount.nonce,
        nonce
      );

      await program.removeEventListener(listener);
    });
  });
  
  describe("#Drip", () => {

    it("Drip once", async () => {

      await sleep(6000);

      const mintInfo = await getMintInfo(provider, tokenMint);

      assert.strictEqual(
        mintInfo.mintAuthority.toBase58(),
        tokenAuthority.toBase58()
      );

      let listener = program.addEventListener("DripEvent", (event, slot) => {
        console.log("slot: ", slot);
        console.log("event data: ", event.data.toNumber() / 1e9);
        console.log("event status: ", event.status);
      });

      const tx = await program.rpc.drip({
        accounts: {
          faucetConfigAccount: faucetConfig,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          tokenMint: tokenMint,
          tokenAuthority: mintInfo.mintAuthority,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
          receiverMarketing: associated_token_account_of_receiver_marketing,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
        },
        signers: [
        ],
      });

      console.log("drip transaction signature", tx);

      let _associated_token_account_of_receiver_arena = await getTokenAccount(provider, associated_token_account_of_receiver_arena);
      console.log("arena associated_token: %s, amount: %d", associated_token_account_of_receiver_arena.toBase58(), _associated_token_account_of_receiver_arena.amount);

      let _associated_token_account_of_receiver_nft_mining = await getTokenAccount(provider, associated_token_account_of_receiver_nft_mining);
      console.log("nft_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_nft_mining.toBase58(), _associated_token_account_of_receiver_nft_mining.amount);

      let _associated_token_account_of_receiver_liquidity_mining = await getTokenAccount(provider, associated_token_account_of_receiver_liquidity_mining);
      console.log("liquidity_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_liquidity_mining.toBase58(), _associated_token_account_of_receiver_liquidity_mining.amount);

      let _associated_token_account_of_receiver_marketing = await getTokenAccount(provider, associated_token_account_of_receiver_marketing);
      console.log("marketing_and_sales associated_token: %s, amount: %d", associated_token_account_of_receiver_marketing.toBase58(), _associated_token_account_of_receiver_marketing.amount);

      let _associated_token_account_of_receiver_ecosystem = await getTokenAccount(provider, associated_token_account_of_receiver_ecosystem);
      console.log("ecosystem associated_token: %s, amount: %d", associated_token_account_of_receiver_ecosystem.toBase58(), _associated_token_account_of_receiver_ecosystem.amount);
    
      await program.removeEventListener(listener);
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

          let listener = program.addEventListener("DripEvent", (event, slot) => {
            console.log("slot: ", slot);
            console.log("event data: ", event.data.toNumber() / 1e9);
            console.log("event status: ", event.status);
          });
  
          const tx = await program.rpc.drip({
            accounts: {
              faucetConfigAccount: faucetConfig,
              tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
              tokenMint: tokenMint,
              tokenAuthority: mintInfo.mintAuthority,
              receiverArena: associated_token_account_of_receiver_arena,
              receiverNftMining: associated_token_account_of_receiver_nft_mining,
              receiverLiquidityMining: associated_token_account_of_receiver_liquidity_mining,
              receiverMarketing: associated_token_account_of_receiver_marketing,
              receiverEcosystem: associated_token_account_of_receiver_ecosystem,
              clock: anchor.web3.SYSVAR_CLOCK_PUBKEY
            },
            signers: [
            ],
          });
  
          console.log("drip transaction signature: %s, index: %d ", tx, i);
  
          let _associated_token_account_of_receiver_arena = await getTokenAccount(provider, associated_token_account_of_receiver_arena);
          console.log("arena associated_token: %s, amount: %d", associated_token_account_of_receiver_arena.toBase58(), _associated_token_account_of_receiver_arena.amount);
  
          let _associated_token_account_of_receiver_nft_mining = await getTokenAccount(provider, associated_token_account_of_receiver_nft_mining);
          console.log("nft_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_nft_mining.toBase58(), _associated_token_account_of_receiver_nft_mining.amount);
  
          let _associated_token_account_of_receiver_liquidity_mining = await getTokenAccount(provider, associated_token_account_of_receiver_liquidity_mining);
          console.log("liquidity_mining associated_token: %s, amount: %d", associated_token_account_of_receiver_liquidity_mining.toBase58(), _associated_token_account_of_receiver_liquidity_mining.amount);
  
          let _associated_token_account_of_receiver_marketing = await getTokenAccount(provider, associated_token_account_of_receiver_marketing);
          console.log("marketing associated_token: %s, amount: %d", associated_token_account_of_receiver_marketing.toBase58(), _associated_token_account_of_receiver_marketing.amount);
  
          let _associated_token_account_of_receiver_ecosystem = await getTokenAccount(provider, associated_token_account_of_receiver_ecosystem);
          console.log("ecosystem associated_token: %s, amount: %d\r\n\r\n", associated_token_account_of_receiver_ecosystem.toBase58(), _associated_token_account_of_receiver_ecosystem.amount);

          await program.removeEventListener(listener);

        } catch (error) {
            console.log(error);
        }

        i++;
      }
    });
  });
});
