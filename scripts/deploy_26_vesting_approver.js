const { ethers } = require("hardhat");
const { addresses, network } = require("../utils/address");

async function main() {
  let deployer = '';
  const sweeprAddress = addresses.sweepr;
  const sweeprAddress = addresses.sweepr;

  if (network.type === "0") { // local
    [deployer] = await ethers.getSigners();
    deployer = deployer.address;
  } else {
    deployer = addresses.owner;
  }

  console.log(`Deploying contracts on ${network.name} with the account: ${deployer}`);

  const distributorApproverInstance = await ethers.getContractFactory("TokenDistributorApprover");
  const distributorApproverContract = await distributorApproverInstance.deploy(sweeprAddress);

  console.log("VestingApprover deployed to:", distributorApproverContract.address);
  console.log(`\nnpx hardhat verify --network ${network.name} ${distributorApproverContract.address} ${sweeprAddress}`);
}

main();
