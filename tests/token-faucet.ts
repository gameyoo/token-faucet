import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TokenFaucet } from "../target/types/token_faucet";
import { TokenInstructions } from "@project-serum/serum";
import {
  createMint,
  createTokenAccountInstrs,
  getMintInfo,
  getTokenAccount,
} from "@project-serum/common";
import assert from "assert";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
// import { PublicKey, LAMPORTS_PER_SOL, Commitment } from "@solana/web3.js";
// import { token } from "@project-serum/anchor/dist/cjs/utils";

const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;
const magic = 0x544b4654;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExactTime(time) {
  let date = new Date(time);
  let year = date.getFullYear() + "-";
  let month =
    (date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1) + "-";
  let dates = date.getDate() + " ";
  let hour = date.getHours() + ":";
  let min = date.getMinutes() + ":";
  let second = date.getSeconds();
  return year + month + dates + hour + min + second;
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

async function createAssociatedTokenAccount(
  provider,
  mint,
  associatedAccount,
  owner,
  payer,
  signer
) {
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

describe("token-faucet", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();

  anchor.setProvider(provider);

  // Specify the TokenFaucet to test/use.
  const program = anchor.workspace.TokenFaucet as Program<TokenFaucet>;
  const tokenDecimals = 9;

  // Several Token Recipient account.
  let receiver_arena: anchor.web3.Keypair;
  let receiver_nft_mining: anchor.web3.Keypair;
  let receiver_liquidity_mining: anchor.web3.Keypair;
  let receiver_marketing: anchor.web3.Keypair;
  let receiver_ecosystem: anchor.web3.Keypair;

  // Several associated token account.
  let associated_token_account_of_receiver_arena: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_nft_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_liquidity_mining: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_marketing: anchor.web3.PublicKey;
  let associated_token_account_of_receiver_ecosystem: anchor.web3.PublicKey;

  // config account of program.
  let config: anchor.web3.PublicKey;

  // GYC token mint.
  let mint: anchor.web3.PublicKey;
  let mintAuthority: anchor.web3.PublicKey;
  let bump: number;
  //let nonce_config: number;

  before(async () => {
    console.log(`Before: `);

    // Generate several new random keypair as token [GYC] recipient.
    receiver_arena = anchor.web3.Keypair.generate();
    receiver_nft_mining = anchor.web3.Keypair.generate();
    receiver_liquidity_mining = anchor.web3.Keypair.generate();
    receiver_marketing = anchor.web3.Keypair.generate();
    receiver_ecosystem = anchor.web3.Keypair.generate();

    // Get config account address; it's PDA.
    [config] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("GameYoo-Token")],
      program.programId
    );

    // Get mint authority address; it's PDA.
    [mintAuthority, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("GYC-Mint-Auth")],
      program.programId
    );

    // Create a new random token mint.
    mint = await createMint(provider, mintAuthority, tokenDecimals);

    /*
        Get several associated token account address.
    */
    associated_token_account_of_receiver_arena =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        receiver_arena.publicKey
      );

    associated_token_account_of_receiver_nft_mining =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        receiver_nft_mining.publicKey
      );

    associated_token_account_of_receiver_liquidity_mining =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        receiver_liquidity_mining.publicKey
      );

    associated_token_account_of_receiver_marketing =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        receiver_marketing.publicKey
      );

    associated_token_account_of_receiver_ecosystem =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        receiver_ecosystem.publicKey
      );

    /*
        Create associated token account for several recipient.
    */
    await createAssociatedTokenAccount(
      provider,
      mint,
      associated_token_account_of_receiver_arena,
      receiver_arena.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      mint,
      associated_token_account_of_receiver_nft_mining,
      receiver_nft_mining.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      mint,
      associated_token_account_of_receiver_liquidity_mining,
      receiver_liquidity_mining.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      mint,
      associated_token_account_of_receiver_marketing,
      receiver_marketing.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    await createAssociatedTokenAccount(
      provider,
      mint,
      associated_token_account_of_receiver_ecosystem,
      receiver_ecosystem.publicKey,
      provider.wallet.publicKey,
      provider.wallet.payer
    );

    console.log(`
config: ${config.toBase58()}
bump: ${bump}
mint: ${mint.toBase58()}
mintAuthority: ${mintAuthority.toBase58()}
receiver_arena: ${receiver_arena.publicKey.toBase58()}
receiver_nft_mining: ${receiver_nft_mining.publicKey.toBase58()}
receiver_liquidity_mining: ${receiver_liquidity_mining.publicKey.toBase58()}
receiver_marketing: ${receiver_marketing.publicKey.toBase58()}
receiver_ecosystem: ${receiver_ecosystem.publicKey.toBase58()}
associated_token_account_of_receiver_arena:  ${associated_token_account_of_receiver_arena.toBase58()}
associated_token_account_of_receiver_nft_mining: ${associated_token_account_of_receiver_nft_mining.toBase58()}
associated_token_account_of_receiver_liquidity_mining: ${associated_token_account_of_receiver_liquidity_mining.toBase58()}
associated_token_account_of_receiver_marketing: ${associated_token_account_of_receiver_marketing.toBase58()}
associated_token_account_of_receiver_ecosystem: ${associated_token_account_of_receiver_ecosystem.toBase58()}
`);
  });

  describe("#Initialize", () => {
    it("Initialize program state once", async () => {
      // Listen Initialize event of on-chain program.
      let listener = program.addEventListener(
        "InitializeEvent",
        (event, slot) => {
          console.log(
            `InitializeEvent time: ${getExactTime(
              event.timestamp.toNumber() * 1000
            )}
status_code: ${event.statusCode}
status_desc: ${event.statusDesc}
mint: ${event.mint.toBase58()}
mint_authority: ${event.mintAuthority.toBase58()}
receiver_arena: ${event.receiverArena.toBase58()}
receiver_nft_mining: ${event.receiverNftMining.toBase58()}
receiver_liquidity_mining: ${event.receiverLiquidityMining.toBase58()}
receiver_marketing: ${event.receiverMarketing.toBase58()}
receiver_ecosystem: ${event.receiverEcosystem.toBase58()}
current_block_height: ${event.currentBlockHeight}
last_gen_block_timestamp: ${event.lastGenBlockTimestamp}
timestamp: ${event.timestamp}\n`
          );
        }
      );

      // Initialize the state of program by Invoke initialize instruction of on-chain program.
      const tx = await program.rpc.initialize(bump, {
        accounts: {
          configAccount: config,
          payer: provider.wallet.publicKey,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          mint: mint,
          mintAuthority: mintAuthority,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining:
            associated_token_account_of_receiver_liquidity_mining,
          receiverMarketing: associated_token_account_of_receiver_marketing,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          systemProgram: SystemProgram.programId,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
      });

      console.log(`Initialize transaction signature: ${tx}`);

      const configAccount = await program.account.configAccount.fetch(config);

      // Verify.
      assert.strictEqual(configAccount.mint.toBase58(), mint.toBase58());

      assert.strictEqual(
        configAccount.mintAuthority.toBase58(),
        mintAuthority.toBase58()
      );

      assert.strictEqual(
        configAccount.receiverArena.toBase58(),
        associated_token_account_of_receiver_arena.toBase58()
      );

      assert.strictEqual(
        configAccount.receiverNftMining.toBase58(),
        associated_token_account_of_receiver_nft_mining.toBase58()
      );

      assert.strictEqual(
        configAccount.receiverLiquidityMining.toBase58(),
        associated_token_account_of_receiver_liquidity_mining.toBase58()
      );

      assert.strictEqual(
        configAccount.receiverMarketing.toBase58(),
        associated_token_account_of_receiver_marketing.toBase58()
      );

      assert.strictEqual(
        configAccount.receiverEcosystem.toBase58(),
        associated_token_account_of_receiver_ecosystem.toBase58()
      );

      assert.strictEqual(configAccount.bump, bump);

      //await program.removeEventListener(listener);
    });
  });

  describe("#Drip", () => {
    it("Drip once", async () => {
      await sleep(3000);

      const mintInfo = await getMintInfo(provider, mint);

      // Verify mintAuthority.
      assert.strictEqual(
        mintInfo.mintAuthority.toBase58(),
        mintAuthority.toBase58()
      );

      // Listen drip event of on-chain program.
      let listener = program.addEventListener("DripEvent", (event, slot) => {
        console.log(
          `DripEvent time: ${getExactTime(event.timestamp.toNumber() * 1000)}
status_code: ${event.statusCode}
status_desc: ${event.statusDesc}
mint: ${event.mint.toBase58()}
mint_authority: ${event.mintAuthority.toBase58()}
receiver_arena: ${event.receiverArena.toBase58()}
receiver_nft_mining: ${event.receiverNftMining.toBase58()}
receiver_liquidity_mining: ${event.receiverLiquidityMining.toBase58()}
receiver_marketing: ${event.receiverMarketing.toBase58()}
receiver_ecosystem: ${event.receiverEcosystem.toBase58()}
current_block_height: ${event.currentBlockHeight}
last_gen_block_timestamp: ${event.lastGenBlockTimestamp}
receiverArenaAmount: ${event.receiverArenaAmount}
receiverNftMiningAmount: ${event.receiverNftMiningAmount}
receiverLiquidityMiningAmount: ${event.receiverLiquidityMiningAmount}
receiverMarketingAmount: ${event.receiverMarketingAmount}
receiverEcosystemAmount: ${event.receiverEcosystemAmount}
intervals: ${event.intervals}
supply: ${event.supply}
timestamp: ${event.timestamp}\n`
        );
      });

      // Mint token to several recipient by Invoke drip instruction of on-chain program.
      const tx = await program.rpc.drip({
        accounts: {
          configAccount: config,
          tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
          mint: mint,
          mintAuthority: mintInfo.mintAuthority,
          receiverArena: associated_token_account_of_receiver_arena,
          receiverNftMining: associated_token_account_of_receiver_nft_mining,
          receiverLiquidityMining:
            associated_token_account_of_receiver_liquidity_mining,
          receiverMarketing: associated_token_account_of_receiver_marketing,
          receiverEcosystem: associated_token_account_of_receiver_ecosystem,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        },
        signers: [],
      });

      console.log(`drip transaction signature: ${tx}`);

      // Get and print associated token account's amount of several recipient.
      let _associated_token_account_of_receiver_arena = await getTokenAccount(
        provider,
        associated_token_account_of_receiver_arena
      );
      console.log(
        `arena associated_token: ${associated_token_account_of_receiver_arena.toBase58()}, amount: ${
          _associated_token_account_of_receiver_arena.amount
        }`
      );

      let _associated_token_account_of_receiver_nft_mining =
        await getTokenAccount(
          provider,
          associated_token_account_of_receiver_nft_mining
        );

      console.log(
        `nft_mining associated_token: ${associated_token_account_of_receiver_nft_mining.toBase58()}, amount: ${
          _associated_token_account_of_receiver_nft_mining.amount
        }`
      );

      let _associated_token_account_of_receiver_liquidity_mining =
        await getTokenAccount(
          provider,
          associated_token_account_of_receiver_liquidity_mining
        );

      console.log(
        `liquidity_mining associated_token: ${associated_token_account_of_receiver_liquidity_mining.toBase58()}, amount: ${
          _associated_token_account_of_receiver_liquidity_mining.amount
        }`
      );

      let _associated_token_account_of_receiver_marketing =
        await getTokenAccount(
          provider,
          associated_token_account_of_receiver_marketing
        );

      console.log(
        `marketing_and_sales associated_token: ${associated_token_account_of_receiver_marketing.toBase58()}, amount: ${
          _associated_token_account_of_receiver_marketing.amount
        }`
      );

      let _associated_token_account_of_receiver_ecosystem =
        await getTokenAccount(
          provider,
          associated_token_account_of_receiver_ecosystem
        );

      console.log(
        `ecosystem associated_token: ${associated_token_account_of_receiver_ecosystem.toBase58()}, amount: ${
          _associated_token_account_of_receiver_ecosystem.amount
        }`
      );

      await program.removeEventListener(listener);
    });

    it("Drip 100 times", async () => {
      let i = 1;

      let listener = program.addEventListener("DripEvent", (event, slot) => {
        console.log(
          `DripEvent time: ${getExactTime(event.timestamp.toNumber() * 1000)}
status_code: ${event.statusCode}
status_desc: ${event.statusDesc}
mint: ${event.mint.toBase58()}
mint_authority: ${event.mintAuthority.toBase58()}
receiver_arena: ${event.receiverArena.toBase58()}
receiver_nft_mining: ${event.receiverNftMining.toBase58()}
receiver_liquidity_mining: ${event.receiverLiquidityMining.toBase58()}
receiver_marketing: ${event.receiverMarketing.toBase58()}
receiver_ecosystem: ${event.receiverEcosystem.toBase58()}
current_block_height: ${event.currentBlockHeight}
last_gen_block_timestamp: ${event.lastGenBlockTimestamp}
receiverArenaAmount: ${event.receiverArenaAmount}
receiverNftMiningAmount: ${event.receiverNftMiningAmount}
receiverLiquidityMiningAmount: ${event.receiverLiquidityMiningAmount}
receiverMarketingAmount: ${event.receiverMarketingAmount}
receiverEcosystemAmount: ${event.receiverEcosystemAmount}
intervals: ${event.intervals}
supply: ${event.supply}
timestamp: ${event.timestamp}\n`
        );
      });

      // Minted tokens 100 times in a cycle for several receivers
      while (i <= 100) {
        await sleep(3000);

        try {
          const mintInfo = await getMintInfo(provider, mint);

          assert.strictEqual(
            mintInfo.mintAuthority.toBase58(),
            mintAuthority.toBase58()
          );

          const tx = await program.rpc.drip({
            accounts: {
              configAccount: config,
              tokenProgram: TokenInstructions.TOKEN_PROGRAM_ID,
              mint: mint,
              mintAuthority: mintInfo.mintAuthority,
              receiverArena: associated_token_account_of_receiver_arena,
              receiverNftMining:
                associated_token_account_of_receiver_nft_mining,
              receiverLiquidityMining:
                associated_token_account_of_receiver_liquidity_mining,
              receiverMarketing: associated_token_account_of_receiver_marketing,
              receiverEcosystem: associated_token_account_of_receiver_ecosystem,
              clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            },
            signers: [],
          });

          console.log(`Drip transaction signature: ${tx}, index: ${i}`);

          // Get and print associated token account's amount of several recipient.
          let _associated_token_account_of_receiver_arena =
            await getTokenAccount(
              provider,
              associated_token_account_of_receiver_arena
            );
          console.log(
            `arena associated_token: ${associated_token_account_of_receiver_arena.toBase58()}, amount: ${
              _associated_token_account_of_receiver_arena.amount
            }`
          );

          let _associated_token_account_of_receiver_nft_mining =
            await getTokenAccount(
              provider,
              associated_token_account_of_receiver_nft_mining
            );

          console.log(
            `nft_mining associated_token: ${associated_token_account_of_receiver_nft_mining.toBase58()}, amount: ${
              _associated_token_account_of_receiver_nft_mining.amount
            }`
          );

          let _associated_token_account_of_receiver_liquidity_mining =
            await getTokenAccount(
              provider,
              associated_token_account_of_receiver_liquidity_mining
            );

          console.log(
            `liquidity_mining associated_token: ${associated_token_account_of_receiver_liquidity_mining.toBase58()}, amount: ${
              _associated_token_account_of_receiver_liquidity_mining.amount
            }`
          );

          let _associated_token_account_of_receiver_marketing =
            await getTokenAccount(
              provider,
              associated_token_account_of_receiver_marketing
            );

          console.log(
            `marketing_and_sales associated_token: ${associated_token_account_of_receiver_marketing.toBase58()}, amount: ${
              _associated_token_account_of_receiver_marketing.amount
            }`
          );

          let _associated_token_account_of_receiver_ecosystem =
            await getTokenAccount(
              provider,
              associated_token_account_of_receiver_ecosystem
            );

          console.log(
            `ecosystem associated_token: ${associated_token_account_of_receiver_ecosystem.toBase58()}, amount: ${
              _associated_token_account_of_receiver_ecosystem.amount
            }`
          );
        } catch (error) {
          console.log(error);
        }

        i++;
      }

      //await program.removeEventListener(listener);
    });
  });
});
