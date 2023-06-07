// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.19;

// ====================================================================
// ========================= MarketMaker.sol ========================
// ====================================================================

/**
 * @title MarketMaker
 * @dev Implementation:
Borrow SWEEP, exchange USDC and place it into a Uniswap V3 AMM as single-sided liquidity
Remove any LP positions that are converted to SWEEP, and repay it
*/

import "../Stabilizer/Stabilizer.sol";
import "../Utils/LiquidityHelper.sol";

contract MarketMaker is Stabilizer {
    // Details about position
    struct Position {
        uint256 token_id;
        uint128 liquidity;
        int24 tick_lower;
        int24 tick_upper;
        uint24 fee_tier;
        uint256 token0_amount;
        uint256 token1_amount;
    }

    // Array of all Uni v3 NFT positions held by MarketMaker
    Position[] public positions_array;

    // Map token_id to Position
    mapping(uint256 => Position) public positions_mapping;

    address public token0;
    address public token1;
    bool private immutable flag; // The sort status of tokens

    // Uniswap V3 Position Manager
    INonfungiblePositionManager public constant nonfungiblePositionManager =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    LiquidityHelper private immutable liquidityHelper;

    // Spread Variables
    uint256 public top_spread;
    uint256 public bottom_spread;
    uint256 public tick_spread;

    // Constants
    uint24 private constant PRECISION = 1e6;

    // Events
    event Minted(uint256 tokenId, uint128 liquidity);
    event Burned(uint256 tokenId);

    constructor(
        string memory _name,
        address _sweep_address,
        address _usdx_address,
        address _liquidityHelper,
        address _borrower,
        uint256 _top_spread,
        uint256 _bottom_spread,
        uint256 _tick_spread
    )
        Stabilizer(
            _name,
            _sweep_address,
            _usdx_address,
            _borrower
        )
    {
        flag = _usdx_address < _sweep_address;

        (token0, token1) = flag
            ? (_usdx_address, _sweep_address)
            : (_sweep_address, _usdx_address);

        liquidityHelper = LiquidityHelper(_liquidityHelper);

        min_equity_ratio = 0;

        top_spread = _top_spread;
        bottom_spread = _bottom_spread;
        tick_spread = _tick_spread;
    }

    /* ========== Simple Marketmaker Actions ========== */

    /**
     * @notice Execute operation to peg to target price of SWEEP.
     */
    function execute(uint256 _sweep_amount) external {
        uint256 target_price = SWEEP.target_price();
        uint256 arb_price_upper = ((PRECISION + top_spread) * target_price) / PRECISION;
        uint256 arb_price_lower = ((PRECISION - bottom_spread) * target_price) / PRECISION;

        uint24 pool_fee = amm().poolFee();

        if (SWEEP.amm_price() > arb_price_upper) {
            uint256 usdx_amount = sellSweep(_sweep_amount);

            uint256 min_price = ((PRECISION - tick_spread) * target_price) / PRECISION;
            uint256 max_price = target_price;

            addSingleLiquidity(min_price, max_price, usdx_amount,  pool_fee);
        }

        if (SWEEP.amm_price() < arb_price_lower && _sweep_amount == 0) {
            removeOutOfPositions(pool_fee);
        }
    }

    /**
     * @notice Sell Sweep.
     * @param _sweep_amount to sell.
     */
    function sellSweep(
        uint256 _sweep_amount
    ) internal returns(uint256 usdx_amount) {
        uint256 sweep_limit = SWEEP.minters(address(this)).max_amount;
        uint256 sweep_available = sweep_limit - sweep_borrowed;
        if (_sweep_amount > sweep_available) _sweep_amount = sweep_available;

        // calculate usdx minimum amount for swap
        uint256 min_amount_usd = SWEEP.convertToUSD(_sweep_amount);
        uint256 min_amount_usdx = amm().USDtoToken(min_amount_usd);

        _borrow(_sweep_amount);
        usdx_amount = _sell(_sweep_amount, min_amount_usdx);
    }

    /**
     * @notice Update top_spread.
     * @param _top_spread new top_spread.
     */
    function setTopSpread(
        uint256 _top_spread
    ) external onlyBorrower onlySettingsEnabled {
        top_spread = _top_spread;
    }

    /**
     * @notice Update bottom_spread.
     * @param _bottom_spread new bottom_spread.
     */
    function setBottomSpread(
        uint256 _bottom_spread
    ) external onlyBorrower onlySettingsEnabled {
        bottom_spread = _bottom_spread;
    }

    /**
     * @notice Update tick_spread.
     * @param _tick_spread new tick_spread.
     */
    function setTickSpread(
        uint256 _tick_spread
    ) external onlyBorrower onlySettingsEnabled {
        tick_spread = _tick_spread;
    }

    /* ============ AMM Marketmaker Actions =========== */

    /**
     * @notice Add single-sided liquidity
     * @param _min_price minimum price
     * @param _max_price maximum price
     * @param _usdx_amount usdx amount to mint
     * @param _pool_fee pool fee
     */
    function addSingleLiquidity(
        uint256 _min_price, 
        uint256 _max_price, 
        uint256 _usdx_amount,
        uint24 _pool_fee
    ) internal {
        uint256 _sweep_amount = 0;

        (uint256 usdx_balance, ) = _balances();
        if (_usdx_amount > usdx_balance) _usdx_amount = usdx_balance;

        // Check market maker has enough balance to mint
        if (_usdx_amount == 0) revert NotEnoughBalance();
        
        TransferHelper.safeApprove(
            address(usdx),
            address(nonfungiblePositionManager),
            _usdx_amount
        );

        (int24 min_tick, int24 max_tick) = getTicks(_min_price, _max_price, _pool_fee);

        (uint256 amount0_mint, uint256 amount1_mint) = flag
            ? (_usdx_amount, _sweep_amount)
            : (_sweep_amount, _usdx_amount);

        (uint256 tokenId, uint128 amount_liquidity, uint256 amount0, uint256 amount1) = nonfungiblePositionManager
            .mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: _pool_fee,
                    tickLower: min_tick,
                    tickUpper: max_tick,
                    amount0Desired: amount0_mint,
                    amount1Desired: amount1_mint,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );

        Position memory pos = Position(
            tokenId,
            amount_liquidity,
            min_tick,
            max_tick,
            _pool_fee,
            amount0,
            amount1
        );

        positions_array.push(pos);
        positions_mapping[tokenId] = pos;

        emit Minted(tokenId, amount_liquidity);
    }

    /**
     * @notice Remove out-of-range poisitions
     */
    function removeOutOfPositions(uint24 _pool_fee) internal {
        for (uint i = 0; i < positions_array.length; i++) {
            int24 tick_current = liquidityHelper.getCurrentTick(token0, token1, _pool_fee);
            Position memory position = positions_array[i];

            // check to see if current tick is out of i-th position's range.
            // it means all usdc were sold out and only sweep are left.
            // At this time, we need to check tick direction.
            if ((!flag && tick_current < position.tick_lower) || (flag && tick_current > position.tick_upper)) {
                removeLiquidity(i);
            }
        }
    }

    /**
     * @notice Remove liquidity
     * @param _index position index
     */
    function removeLiquidity(uint256 _index) internal {
        Position memory position = positions_array[_index];

        (uint256 d_amount0, uint256 d_amount1) = nonfungiblePositionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: position.token_id,
                liquidity: position.liquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );

        (uint256 c_amount0, uint256 c_amount1) = nonfungiblePositionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: position.token_id,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        // repay amount
        uint256 sweep_amount;

        if (token0 == address(SWEEP)) {
            sweep_amount = c_amount0 + d_amount0;
        } else {
            sweep_amount = c_amount1 + d_amount1;
        }

        _repay(sweep_amount);

        nonfungiblePositionManager.burn(position.token_id);

        positions_array[_index] = positions_array[positions_array.length -1];
        positions_array.pop();
        delete positions_mapping[position.token_id];

        emit Burned(position.token_id);
    }

    /**
     * @notice Get the ticks from price range
     * @return minTick The minimum tick
     * @return maxTick The maximum tick
     */
    function getTicks(
        uint256 _min_price, 
        uint256 _max_price,
        uint24 _pool_fee
    ) internal view returns (int24 minTick, int24 maxTick) {
        int24 tick_spacing = liquidityHelper.getTickSpacing(token0, token1, _pool_fee);
        uint8 decimals = SWEEP.decimals();

        minTick = liquidityHelper.getTickFromPrice(
            _min_price,
            decimals,
            tick_spacing,
            flag
        );

        maxTick = liquidityHelper.getTickFromPrice(
            _max_price,
            decimals,
            tick_spacing,
            flag
        );

        (minTick, maxTick) = minTick < maxTick
            ? (minTick, maxTick)
            : (maxTick, minTick);
    }

    /**
     * @notice Counts positions
    */
    function numPositions() external view returns (uint256) {
        return positions_array.length;
    }
}
