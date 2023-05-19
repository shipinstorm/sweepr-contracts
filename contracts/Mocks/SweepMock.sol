// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.19;

// ====================================================================
// ======================= SWEEP Dollar Coin (SWEEP) ==================
// ====================================================================

import "../Sweep/BaseSweep.sol";
import "../Oracle/UniswapOracle.sol";

contract SweepMock is BaseSweep {
    // Addresses
    address public balancer;
    address public treasury;

    // Variables
    int256 public interest_rate; // 4 decimals of precision, e.g. 50000 = 5%
    int256 public step_value; // Amount to change SWEEP interest rate. 6 decimals of precision and default value is 2500 (0.25%)
    uint256 public period_start; // Start time for new period
    uint256 public period_time; // Period Time. Default = 604800 (7 days)
    uint256 public current_target_price; // The cuurent target price of SWEEP
    uint256 public next_target_price; // The next target price of SWEEP
    uint256 public current_amm_price; // The AMM price of SWEEP
    uint256 public arb_spread; // 4 decimals of precision, e.g. 1000 = 0.1%
    uint256 public twa_price;

    // Constants
    uint256 public constant GENESIS_SUPPLY = 10000e18;
    uint256 internal constant SPREAD_PRECISION = 1e6;

    // Events
    event PeriodTimeSet(uint256 new_period_time);
    event PeriodStartSet(uint256 new_period_start);
    event ArbSpreadSet(uint256 new_arb_spread);
    event StepValueSet(int256 new_step_value);
    event InterestRateSet(int256 new_interest_rate);
    event BalancerSet(address balancer_address);
    event TreasurySet(address treasury_address);
    event CollateralAgentSet(address agent_address);
    event NewPeriodStarted(uint256 period_start);
    event AMMPriceSet(uint256 amm_price);
    event TargetPriceSet(
        uint256 current_target_price,
        uint256 next_target_price
    );

    // Errors

    error MintNotAllowed();
    error AlreadyExist();
    error NotOwnerOrBalancer();
    error NotPassedPeriodTime();

    // Modifiers

    modifier onlyBalancer() {
        if (msg.sender != owner() && msg.sender != balancer)
            revert NotOwnerOrBalancer();
        _;
    }

    // Constructor
    function initialize(
        address _lzEndpoint,
        address _fast_multisig,
        address _transfer_approver,
        int256 _step_value
    ) public initializer {
        BaseSweep.__Sweep_init(
            "SWEEP Dollar Coin",
            "SWEEP",
            _lzEndpoint,
            _fast_multisig,
            _transfer_approver
        );
        _mint(msg.sender, GENESIS_SUPPLY);

        step_value = _step_value;

        interest_rate = 0;
        current_target_price = 1e6;
        next_target_price = 1e6;
        current_amm_price = 1e6;

        period_time = 604800; // 7 days
        arb_spread = 0;

        twa_price = 1e6;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Get Sweep Price
     * The Sweep Price comes from UniswapOracle.
     * @return uint256 Sweep price
     */
    function amm_price() public view returns (uint256) {
        return current_amm_price;
    }

    /**
     * @notice Get Sweep Target Price
     * Target Price will be used to peg the Sweep Price safely.
     * @return uint256 Sweep target price
     */
    function target_price() public view returns (uint256) {
        if (block.timestamp - period_start >= period_time) {
            // if over period, return next target price for new period
            return next_target_price;
        } else {
            // if in period, return current target price
            return current_target_price;
        }
    }

    /**
     * @notice Get Sweep Minting Allow Status
     * @return bool Sweep minting allow status
     */
    function is_minting_allowed() public view returns (bool) {
        uint256 arb_price = ((SPREAD_PRECISION - arb_spread) * target_price()) /
            SPREAD_PRECISION;
        return amm_price() >= arb_price;
    }

    /* ========== Actions ========== */

    /**
     * @notice Mint (Override)
     * @param _minter Address of a minter.
     * @param _amount Amount for mint.
     */
    function minter_mint(
        address _minter,
        uint256 _amount
    ) public override validMinter(msg.sender) whenNotPaused {
        if (!is_minting_allowed()) revert MintNotAllowed();

        super.minter_mint(_minter, _amount);
    }

    /**
     * @notice Set Period Time
     * @param _period_time.
     */
    function setPeriodTime(uint256 _period_time) external onlyOwner {
        period_time = _period_time;

        emit PeriodTimeSet(_period_time);
    }

    /**
     * @notice Set Interest Rate
     * @param _new_interest_rate.
     */
    function setInterestRate(
        int256 _new_interest_rate
    ) external onlyBalancer {
        interest_rate = _new_interest_rate;

        emit InterestRateSet(_new_interest_rate);
    }

    /**
     * @notice Set Target Price
     * @param _current_target_price.
     * @param _next_target_price.
     */
    function setTargetPrice(
        uint256 _current_target_price,
        uint256 _next_target_price
    ) external onlyBalancer {
        current_target_price = _current_target_price;
        next_target_price = _next_target_price;

        emit TargetPriceSet(_current_target_price, _next_target_price);
    }

    /**
     * @notice Set Balancer Address
     * @param _balancer.
     */
    function setBalancer(address _balancer) external onlyOwner {
        if (_balancer == address(0)) revert ZeroAddressDetected();
        balancer = _balancer;

        emit BalancerSet(_balancer);
    }

    /**
     * @notice Set AMM price
     * @param _amm_price.
     */
    function setAMMPrice(uint256 _amm_price) public onlyOwner {
        current_amm_price = _amm_price;

        emit AMMPriceSet(_amm_price);
    }

    /**
     * @notice Set arbitrage spread ratio
     * @param _new_arb_spread.
     */
    function setArbSpread(uint256 _new_arb_spread) external onlyOwner {
        arb_spread = _new_arb_spread;

        emit ArbSpreadSet(_new_arb_spread);
    }

    /**
     * @notice Set Treasury Address
     * @param _treasury.
     */
    function setTreasury(address _treasury) external onlyMultisig {
        if (_treasury == address(0)) revert ZeroAddressDetected();
        if (treasury != address(0)) revert AlreadyExist();
        treasury = _treasury;

        emit TreasurySet(_treasury);
    }

    /**
     * @notice Start New Period
     */
    function startNewPeriod() external onlyBalancer {
        if (block.timestamp - period_start < period_time)
            revert NotPassedPeriodTime();

        period_start = block.timestamp;

        emit NewPeriodStarted(period_start);
    }

    /**
     * @notice SWEEP in USDX
     * Calculate the amount of USDX that are equivalent to the SWEEP input.
     * @param _amount Amount of SWEEP.
     * @return amount of USDX.
     */
    function convertToUSD(uint256 _amount) external view returns (uint256) {
        return (_amount * target_price()) / 10 ** decimals();
    }

    /**
     * @notice USDX in SWEEP
     * Calculate the amount of SWEEP that are equivalent to the USDX input.
     * @param _amount Amount of USDX.
     * @return amount of SWEEP.
     */
    function convertToSWEEP(uint256 _amount) external view returns (uint256) {
        return (_amount * 10 ** decimals()) / target_price();
    }

    /* ========== Actions ========== */
    function setTWAPrice(uint256 _twa_price) public {
        twa_price = _twa_price;
    }
}
