const { ethers } = require('hardhat');
const { expect } = require("chai");
const { addresses, chainId } = require("../utils/address");

contract('Aave V2 Asset - Local', async (accounts) => {
    // Test contract only on the ethereum mainnet due to some libraries.
    if (Number(chainId) > 1) return;

    // Variables
    ZERO = 0;
    maxBorrow = ethers.utils.parseUnits("100", 18);
    depositAmount = 100e6;
    minEquityRatio = 10e4; // 10%
    spreadFee = 3e4; // 3%
    liquidatorDiscount = 2e4; // 2%
    callDelay = 432000; // 5 days
    autoInvestMinEquityRatio = 10e4; // 10%
    autoInvestMinAmount = ethers.utils.parseUnits("10", 18);
    autoInvest = true;

    before(async () => {
        [guest] = await ethers.getSigners();

        Sweep = await ethers.getContractFactory("SweepMock");
        const Proxy = await upgrades.deployProxy(Sweep);
        sweep = await Proxy.deployed();

        ERC20 = await ethers.getContractFactory("contracts/Common/ERC20/ERC20.sol:ERC20");
        usdx = await ERC20.attach(addresses.usdc);

        Uniswap = await ethers.getContractFactory("UniswapMock");
        amm = await Uniswap.deploy(sweep.address, usdx.address);
        
        AaveAsset = await ethers.getContractFactory("AaveAsset");
        aaveAsset = await AaveAsset.deploy(
            'Aave Asset',
            sweep.address,
            addresses.usdc,
            addresses.aave_usdc,
            addresses.aaveV2_pool,
            amm.address,
            addresses.multisig
        );

        BORROWER = addresses.multisig;

        await sendEth(BORROWER);

        // config stabilizer
        await impersonate(BORROWER);
        await aaveAsset.connect(user).configure(
            minEquityRatio,
            spreadFee,
            maxBorrow,
            liquidatorDiscount,
            callDelay,
            autoInvestMinEquityRatio,
            autoInvestMinAmount,
            autoInvest,
            "htttp://test.com"
        );
    });

    async function sendEth(account) {
        await hre.network.provider.request({
            method: "hardhat_setBalance",
            params: [account, ethers.utils.parseEther('15').toHexString()]
        });
    }

    // impersonate accounts
    async function impersonate(account) {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [account]
        });
        user = await ethers.getSigner(account);
    }

    describe("Initial Test", async function () {
        it('deposit usdc to the asset', async () => {
            await impersonate(addresses.usdc);
            await usdx.connect(user).transfer(aaveAsset.address, depositAmount);
            expect(await usdx.balanceOf(aaveAsset.address)).to.equal(depositAmount)
        });

        it('invest and divest to the Comp', async () => {
            await impersonate(BORROWER);
            // Invest usdx
            expect(await aaveAsset.assetValue()).to.equal(ZERO);
            await expect(aaveAsset.connect(guest).invest(depositAmount)).to.be.revertedWithCustomError(aaveAsset, 'OnlyBorrower');
            await aaveAsset.connect(user).invest(depositAmount);
            expect(await aaveAsset.assetValue()).to.above(ZERO);

            // Delay 100 days
            await network.provider.send("evm_increaseTime", [8640000]);
            await network.provider.send("evm_mine");

            // Divest usdx
            divestAmount = 200 * 1e6;
            await expect(aaveAsset.connect(guest).divest(divestAmount)).to.be.revertedWithCustomError(aaveAsset, 'OnlyBorrower');
            await aaveAsset.connect(user).divest(divestAmount);
            expect(await aaveAsset.assetValue()).to.equal(ZERO);
        });
    });
});