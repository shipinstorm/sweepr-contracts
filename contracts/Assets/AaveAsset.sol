// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;
pragma experimental ABIEncoderV2;

// ====================================================================
// ========================= AaveAsset.sol ============================
// ====================================================================

/**
 * @title Aave Asset
 * @dev Representation of an on-chain investment on a Aave pool
 * Intergrated with V2
 */

import "../Stabilizer/Stabilizer.sol";
import "./Aave/IAAVELendingPool_Partial.sol";

contract AaveAsset is Stabilizer {
    IERC20 private immutable aaveUSDX_Token;
    IAAVELendingPool_Partial private immutable aaveLending_Pool;

    constructor(
        string memory _name,
        address _sweep_address,
        address _usdx_address,
        address _aave_usdx_address,
        address _aave_lending_pool_address,
        address _amm_address,
        address _borrower
    )
        Stabilizer(
            _name,
            _sweep_address,
            _usdx_address,
            _amm_address,
            _borrower
        )
    {
        aaveUSDX_Token = IERC20(_aave_usdx_address);
        aaveLending_Pool = IAAVELendingPool_Partial(_aave_lending_pool_address);
    }

    /* ========== Views ========== */

    /**
     * @notice Get Current Value
     * @return uint256 Current Value.
     * @dev this value represents the invested amount plus the staked amount in the contract.
     */
    function currentValue() public view override returns (uint256) {
        return assetValue() + super.currentValue();
    }

    /**
     * @notice Get Asset Value
     * @return uint256 Asset Amount.
     * @dev the invested amount in USDX on the Aave pool.
     */
    function assetValue() public view returns (uint256) {
        return aaveUSDX_Token.balanceOf(address(this));
    }

    /* ========== Actions ========== */

    /**
     * @notice Invest USDX
     * @param _usdx_amount USDX Amount to be invested.
     * @dev Sends balance to Aave.
     */
    function invest(
        uint256 _usdx_amount
    ) external onlyBorrower whenNotPaused validAmount(_usdx_amount) {
        _invest(_usdx_amount, 0);
    }

    /**
     * @notice Divests From Aave.
     * @param _usdx_amount Amount to be divested.
     * @dev Sends balance from Aave to the Asset.
     */
    function divest(
        uint256 _usdx_amount
    ) external onlyBorrower validAmount(_usdx_amount) {
        _divest(_usdx_amount);
    }

    /**
     * @notice Liquidate
     * @dev When the asset is defaulted anyone can liquidate it
     * by repaying the debt and getting the same value at a discount.
     */
    function liquidate() external {
        _liquidate(address(aaveUSDX_Token));
    }

    /* ========== Internals ========== */

    /**
     * @notice Invest
     * @dev Deposits the amount into the Aave pool.
     */
    function _invest(uint256 _usdx_amount, uint256) internal override {
        (uint256 usdx_balance, ) = _balances();
        _usdx_amount = _min(_usdx_amount, usdx_balance);

        TransferHelper.safeApprove(
            address(usdx),
            address(aaveLending_Pool),
            _usdx_amount
        );
        aaveLending_Pool.deposit(address(usdx), _usdx_amount, address(this), 0);

        emit Invested(_usdx_amount, 0);
    }

    /**
     * @notice Divest
     * @dev Withdraws the amount from the Aave pool.
     */
    function _divest(uint256 _usdx_amount) internal override {
        if (aaveUSDX_Token.balanceOf(address(this)) < _usdx_amount)
            _usdx_amount = type(uint256).max;

        aaveLending_Pool.withdraw(address(usdx), _usdx_amount, address(this));

        emit Divested(_usdx_amount, 0);
    }
}
