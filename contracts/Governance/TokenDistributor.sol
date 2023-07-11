// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.19;

// ====================================================================
// ====================== TokenDistributor.sol ========================
// ====================================================================

/**
 * @title Token Distributor
 * @dev Implementation:
 * The tokenDistributor will sell the SWEEPR tokens, get coins, and 
 * send those coins to the Sweep treasury.
 */

import "./Sweepr.sol";
import "../Common/Owned.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract TokenDistributor is Owned {
    SweeprCoin private sweepr;

    uint256 public saleAmount;
    uint256 public salePrice;
    address public sellTo;
    address public payToken;

    /* ========== EVENTS ========== */
    event SweeprBought(address indexed to, uint256 sweeprAmount);

    /* ========== Errors ========== */
    error OverSaleAmount();
    error NotEnoughBalance();
    error NotRecipient();
    error ZeroPrice();
    error ZeroAmount();

    /* ========== CONSTRUCTOR ========== */
    constructor(
        address _sweep, 
        address _sweepr
    ) Owned(_sweep) {
        sweepr = SweeprCoin(_sweepr);
    }

    /* ========== PUBLIC FUNCTIONS ========== */
    /**
     * @notice A function to buy sweepr.
     * @param _tokenAmount sweep Amount to buy sweepr
     */
    function buy(uint256 _tokenAmount) external {
        uint256 sweeprBalance = sweepr.balanceOf(address(this));
        uint256 sweeprAmount = (_tokenAmount * 10 ** sweepr.decimals()) / salePrice;

        if (msg.sender != sellTo) revert NotRecipient();
        if (sweeprAmount > saleAmount) revert OverSaleAmount();
        if (sweeprAmount > sweeprBalance) revert NotEnoughBalance();

        TransferHelper.safeTransferFrom(payToken, msg.sender, sweep.treasury(), _tokenAmount);
        TransferHelper.safeTransfer(address(sweepr), msg.sender, sweeprAmount);

        unchecked {
            saleAmount -= sweeprAmount;
        }

        emit SweeprBought(msg.sender, sweeprAmount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */
    /**
     * @notice A function to allow sale
     * @param _saleAmount number of SWEEPR to sell
     * @param _sellTo address of the recipient
     * @param _salePrice price of SWEEPR in payToken
     * @param _payToken token address to receive
     */
    function allowSale(
        uint256 _saleAmount,
        address _sellTo,
        uint256 _salePrice,
        address _payToken
    ) external onlyMultisigOrGov {
        if (_sellTo == address(0) || _payToken == address(0)) revert ZeroAddressDetected();
        if (_saleAmount == 0) revert ZeroAmount();
        if (_salePrice == 0) revert ZeroPrice();

        saleAmount = _saleAmount;
        sellTo = _sellTo;
        salePrice = _salePrice;
        payToken = _payToken;
    }

    /**
     * @notice A function to revoke sale
     */
    function revokeSale() external onlyMultisigOrGov {
        saleAmount = 0;
    }

    /**
     * @notice A function to burn SWEEPR
     */
    function burn() external onlyMultisigOrGov {
        uint256 sweeprBalance = sweepr.balanceOf(address(this));
        sweepr.burn(sweeprBalance);
    }
}