const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Const, toBN } = require("../utils/helper_functions");

contract("Stabilizer's waterfall workflow", async function () {
  before(async () => {
    [owner, borrower, wallet, treasury, multisig, lzEndpoint] = await ethers.getSigners();
    priceHigh = 1.01e6;
    priceLow = 0.99e6;
    price = 1e6;

    usdxAmount = 1000e6;
    sweepAmount = toBN("1000", 18);
    maxBorrow = toBN("100", 18);
    // ------------- Deployment of contracts -------------
    Sweep = await ethers.getContractFactory("SweepMock");
    const Proxy = await upgrades.deployProxy(Sweep, [lzEndpoint.address]);
    sweep = await Proxy.deployed();
    await sweep.setTreasury(treasury.address);

    Token = await ethers.getContractFactory("USDCMock");
    usdx = await Token.deploy();

    USDOracle = await ethers.getContractFactory("AggregatorMock");
    usdOracle = await USDOracle.deploy();

    Uniswap = await ethers.getContractFactory("UniswapMock");
    amm = await Uniswap.deploy(sweep.address, usdOracle.address, Const.ADDRESS_ZERO);

    OffChainAsset = await ethers.getContractFactory("OffChainAsset");
    offChainAsset = await OffChainAsset.deploy(
      'OffChain Asset',
      sweep.address,
      usdx.address,
      wallet.address,
      amm.address,
      borrower.address
    );

    await offChainAsset.connect(borrower).configure(
      Const.RATIO,
      Const.SPREAD_FEE,
      maxBorrow,
      Const.DISCOUNT,
      Const.DAYS_5,
      Const.RATIO,
      maxBorrow,
      Const.FALSE,
      Const.URL
    );

    // usd to the borrower to he can invest
    await usdx.transfer(borrower.address, 50e6);
    await sweep.transfer(borrower.address, maxBorrow);

    // owner/borrower/asset approve offChainAsset to spend
    await usdx.approve(offChainAsset.address, usdxAmount);
    await usdx.connect(borrower).approve(offChainAsset.address, usdxAmount);

    // add offChainAsset to minter list
    await sweep.addMinter(offChainAsset.address, maxBorrow);
  });

  describe("initial state", async function () {
    it("globals are set to defaults", async function () {
      expect(await usdx.balanceOf(borrower.address)).to.equal(50e6);
      expect(await usdx.allowance(borrower.address, offChainAsset.address)).to.equal(usdxAmount);

      expect(await usdx.balanceOf(offChainAsset.address)).to.equal(Const.ZERO);
      expect(await sweep.balanceOf(offChainAsset.address)).to.equal(Const.ZERO);
      expect(await offChainAsset.sweep_borrowed()).to.equal(Const.ZERO);

      expect(await offChainAsset.paused()).to.equal(Const.FALSE);
      expect(await offChainAsset.assetValue()).to.equal(Const.ZERO);
      expect(await offChainAsset.min_equity_ratio()).to.equal(Const.RATIO);

      expect(await offChainAsset.borrower()).to.equal(borrower.address);

      expect(await offChainAsset.SWEEP()).to.equal(sweep.address);
      expect(await offChainAsset.usdx()).to.equal(usdx.address);
    });
  });

  describe("deposit + invest + withdraw circuit", async function () {
    describe("when asking for less sweep than the max borrow", async function () {
      it("deposits 10 usd", async function () {
        await usdx.connect(borrower).transfer(offChainAsset.address, 10e6);
        expect(await usdx.balanceOf(offChainAsset.address)).to.equal(10e6);
        expect(await offChainAsset.getEquityRatio()).to.equal(1e6); // 100%
      });

      it("mints and sells requested sweeps, and sends investment to the asset", async function () {
        amount = toBN("90", 18);

        await offChainAsset.connect(borrower).borrow(amount);
        expect(await usdx.balanceOf(offChainAsset.address)).to.equal(10e6);
        expect(await sweep.balanceOf(offChainAsset.address)).to.equal(amount);
        expect(await offChainAsset.sweep_borrowed()).to.equal(amount);
        expect(await offChainAsset.getEquityRatio()).to.equal(1e5); // 10%

        await offChainAsset.connect(borrower).invest(10e6, amount);

        expect(await sweep.balanceOf(offChainAsset.address)).to.equal(Const.ZERO);
        expect(await sweep.balanceOf(wallet.address)).to.equal(amount);
        expect(await usdx.balanceOf(offChainAsset.address)).to.equal(Const.ZERO);
        expect(await usdx.balanceOf(wallet.address)).to.equal(10e6);
        expect(await offChainAsset.sweep_borrowed()).to.equal(amount);
        expect(await offChainAsset.getEquityRatio()).to.equal(1e5); // 10%
      });
    });

    describe("repaying in 3 payments", async function () {
      it("simulates change of usdx for sweep and 10% interest", async function () {
        await sweep.setCollateralAgent(borrower.address);

        amount = toBN("20", 18);
        await sweep.transfer(wallet.address, amount);
        balance = await sweep.balanceOf(wallet.address);
        balance = await sweep.convertToUSD(balance);

        await offChainAsset.connect(borrower).updateValue(balance);
      });

      it("repays less than the senior debt, buys sweeps and burns it", async function () {
        amount = toBN("80", 18);
        await offChainAsset.connect(borrower).divest(amount);
        await sweep.connect(wallet).transfer(offChainAsset.address, amount);
        expect(await sweep.balanceOf(offChainAsset.address)).to.equal(amount);

        await offChainAsset.connect(borrower).repay(amount);
        expect(await offChainAsset.getEquityRatio()).to.equal(909090); // 90%
      });

      it("repays more than the senior debt", async function () {
        amount = toBN("15", 18);
        burnAmount = toBN("10", 18);
        await offChainAsset.connect(borrower).divest(amount);
        await sweep.connect(wallet).transfer(offChainAsset.address, amount);

        await offChainAsset.connect(borrower).repay(burnAmount);
        expect(await offChainAsset.getEquityRatio()).to.equal(1e6); // 100%
      });

      it("divests to cover entire loan amount", async function () {
        await offChainAsset.connect(borrower).divest(amount);
        await sweep.connect(wallet).transfer(offChainAsset.address, amount);
        expect(await offChainAsset.getEquityRatio()).to.equal(1e6); // 100%
      });
    });

    describe("borrower takes the profits", async function () {
      it("checks state after borrower withdraws", async function () {
        await offChainAsset.connect(borrower).withdraw(sweep.address, burnAmount.mul(2));
      });
    });
  });

  describe("borrower deposit and withdraw without investing", async function () {
    it("checks that borrower withdraw the deposit", async function () {
      borrowerBalance = await sweep.balanceOf(borrower.address);
      depositAmount = toBN("10", 18);;
      await sweep.connect(borrower).transfer(offChainAsset.address, depositAmount);
      await offChainAsset.connect(borrower).withdraw(sweep.address, depositAmount);
    });
  });
});
