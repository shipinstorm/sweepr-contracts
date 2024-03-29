const { ethers, upgrades } = require('hardhat');
const { addresses, network } = require("../utils/address");
const LZ_ENDPOINTS = require("../utils/layerzero/layerzeroEndpoints.json")

async function main() {
	let lzEndpointAddress, lzEndpoint, LZEndpointMock
	[deployer] = await ethers.getSigners();
	deployer = deployer.address;

	if (network.type === "0") { // local
		LZEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        lzEndpoint = await LZEndpointMock.deploy(1)
        lzEndpointAddress = lzEndpoint.address
	} else {
		lzEndpointAddress = LZ_ENDPOINTS[hre.network.name]
	}

	console.log(`Deploying contracts on ${network.name} with the account: ${deployer}`);

	const sweepInstance = await ethers.getContractFactory("SweepCoin");
	const sweep = await upgrades.deployProxy(sweepInstance, [
		lzEndpointAddress,
		addresses.multisig,
		750 // 0.00274% daily rate = 1% yearly rate
	], { initializer: 'initialize' });

	console.log("Sweep deployed to:", sweep.address);
    console.log(`\nnpx hardhat verify --network ${network.name} ${sweep.address}`)
}

main();
