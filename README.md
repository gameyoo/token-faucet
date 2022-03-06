# 🔫 TokenFaucet of GameYoo ⛏

[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/gameyoo/token-faucet/blob/master/LICENSE)
[![Contributors](https://img.shields.io/github/contributors/gameyoo/token-faucet)](https://github.com/gameyoo/token-faucet/graphs/contributors)

<p align="center">
    <img src="./images/banner.png" />
</p>

<p align="center">
    An minting GameYoo platform tokens programs on Solana.
</p>

This project demonstrates how to write a program that minting tokens on the solana blockchain by simulating following block generation.

The project comprises of:

* An on-chain minting tokens program
* A set of test cases for interacting with the on-chain program

## Prerequisites

* [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [NodeJS & NPM](https://nodejs.org/en/) version 14+
* [Rust](https://rustup.rs/) - install [from here](https://www.rust-lang.org/tools/install#), it's pretty straightforward.
* [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) - follow this to install.
* [Anchor](https://project-serum.github.io/anchor/) - follow the [easy installation steps](https://project-serum.github.io/anchor/getting-started/installation.html).

## Install Rust && Solana Cli && Anchor

* See [this doc](https://github.com/solana-labs/solana#) for more details

### Install rustup

```sh
$ curl https://sh.rustup.rs -sSf | sh
...

$ rustup component add rustfmt
...

$ rustup update
...

$ rustup install 1.61.0
...
```

### Install solana-cli

* See [this doc](https://docs.solana.com/cli/install-solana-cli-tools) for more details

```sh
$ sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
...

$ solana -V
solana-cli 1.8.17 (src:f63505df; feat:3263758455)

$ solana-keygen new
...
```

Config to local cluster:

```sh
solana config set --url localhost
...
```

### Install `rust-analyzer` (Optional)

* See [this repo](https://github.com/rust-analyzer/rust-analyzer) for more details

`rust-analyzer` can be very handy if you are using Visual Studio Code. For example, the analyzer can help download the missing dependencies for you automatically.

### Install avm & anchor

```sh
$ cargo install --git https://github.com/project-serum/anchor avm --locked --force
...
```

Use latest `anchor` version:

```sh
avm use 0.20.1
```

### Extra Dependencies on Linux(Optional)

You may have to install some extra dependencies on Linux(eg. Ubuntu):

```sh
$ sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential openssl libssl-dev libudev-dev
...

```

### Verify the Installation

Check if Anchor is successfully installed.

```sh
$ anchor --version
anchor-cli 0.20.1
```

## Build and Deployment

* See [this repo](https://github.com/gameyoo/token-faucet) for full code base

Frist,let's clone the repo:

```sh
$ git clone https://github.com/gameyoo/token-faucet.git
...

$ cd token-faucet

$ npm install -g yarn
...

$ yarn
...
```

Run `solana-test-validator` in another terminal session:

```sh
$ cd ~
$ solana-test-validator
Ledger location: test-ledger
Log: test-ledger/validator.log
Identity: 7YbUvia6fEB9yJZbt6o7RhrSQqUQGAAV8anF4rsfhawU
Genesis Hash: 2Md358rLRXS9Q9rYLSzbixxm8nHisbhJAuNsDsMXi9bj
Version: 1.8.17
Shred Version: 56413
Gossip Address: 127.0.0.1:1024
TPU Address: 127.0.0.1:1027
JSON RPC URL: http://127.0.0.1:8899
...
```

Run `solana logs` to fetch logs in another terminal session:

```sh
$ solana logs
Streaming transaction logs. Confirmed commitment
...
```

Next, let's compile the token-faucet program:

```sh
$ anchor build

BPF SDK: ~/.local/share/solana/install/releases/stable-f63505df33b76ed694257b87231c91620f4b8d68/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
cargo-build-bpf child: cargo +bpf build --target bpfel-unknown-unknown --release
...
```

Deploy the program after compilation:

```sh
$ anchor deploy
Deploying workspace: <http://localhost:8899>
Upgrade authority: ~/.config/solana/id.json
Deploying program "token-faucet"...
...
```

> If you encounter an insuffficient fund error, you may have to request for an aidrop:
> ```sh
> $ solana airdrop 1
> ```


### Test

Finally, let's run all tests by using following command:

```sh
$ anchor test
BPF SDK: ~/.local/share/solana/install/releases/stable-f63505df33b76ed694257b87231c91620f4b8d68/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
cargo-build-bpf child: cargo +bpf build --target bpfel-unknown-unknown --release
    Finished release [optimized] target(s) in 2.36
...
    token-faucet
        ✔ Initialize program state once (473ms)
        ✔ Drip once (3488ms)
        ✔ Drip 100 times (342123ms)
3 passing (6m)

✨  Done in 346.084s.
```

We should see all test cases passed,that's it!

## License

GameYoo's tokenfaucet is licensed under the MIT License.
