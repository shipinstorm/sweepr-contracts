// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../../Common/ERC20/IERC20.sol";

interface IcUSDC is IERC20 {
    function decimals() external view returns (uint256);

    function mint(uint256 mintAmount) external returns (uint256);

    // redeemAmount = # of cUSDC
    function redeem(uint256 redeemAmount) external returns (uint256);

    // redeemAmount = # of USDC
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    // Multiply this by the E8 balance of cUSDC, then divide the product by E16
    function exchangeRateStored() external view returns (uint256);
}