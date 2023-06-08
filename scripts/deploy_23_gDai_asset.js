const { ethers } = require("hardhat");
const { addresses, network } = require("../utils/address");

async function main() {
  let deployer = '';
  const name = 'gDAI Asset';
  const sweep = addresses.sweep;
  const usdc = addresses.usdc;
  const gDai = addresses.gDai;
  const borrower = addresses.borrower;
  
  [deployer] = await ethers.getSigners();
  deployer = deployer.address;

  console.log(`Deploying contracts on ${network.name} with the account: ${deployer}`);

  const Asset = await ethers.getContractFactory("GDAIAsset");
  const asset = await Asset.deploy(
    name, 
    sweep, 
    usdc, 
    gDai, 
    borrower
  );

  console.log("Backed Asset deployed to:", asset.address);
  console.log(`\nnpx hardhat verify --network ${network.name} ${asset.address} "${name}" ${sweep} ${usdc} ${gDai} ${borrower}`)
}

main();

