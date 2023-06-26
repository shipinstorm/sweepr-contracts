// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.19;

// ====================================================================
// ========================== TokenAsset.sol ==========================
// ====================================================================

/**
 * @title Token Asset
 * @dev Representation of an on-chain investment like Wrapped Ether, Wrapped Bitcoin ...
 */

import "../Stabilizer/Stabilizer.sol";
import "../Oracle/ChainlinkPricer.sol";

contract TokenAsset is Stabilizer {
    // Variables
    IERC20Metadata private immutable token;

    // Oracle to fetch price token / base
    address private immutable tokenOracle;

    // WETH and WBTC has the same frequency - check others
    uint256 private constant TOKEN_FREQUENCY = 1 days;

    constructor(
        string memory name,
        address sweepAddress,
        address usdxAddress,
        address tokenAddress,
        address tokenOracleAddress,
        address borrower
    )
        Stabilizer(
            name,
            sweepAddress,
            usdxAddress,
            borrower
        )
    {
        token = IERC20Metadata(tokenAddress);
        tokenOracle = tokenOracleAddress;
    }

    /* ========== Views ========== */

    /**
     * @notice Current Value of investment.
     * @return total with 6 decimal to be compatible with dollar coins.
     */
    function currentValue() public view override returns (uint256) {
        uint256 accruedFeeInUSD = sweep.convertToUSD(accruedFee());
        return assetValue() + super.currentValue() - accruedFeeInUSD;
    }

    /**
     * @notice Asset Value of investment.
     * @return the Returns the value of the investment in the USD coin
     * @dev the price is obtained from Chainlink
     */
    function assetValue() public view returns (uint256) {
        uint256 tokenBalance = token.balanceOf(address(this));
        (int256 price, uint8 decimals) = ChainlinkPricer.getLatestPrice(
            tokenOracle,
            amm().sequencer(),
            TOKEN_FREQUENCY
        );

        uint256 usdxAmount = (tokenBalance *
            uint256(price) *
            10 ** usdx.decimals()) / (10 ** (token.decimals() + decimals));

        return usdxAmount;
    }

    /* ========== Actions ========== */

    /**
     * @notice Invest.
     * @param usdxAmount Amount of usdx to be swapped for token.
     * @dev Swap from usdx to token.
     */
    function invest(
        uint256 usdxAmount
    ) external onlyBorrower whenNotPaused validAmount(usdxAmount) {
        _invest(usdxAmount, 0);
    }

    /**
     * @notice Divest.
     * @param usdxAmount Amount to be divested.
     * @dev Swap from the token to usdx.
     */
    function divest(
        uint256 usdxAmount
    ) external onlyBorrower validAmount(usdxAmount) {
        _divest(usdxAmount);
    }

    /**
     * @notice Liquidate
     */
    function liquidate() external {
        _liquidate(address(token));
    }

    /* ========== Internals ========== */

    function _invest(uint256 usdxAmount, uint256) internal override {
        uint256 usdxBalance = usdx.balanceOf(address(this));
        if(usdxBalance < usdxAmount) usdxAmount = usdxBalance;

        TransferHelper.safeApprove(address(usdx), sweep.amm(), usdxAmount);
        uint256 investedAmount = amm().swapExactInput(address(usdx), address(token), usdxAmount, 0);

        emit Invested(investedAmount, 0);
    }

    function _divest(uint256 usdxAmount) internal override {
        (int256 price, uint8 decimals) = ChainlinkPricer.getLatestPrice(
            tokenOracle,
            amm().sequencer(),
            TOKEN_FREQUENCY
        );

        uint256 tokenAmount = (usdxAmount *
            (10 ** (token.decimals() + decimals))) /
            (uint256(price) * 10 ** usdx.decimals());

        uint256 tokenBalance = token.balanceOf(address(this));
        if(tokenBalance < tokenAmount) tokenAmount = tokenBalance;

        TransferHelper.safeApprove(address(token), sweep.amm(), tokenAmount);
        uint256 divested = amm().swapExactInput(
            address(token),
            address(usdx),
            tokenAmount,
            0
        );

        emit Divested(divested, 0);
    }
}
