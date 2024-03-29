const { ethers } = require("hardhat");
const { addresses, network } = require("../utils/address");

async function main() {
    [deployer] = await ethers.getSigners();
    deployer = deployer.address;

    const sweep = addresses.sweep;
    const usdc = addresses.usdc;
    const oracle = addresses.oracle_usdc_usd;
    const sequencer = addresses.sequencer_feed;
    const fee = 500;
    const frequency = 86400;

    console.log(`Deploying contracts on ${network.name} with the account: ${deployer}`);

    const uniswapAMMInstance = await ethers.getContractFactory("UniswapAMM");
    const amm = await uniswapAMMInstance.deploy(
        sweep,
        usdc,
        sequencer,
        fee,
        oracle,
        frequency
    );

    console.log(`UniswapAMM Deployed to:${amm.address}`);
    console.log(`\nnpx hardhat verify --network ${network.name} ${amm.address} ${sweep} ${usdc} ${sequencer} ${fee} ${oracle} ${frequency}`);

    const SweepCoin = await ethers.getContractAt("SweepCoin", sweep);
    await SweepCoin.setAMM(amm.address);
}

main();
