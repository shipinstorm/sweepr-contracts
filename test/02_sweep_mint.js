const { expect } = require("chai");
const { ethers } = require("hardhat");
const { addresses } = require('../utils/address');
const { toBN, Const } = require("../utils/helper_functions");

contract("Sweep - Mint", async function () {
	before(async () => {
		[owner, receiver, treasury, newAddress, newMinter, lzEndpoint] = await ethers.getSigners();

		TRANSFER_AMOUNT = toBN("100", 18);
		INTEREST_RATE = 5e4; // 5%
		// ------------- Deployment of contracts -------------
		BlacklistApprover = await ethers.getContractFactory("TransferApproverBlacklist");
		WhitelistApprover = await ethers.getContractFactory("TransferApproverWhitelist");
		Sweep = await ethers.getContractFactory("SweepCoin");

		const Proxy = await upgrades.deployProxy(Sweep, [
			lzEndpoint.address,
			addresses.owner,
			2500 // 0.25%
		]);
		sweep = await Proxy.deployed();

		blacklistApprover = await BlacklistApprover.deploy();
		whitelistApprover = await WhitelistApprover.deploy();
	});

	it('add and remove minters', async () => {
		// Add minter
		assets = [
			addresses.aaveV3_pool,
			addresses.asset_offChain,
			addresses.asset_wbtc,
			addresses.asset_weth,
			addresses.asset_uniswap
		];

		await Promise.all(
			assets.map(async (asset) => {
				await sweep.connect(owner).addMinter(asset, TRANSFER_AMOUNT);
			})
		);

		await Promise.all(
			assets.map(async (asset, index) => {
				expect(await sweep.minter_addresses(index)).equal(asset);
			})
		);

		await expect(sweep.connect(lzEndpoint).addMinter(lzEndpoint.address, TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(sweep, "NotGovernance");

		await expect(sweep.connect(owner).addMinter(Const.ADDRESS_ZERO, TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(sweep, "ZeroAddressDetected");

		await expect(sweep.connect(owner).addMinter(lzEndpoint.address, Const.ZERO))
			.to.be.revertedWithCustomError(sweep, "ZeroAmountDetected");

		await expect(sweep.connect(owner).addMinter(assets[0], TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(sweep, "MinterExist");

		// Remove minter
		await sweep.connect(owner).removeMinter(addresses.asset_offChain);

		minters = await sweep.getMinters();

		is_found = Const.FALSE;
		minters.map(async (minter) => {
			if (minter == addresses.asset_offChain) is_found = Const.TRUE;
		})

		expect(is_found).equal(Const.FALSE);
	});

	it('transfers tokens when unpaused and unblacklisted', async () => {
		await sweep.connect(owner).addMinter(newMinter.address, TRANSFER_AMOUNT);
		await sweep.connect(newMinter).minter_mint(newAddress.address, TRANSFER_AMOUNT);

		let receiverBalance = await sweep.balanceOf(receiver.address);
		expect(receiverBalance).to.equal(Const.ZERO);

		await sweep.connect(newAddress).transfer(receiver.address, TRANSFER_AMOUNT)

		expect(await sweep.balanceOf(newAddress.address)).to.equal(Const.ZERO);
		expect(await sweep.balanceOf(receiver.address)).to.equal(TRANSFER_AMOUNT);
	});

	it('reverts transfer when paused', async () => {
		let receiverBalance = await sweep.balanceOf(receiver.address);
		expect(receiverBalance).to.equal(TRANSFER_AMOUNT);

		// Pause sweep
		await expect(sweep.connect(newAddress).pause())
			.to.be.revertedWithCustomError(sweep, "NotMultisig");
		await sweep.connect(owner).pause();

		await expect(sweep.connect(owner).transfer(receiver.address, TRANSFER_AMOUNT))
			.to.be.revertedWith("Pausable: paused");
	});

	it('reverts transfer when receiver is blacklisted', async () => {
		await sweep.connect(owner).unpause();
		await expect(sweep.setTransferApprover(Const.ADDRESS_ZERO))
			.to.be.revertedWithCustomError(sweep, "ZeroAddressDetected");
		await sweep.setTransferApprover(blacklistApprover.address);

		let receiverBalance = await sweep.balanceOf(receiver.address);
		expect(receiverBalance).to.equal(TRANSFER_AMOUNT);
		expect(await blacklistApprover.isBlacklisted(receiver.address)).to.equal(false);

		// Add receiver into blocklist
		await blacklistApprover.connect(owner).blacklist(receiver.address);

		expect(await blacklistApprover.isBlacklisted(receiver.address)).to.equal(true);

		await expect(sweep.connect(owner).transfer(receiver.address, TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(Sweep, 'TransferNotAllowed');
	});

	it('transfers token when receiver is unblacklisted', async () => {
		let receiverBalance = await sweep.balanceOf(receiver.address);
		expect(receiverBalance).to.equal(TRANSFER_AMOUNT);

		// Unblacklist receiver
		await blacklistApprover.connect(owner).unBlacklist(receiver.address);

		await sweep.connect(receiver).transfer(newAddress.address, TRANSFER_AMOUNT)

		expect(await sweep.balanceOf(receiver.address)).to.equal(Const.ZERO);
		expect(await sweep.balanceOf(newAddress.address)).to.equal(TRANSFER_AMOUNT);
	});

	it('transfers token when receiver is whitelisted', async () => {
		await sweep.setTransferApprover(whitelistApprover.address);

		// whitelist receiver
		expect(await whitelistApprover.isWhitelisted(receiver.address)).to.equal(Const.FALSE);
		await whitelistApprover.connect(owner).whitelist(receiver.address);

		await sweep.connect(newAddress).transfer(receiver.address, TRANSFER_AMOUNT)

		expect(await sweep.balanceOf(newAddress.address)).to.equal(Const.ZERO);
		expect(await sweep.balanceOf(receiver.address)).to.equal(TRANSFER_AMOUNT);

		// unwhitelist receiver
		await whitelistApprover.connect(owner).unWhitelist(receiver.address);

		await expect(sweep.connect(receiver).transfer(owner.address, TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(Sweep, 'TransferNotAllowed');
	});

	it('burns Sweeps correctly', async () => {
		MAX_MINT_AMOUNT = toBN("500", 18);
		await sweep.connect(owner).setMinterEnabled(newMinter.address, Const.TRUE);
		await sweep.connect(owner).setMinterMaxAmount(newMinter.address, MAX_MINT_AMOUNT);

		expect(await sweep.balanceOf(newMinter.address)).to.equal(Const.ZERO);
		await sweep.connect(newMinter).minter_mint(newMinter.address, TRANSFER_AMOUNT);
		await expect(sweep.connect(newMinter).minter_mint(newMinter.address, MAX_MINT_AMOUNT))
			.to.be.revertedWithCustomError(sweep, "MintCapReached");

		expect(await sweep.balanceOf(newMinter.address)).to.equal(TRANSFER_AMOUNT);

		await expect(sweep.connect(newMinter).minter_burn_from(MAX_MINT_AMOUNT))
			.to.be.revertedWithCustomError(sweep, "ExceedBurnAmount");
		await sweep.connect(newMinter).minter_burn_from(TRANSFER_AMOUNT);
		expect(await sweep.balanceOf(newMinter.address)).to.equal(Const.ZERO);
	});

	it('allow and disallow minting', async () => {
		// Set new arb_spread
		NEW_ARB_SPREAD = 1e5;
		NEW_TARGET_PRICE = 1e7;
		await sweep.connect(owner).setBalancer(owner.address);
		await sweep.connect(owner).setArbSpread(NEW_ARB_SPREAD);
		await sweep.connect(owner).setTargetPrice(NEW_TARGET_PRICE, NEW_TARGET_PRICE);
		// TODO: change to _amm after new deployment
		await sweep.connect(owner).setAMM(addresses.uniswap_oracle);
		await expect(sweep.connect(newMinter).minter_mint(newAddress.address, TRANSFER_AMOUNT))
			.to.be.revertedWithCustomError(Sweep, 'MintNotAllowed');

		// Set new arb_spread
		NEW_TARGET_PRICE = 1e6;
		await sweep.connect(owner).setTargetPrice(NEW_TARGET_PRICE, NEW_TARGET_PRICE);
		expect(await sweep.balanceOf(newAddress.address)).to.equal(Const.ZERO);
		await sweep.connect(newMinter).minter_mint(newAddress.address, TRANSFER_AMOUNT)
		expect(await sweep.balanceOf(newAddress.address)).to.equal(TRANSFER_AMOUNT);
	});
});
