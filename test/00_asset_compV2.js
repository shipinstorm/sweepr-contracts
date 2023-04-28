const { ethers } = require('hardhat');
const { expect } = require("chai");
const { addresses, chainId } = require("../utils/address");
const { sendEth, impersonate, increaseTime } = require("../utils/helper_functions");

contract('Compound V2 Asset - Local', async () => {
    // Compound only work on the ethereum mainnet due to oracle.
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
        [guest, lzEndpoint] = await ethers.getSigners();

        Sweep = await ethers.getContractFactory("SweepMock");
        const Proxy = await upgrades.deployProxy(Sweep, [lzEndpoint.address]);
        sweep = await Proxy.deployed();

        ERC20 = await ethers.getContractFactory("contracts/Common/ERC20/ERC20.sol:ERC20");
        usdx = await ERC20.attach(addresses.usdc);
        comp = await ERC20.attach(addresses.comp);

        Uniswap = await ethers.getContractFactory("UniswapMock");
        amm = await Uniswap.deploy(sweep.address);

        USDOracle = await ethers.getContractFactory("AggregatorMock");
        usdOracle = await USDOracle.deploy();

        CompoundAsset = await ethers.getContractFactory("CompV2Asset");
        compAsset = await CompoundAsset.deploy(
            'Compound Asset',
            sweep.address,
            addresses.usdc,
            addresses.comp,
            addresses.comp_cusdc,
            addresses.comp_control,
            amm.address,
            addresses.multisig,
            usdOracle.address
        );

        BORROWER = addresses.multisig;

        await sendEth(BORROWER);

        // config stabilizer
        user = await impersonate(BORROWER);
        await compAsset.connect(user).configure(
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

    describe("Initial Test", async function () {
        it('deposit usdc to the asset', async () => {
            user = await impersonate(addresses.usdc);
            await usdx.connect(user).transfer(compAsset.address, depositAmount);
            expect(await usdx.balanceOf(compAsset.address)).to.equal(depositAmount)
        });

        it('invest and divest to the Comp', async () => {
            user = await impersonate(BORROWER);
            // Invest usdx
            expect(await compAsset.assetValue()).to.equal(ZERO);
            await expect(compAsset.connect(guest).invest(depositAmount))
                .to.be.revertedWithCustomError(compAsset, 'OnlyBorrower');
            await compAsset.connect(user).invest(depositAmount);
            expect(await compAsset.assetValue()).to.above(ZERO);

            // Delay 100 days
            await increaseTime(8640000);

            // Collect Reward
            expect(await comp.balanceOf(user.address)).to.equal(ZERO);
            await compAsset.connect(user).collect();
            expect(await comp.balanceOf(user.address)).to.above(ZERO);

            // Divest usdx
            divestAmount = 200 * 1e6;
            await expect(compAsset.connect(guest).divest(divestAmount))
                .to.be.revertedWithCustomError(compAsset, 'OnlyBorrower');
            await compAsset.connect(user).divest(divestAmount);
            expect(await compAsset.assetValue()).to.equal(ZERO);
        });
    });
});
