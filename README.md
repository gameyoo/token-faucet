 <h1 align='center'>token-faucet</h1>

token-faucet is smart contract or program for follow the block to generate the corresponding tokens.

<h2>Program</h2>
<h3>Running the program on Localnet</h3>
Switch to localnet.

>solana config set --url=localhost 

Run
>rm -rf test-ledger && solana-test-validator

This will spin up a local validator that our client interacts with. More info on setting up a local validator can be found [here.][1]

<h2>Anchor program building and deployment</h2>

In order to build the program use following command.
>anchor build

Now you can deploy it.
>anchor deploy

<h2>Running progrma tests</h2>

In order to build the program use following command.
>npm install -g ts-mocha typescript

>npm install

Run all tests by using following command.
>anchor test

  [1]: https://docs.solana.com/developing/test-validator
 
