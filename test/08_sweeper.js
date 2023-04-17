const { expect } = require("chai");
const { ethers, contract } = require("hardhat");

contract("Sweeper", async function () {
	before(async () => {
		[owner, newAddress, newMinter] = await ethers.getSigners();

		// ------------- Deployment of contracts -------------
		Sweep = await ethers.getContractFactory("SweepMock");
		Sweeper = await ethers.getContractFactory("SWEEPER");
		Treasury = await ethers.getContractFactory("Treasury");

		TRANSFER_AMOUNT = ethers.utils.parseUnits("1000", 18);
		PRECISION = 1000000;
		ZERO = 0;

		const Proxy = await upgrades.deployProxy(Sweep);
		sweep = await Proxy.deployed();

		BlacklistApprover = await ethers.getContractFactory("TransferApproverBlacklist");
		blacklistApprover = await BlacklistApprover.deploy(sweep.address);

		await sweep.setTransferApprover(blacklistApprover.address);

    	treasury = await Treasury.deploy(sweep.address);
		sweeper = await Sweeper.deploy(sweep.address, blacklistApprover.address, treasury.address);

		await sweep.setTreasury(treasury.address);
		await sweeper.setAllowMinting(true);
		await sweeper.setAllowBurning(true);
	});

	it('reverts buy Sweeper when treasury percent is greater than target treasury', async () => {
		// set target treasury to 9%
		await sweeper.setTargetTreasury(90000);

		treasurySweep = await sweeper.balanceOf(treasury.address);
		sweepTotal = await sweep.totalSupply();
		targetPrice = await sweep.target_price();
		sweeperPrice = await sweeper.price();

		treasuryPercent = ((treasurySweep + TRANSFER_AMOUNT) * PRECISION) / sweepTotal;
		expect(await sweeper.targetTreasury()).to.lessThanOrEqual(treasuryPercent);

		await expect(sweeper.connect(owner).buySWEEPER(TRANSFER_AMOUNT))
              .to.be.revertedWithCustomError(Sweeper, 'GreaterThanTargetTreasury');
	});

	it('reverts buy Sweeper when caller is not sweep owner in batch sell', async () => {
		await expect(sweeper.connect(newAddress).buySWEEPER(TRANSFER_AMOUNT))
              .to.be.revertedWithCustomError(Sweeper, 'NotAdmin');
	});

	it('buys Sweeper', async () => {
		// set target treasury to 10%
		await sweeper.setTargetTreasury(100000);

		expect(await sweeper.balanceOf(owner.address)).to.equal(ZERO);

		treasurySweep = await sweep.balanceOf(treasury.address);
		sweepTotal = await sweep.totalSupply();
		targetPrice = await sweep.target_price();
		sweeperPrice = await sweeper.price();
		treasuryPercent = ((treasurySweep + TRANSFER_AMOUNT) * PRECISION) / sweepTotal;

		await sweep.connect(owner).approve(sweeper.address, TRANSFER_AMOUNT);
		await sweeper.connect(owner).buySWEEPER(TRANSFER_AMOUNT);

		sweeperAmount = (TRANSFER_AMOUNT * sweeperPrice) / (targetPrice * 1e18);
		ownerSweeperBalance = (await sweeper.balanceOf(owner.address)) / 1e18;

		expect(await sweep.balanceOf(treasury.address)).to.equal(TRANSFER_AMOUNT);
		expect(ownerSweeperBalance).to.equal(sweeperAmount);
	});

	it('reverts sell Sweeper when treasury percent is smaller than target treasury', async () => {
		TRANSFER_AMOUNT = ethers.utils.parseUnits("500", 18); // 500 SWEEPER

		// set target treasury to 10%
		await sweeper.setTargetTreasury(100000);

		treasurySweep = await sweep.balanceOf(treasury.address);
		sweepTotal = await sweep.totalSupply();
		targetPrice = await sweep.target_price();
		sweeperPrice = await sweeper.price();

		treasuryPercent = ((treasurySweep - TRANSFER_AMOUNT) * PRECISION) / sweepTotal;

		expect(await sweeper.targetTreasury()).to.greaterThanOrEqual(treasuryPercent);

		await expect(sweeper.connect(owner).sellSWEEPER(TRANSFER_AMOUNT))
              .to.be.revertedWithCustomError(Sweeper, 'SmallerThanTargetTreasury');
	});

	it('reverts sell Sweeper when sweeper address is not set in treasury', async () => {
		// set target treasury to 1%
		await sweeper.setTargetTreasury(10000);
		// 500 SWEEPER
		TRANSFER_AMOUNT = ethers.utils.parseUnits("500", 18);

		await expect(sweeper.connect(owner).sellSWEEPER(TRANSFER_AMOUNT))
              .to.be.revertedWithCustomError(Treasury, 'NotSWEEPER');
	});

	it('reverts sell Sweeper when caller is not sweep owner in batch sell', async () => {
		await expect(sweeper.connect(newAddress).sellSWEEPER(TRANSFER_AMOUNT))
              .to.be.revertedWithCustomError(Sweeper, 'NotAdmin');
	});

	it('sells Sweeper', async () => {
		TRANSFER_AMOUNT = ethers.utils.parseUnits("500", 18); // 500 SWEEPER

		// set target treasury to 1%
		await sweeper.setTargetTreasury(10000);

		// set sweewper address in treasury
		await treasury.connect(owner).setSWEEPER(sweeper.address);

		treasurySweepBeforeBalance = await sweep.balanceOf(treasury.address) / 1e18; 
		ownerSweepBeforeBalance = await sweep.balanceOf(owner.address) / 1e18;
		ownerSweeperBeforeBalance = await sweeper.balanceOf(owner.address) / 1e18;

		await sweeper.connect(owner).sellSWEEPER(TRANSFER_AMOUNT);

		sweepAmount = (TRANSFER_AMOUNT * targetPrice) / (sweeperPrice * 1e18);
		ownerSweepAfterBalance = Math.round(((await sweep.balanceOf(owner.address)) / 1e18));
		treasurySweepAfterBalance = Math.round(((await sweep.balanceOf(treasury.address)) / 1e18));
		ownerSweeperAfterBalance = Math.round(((await sweeper.balanceOf(owner.address)) / 1e18));

		expect(ownerSweepAfterBalance).to.equal(ownerSweepBeforeBalance + sweepAmount);
		expect(treasurySweepAfterBalance).to.equal(treasurySweepBeforeBalance - sweepAmount);
		expect(ownerSweeperAfterBalance).to.equal(ownerSweeperBeforeBalance - TRANSFER_AMOUNT/1e18);
	});
});