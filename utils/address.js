const {
  wallets,
  tokens,
  libraries,
  contracts,
  networks,
  chainIDs,
  chainlink_oracle,
  assets,
} = require("./constants");
require('dotenv').config();

const chainId = process.env.CHAIN_ID;
const networkType = process.env.NETWORK_TYPE;

const addresses = {
  // Wallets
  owner: wallets.owner[chainId],
  borrower: wallets.borrower[chainId],
  wallet: wallets.wallet[chainId],
  treasury: wallets.treasury[chainId],
  usdc_holder: wallets.usdc_holder[chainId],
  comp_holder: wallets.comp_holder[chainId],
  multisig: wallets.multisig[chainId],

  // Tokens
  sweep: tokens.sweep[chainId],
  sweeper: tokens.sweeper[chainId],
  usdc: tokens.usdc[chainId],
  usdt: tokens.usdt[chainId],
  aave_usdc: tokens.aave_usdc[chainId],
  comp: tokens.comp[chainId],
  comp_cusdc: tokens.comp_cusdc[chainId],
  weth: tokens.weth[chainId],
  wbtc: tokens.wbtc[chainId],

  // Libraries
  liquidity_helper: libraries.liquidity_helper[chainId],
  timelock: libraries.timelock[chainId],
  approver: libraries.approver[chainId],
  uniswap_pool: libraries.uniswap_pool[chainId],
  uniswap_oracle: libraries.uniswap_oracle[chainId],
  uniswap_factory: libraries.uniswap_factory[chainId],
  uniswap_router: libraries.uniswap_router[chainId],
  aaveV2_pool: libraries.aaveV2_pool[chainId],
  aaveV3_pool: libraries.aaveV3_pool[chainId],
  uniV3Positions: libraries.uniswapV3_positions[chainId],
  comp_control: libraries.comp_control[chainId],
  glp_reward_router: libraries.glp_reward_router[chainId],

  // Oracles - ChainLink
  oracle_comp_usd: chainlink_oracle.comp_usd[chainId],
  oracle_weth_usd: chainlink_oracle.weth_usd[chainId],
  oracle_wbtc_usd: chainlink_oracle.wbtc_usd[chainId],
  oracle_usdc_usd: chainlink_oracle.usdc_usd[chainId],
  
  // Periphery Contracts
  governance: contracts.governance[chainId],
  balancer: contracts.balancer[chainId],
  uniswap_amm: contracts.uniswap_amm[chainId],
  
  // Assets + Stabilizers
  asset_offChain: assets.off_chain[chainId],
  asset_aave: assets.aave[chainId],
  asset_uniswap: assets.uniswap[chainId],
  asset_weth: assets.weth[chainId],
  asset_wbtc: assets.wbtc[chainId],
  asset_compound: assets.compound[chainId],
}

const network = {
  name: networks[chainId],
  type: networkType
}

const roles = {
  PROPOSER_ROLE: '0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1',
  EXECUTOR_ROLE: '0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63',
  CANCELLER_ROLE: '0xfd643c72710c63c0180259aba6b2d05451e3591a24e58b62239378085726f783'
}

function getDeployedAddress(networkName, contractType) {
  const chainID = chainIDs[networkName];

  if (chainID === undefined) {
      throw new Error("Invalid network name!")
  }

  let contractAddress;

  if (contractType == 'sweep') {
    contractAddress = tokens.sweep[chainID];
  } else if (contractType == 'sender') {
    contractAddress = contracts.omnichain_proposal_sender[chainID];
  } else if (contractType == 'executor') {
    contractAddress = contracts.omnichain_proposal_executor[chainID];
  } else {
    throw new Error("Invalid contract Type!");
  }

  return contractAddress;
}

module.exports = {
  chainId,
  addresses,
  network,
  roles,
  getDeployedAddress
}