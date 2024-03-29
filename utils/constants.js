const networks = {
  1: 'mainnet',
  5: 'goerli',
  421613: 'arbitrum_goerli',
  42161: 'arbitrum',
}

const chainIDs = {
  'mainnet': 1,
  'goerli': 5,
  'arbitrum_goerli': 421613,
  'arbitrum': 42161,
}

const rpcLinks = {
  1: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
  5: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
  42161: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
  421613: `https://arb-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
}

const apiKeys = {
  1: process.env.ETHERSCAN_API_KEY,
  5: process.env.ETHERSCAN_API_KEY,
  42161: process.env.ARBISCAN_API_KEY,
  421613: process.env.ARBISCAN_API_KEY
}

// Andy:0x87212Bc566b54C60CAca777565F0340F458B1C1b
// Sudb: 0x614Bdbe46B394ad2f1Db06E9236568C046007f67
// New Owner: 0xdC7b17553FE28E195462A74f2BF74AFa5531a555

const wallets = {
  owner: {
    1: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A', // Ethereum Mainnet
    5: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A', // Ethereum Goerli
    421613: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A', // Arbitrum Goerli
    42161: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A', // Arbitrum One
    // 42161: '0xdC7b17553FE28E195462A74f2BF74AFa5531a555', // Arbitrum One
  },
  borrower: {
    1: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
    5: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
    42161: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A',
    421613: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
  },
  wallet: {
    1: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
    5: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
    42161: '0x7Adc86401f246B87177CEbBEC189dE075b75Af3A',
    421613: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
  },
  agent: {
    1: '0x0000000000000000000000000000000000000000',
    5: '0x0000000000000000000000000000000000000000',
    42161: '0x0000000000000000000000000000000000000000',
    421613: '0x0000000000000000000000000000000000000000',
  },
  treasury: {
    1: '0x7c9131d7E2bEdb29dA39503DD8Cf809739f047B3',
    5: '0x44a0414409D83D34F0B2c65720bE79E769D00423',
    42161: '0x7c9131d7E2bEdb29dA39503DD8Cf809739f047B3',
  },
  usdc_holder: {
    1: '0xDa9CE944a37d218c3302F6B82a094844C6ECEb17',
    5: '0x93aE1efd2E78028351C080FA0fbBBeF97Ec42EAD',
    42161: '0x70d95587d40a2caf56bd97485ab3eec10bee6336',
  },
  comp_holder: {
    1: '',
    5: '0xA051d2543AFC78b082832d6ef495e62Bb86490eb',
    42161: '',
  },
  dai_holder: {
    1: '',
    5: '',
    42161: '0xf0428617433652c9dc6d1093a42adfbf30d29f74',
  },
  multisig: { // Gnosis safe wallet
    1: '0x3afd8feED6Bbd1D8254d92eAFA1F695Dce16387a',
    5: '0x23Ab3E2954Ec5577730B7674f4bA9e78Eb96C4d1',
    42161: '0x23Ab3E2954Ec5577730B7674f4bA9e78Eb96C4d1',
  },
}

const tokens = {
  sweep: {
    1: '0xB88a5Ac00917a02d82c7cd6CEBd73E2852d43574',
    5: '0x44ce9744d89B7C3E55a8c328A0dCfC92b2CebA2a',
    42161: '0xB88a5Ac00917a02d82c7cd6CEBd73E2852d43574',
    421613: '0xa5120a12Ff848b2e96439557A9f7E4083f921314', // Arbitrum Goerli
  },
  sweepr: {
    1: '0x89B1e7068bF8E3232dD8f16c35cAc45bDA584f4E',
    5: '0x8CAb65C701225a2c465B9ed98B94942d8a09b63B',
    42161: '0x89B1e7068bF8E3232dD8f16c35cAc45bDA584f4E',
    421613: '0x98d06DBb715e16dB57021eCA85b44e7916EB0c17'
  },
  usdc: { // USDC native
    1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    5: '0x65aFADD39029741B3b8f0756952C74678c9cEC93', // Faucet: 0xA70D8aD6d26931d0188c642A66de3B6202cDc5FA
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  usdc_e: { // USDC bridge
    1: '',
    5: '',
    42161: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  },
  usdt: {
    1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    5: '0x2E8D98fd126a32362F2Bd8aA427E59a1ec63F780', // Faucet: 0xA70D8aD6d26931d0188c642A66de3B6202cDc5FA
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  aave_usdc: {
    1: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
    5: '0x8Be59D90A7Dc679C5cE5a7963cD1082dAB499918', // aave eth USDC
    42161: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
  },
  comp_cusdc: {
    1: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    5: '0x73506770799Eb04befb5AaE4734e58C2C624F493',
    42161: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
  },
  weth: {
    1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    5: '0x60d4db9b534ef9260a88b0bed6c486fe13e604fc',
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  wbtc: {
    1: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    5: '',
    42161: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  },
  backed: {
    1: '0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5',
    5: '0xcd75bf08f798C7a17F24DB2172490d88ED11BDd3',
    42161: '',
    421613: ''
  },
  dai: {
    1: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    5: '',
    42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    421613: ''
  },
  gDai: {
    1: '',
    5: '',
    42161: '0xd85E038593d7A098614721EaE955EC2022B9B91B',
    421613: ''
  },
  usdPlus: {
    1: '',
    5: '',
    42161: '0xe80772Eaf6e2E18B651F160Bc9158b2A5caFCA65',
    421613: ''
  },
  ets: {
    1: '',
    5: '',
    42161: '0x813fFCC4Af3e810E6b447235cC88A02f00454453',
    421613: ''
  }
}

const libraries = {
  liquidity_helper: {
    1: '0xC5f0DE0D8f48E12CcDE9f1902dE15A975b59768d',
    5: '0x2F040113BaC69C046962900713e01AB1248AEF9B',
    42161: '0x7560d15774499386B04A64177E090B33e803493F',
  },
  uniswap_oracle: {
    1: '',
    5: '0xd652C68ED7e93Adc5616cC61142AeaA262B09326',
    42161: '0x8906DB8CAc58bb12c156eb1f57E5f8EBDCbB2257',
  },
  aaveV3_pool: {
    1: '',
    5: '0x7b5C526B7F8dfdff278b4a3e045083FBA4028790',
    42161: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
  glp_reward_router: {
    1: '',
    5: '',
    42161: '0xB95DB5B167D75e6d04227CfFFA61069348d271F5',
  },
  backed_mint: {
    1: '',
    5: '0xfb8e5651209ab5bdc16a95ac4585f017305030ac',
    42161: '',
    421613: ''
  },
  backed_redeem: {
    1: '',
    5: '0x0d96fd4087211cef3babb45fc641fd9e429636d7',
    42161: '',
    421613: ''
  },
  gDai_open_trades: {
    1: '',
    5: '',
    42161: '0x990BA9Edd8a9615A23E4c452E63A80e519A4a23D',
    421613: ''
  },
  usdPlus_exchanger: {
    1: '', 
    5: '',
    42161: '0x73cb180bf0521828d8849bc8CF2B920918e23032',
    421613: ''
  },
  ets_exchanger: {
    1: '',
    5: '',
    42161: '0xc2c84ca763572c6aF596B703Df9232b4313AD4e3',
    421613: ''
  },
  dsr_manager: {
    1: '0x373238337Bfe1146fb49989fc222523f83081dDb',
    5: '',
    42161: '',
    421613: ''
  },
  dss_psm: {
    1: '0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A',
    5: '',
    42161: '',
    421613: ''
  }
}

const chainlinkOracle = {
  weth_usd: {
    1: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH - USD
    5: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e', // ETH - USD
    42161: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
  },
  wbtc_usd: {
    1: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // BTC - USD
    5: '0xA39434A63A52E749F02807ae27335515BA4b07F7', // BTC - USD
    42161: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57',
  },
  usdc_usd: {
    1: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    5: '0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7',
    42161: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3'
  },
  dai_usd: {
    1: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
    5: '0x0d79df66BE487753B02D015Fb622DED7f0E9798d',
    42161: '0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb'
  },
  backed_usd: {
    1: '0x788D911ae7c95121A89A0f0306db65D87422E1de',
    5: '0x788D911ae7c95121A89A0f0306db65D87422E1de',
    42161: '',
    421613: ''
  },
  sequencer_feed: {
    1: '0x0000000000000000000000000000000000000000',
    5: '0x0000000000000000000000000000000000000000',
    42161: '0xfdb631f5ee196f0ed6faa767959853a9f217697d',
    421613: '0x4da69F028a5790fCCAfe81a75C0D24f46ceCDd69',
  }
}

const uniswap = {
  factory: {
    1: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    5: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    42161: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  },
  router: {
    1: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    5: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  },
  universal_router: {
    1: '0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B',
    5: '0x4648a43B2C14Da09FdF82B161150d3F634f40491',
    42161: '0x4C60051384bd2d3C01bfc845Cf5F4b44bcbE9de5',
    421613: '0x4648a43B2C14Da09FdF82B161150d3F634f40491',
  },
  positions_manager: {
    1: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    5: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    42161: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
  },
  pool: {
    1: '0xfCAF342A7CbE3ea38622337F8d0Df029dc68bFF5',
    5: '0xde5789B9690298C8D7418CC6eCE24f6EBce55aC2',
    // 42161: '0xE3bf979ecE07baEf3682e8E2Faa23FB41683d7Af', // SWEEP / USDC.e (bridge)
    42161: '0xa7F4BC4689ed386F2cCa716207A1EbBb1172aaCB', // SWEEP / USDC native
  },
  quoter: {
    1: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    5: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    42161: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
  },
  observationCardinality: {
    1: 96,
    5: 24,
    42161: 480
  }
}

const maple = {
  usdc_pool: {
    1: '0xfe119e9C24ab79F1bDd5dd884B86Ceea2eE75D92',
    5: '0x50c375fb7dd7336d8928c98708f80b4efca549e4',
    42161: ''
  },
  pool_manager: {
    1: '0x219654a61a0bc394055652986be403fa14405bb8',
    5: '0xe813686a4c3a9fe7716e2863f37aab1a42ae8488',
    42161: ''
  },
  withdrawal_manager: {
    1: '0x1146691782c089bCF0B19aCb8620943a35eebD12',
    5: '0x9ee714ebf5a3d4b45d0cdaa4bc6b7356682a153c',
    42161: ''
  }
}

const protocol = {
  governance: {
    1: '',
    5: '0x9C5A24302562cEfbdbeEAAbdE56CF9930Db3d615',
    42161: '0xC0507cFC6A9E65894C05C1c5b193C7B58b36791f'
  },
  balancer: {
    1: '0x47a393e60DfCF12CA3892dBC2C2E66BCE083BB26',
    5: '0x1423eb219333B8CBbe17617B197Aee4CBD5BEcaa',
    42161: '0x82f23E915985de7Db7C9463E4d898ccf2ab2fCeF',
    421613: '0xd4e0D68789694a2221b77C6823e914619310Ae18',
  },
  distributor: {
    1: '',
    5: '0x03DC6B552bff18C39F2bC027844789b205eF5781',
    42161: '0x90453f4969420c2DCE4344431303EAE679dB8F0b',
  },
  uniswap_amm: {
    1: '0x07077F592BF19083b7D7312a6BDFa09FE8064672',
    5: '0x3f6FE0266Fe9D1b407c882d3a6112FCf31938A51',
    // 42161: '0x709d075147a10495e5c3bBF3dfc0c138F34C6E72', // SWEEP / USDC.e (bridge)
    42161: '0x6B8DcAD70Ff24FbB8Bc5807EF06A7930cD6702c8', // SWEEP / USDC native
  },
  omnichain_proposal_sender: {
    1: '',
    5: '0x31CfECAbf5eEAF3Fd92674F271D7C6AEb5bFB5f0',
    42161: '0xC6c730E0424A01BF6e1A2ff4Ffac8540E29Dd185',
    421613: ''
  },
  omnichain_proposal_executor: {
    1: '0xCFcE64f865f84144F9e6FA7C574F580B3eB878e6',
    5: '',
    42161: '',
    421613: '0x628ec44b95d527C32FC39b0475be4330c7F30bf9'
  },
  timelock: {
    1: '',
    5: '0x2E0D0086672A87fE9CC7Ad823466a5a52a82b23F',
    42161: '0xE7b247DBbb1bFdC8E223e78F9585ACF93Df297f5',
    421613: '0xEda97F14dBCD80d20ec4a79D930c6896F92112F7',
  },
  approver: { // from DeFi Ready
    1: '',
    5: '0xD02467129f35255b2710d9A1AF9dAA01730c3e29', // Blacklist
    // 42161: '0x9690b6F7Bb2Ea75F85a09E50eb00Cb8Ce60661dC', // Whitelist
    42161: '0x06d94665f02322781303224120326167483F5BD2' // Whitelist
  },
  vesting_approver: {
    1: '',
    5: '0xa912ac69710e90bc9b97ac70E56b8453193E1e44',
    42161: '0x483761F16A7c978df09d1e7E22532e9DbD2Ee8D0',
  },
}

const assets = {
  off_chain: {
    1: '',
    5: '0xC9F1dB9cb74E6f34C6983847c93D5CA3e40cFb48',
    42161: '0xecA8FCe753e10B87E40EDca2B6810Ae5Ea508FA4'
    // OLD: '0x7D009f68cc4323246cC563BF4Ec6db3d88A69384',
  },
  aave: { // V3
    1: '',
    5: '0x924CCB6C4890b88F241cE3825c6C731967156897',
    42161: '0x99fb540EA905Ac084F938c4aC7cDBAb88d650e25',
  },
  uniswap: {
    1: '0x676524646377A6e66Ca797edF7CCB1B5162a8cE0',
    5: '0x26CC4A46484da4686c4D6E77767A6d7740F63f63',
    42161: '0xe55D44783D8DB0684fe992e87d4703632f66cBB3',
  },
  weth: {
    1: '',
    5: '',
    42161: '0xc625763a67735999FE52111c4CE4cd26C3C60186',
  },
  wbtc: {
    1: '',
    5: '',
    42161: '0xe45c18a04eB1027f8E2806b6291f23beAadC10a7',
  },
  compound: {
    1: '',
    5: '',
    42161: '',
  },
  backed: {
    1: '',
    5: '0x834557f46E2F3833e4f926Df1c4858F26A18E318',
    42161: '',
  },
  market_maker: {
    1: '0xff368E106EA8782FaB6B2D4AD69739a60C66400E',
    5: '',
    42161: '0x78326Ce3be64977658726EEdAd9A35de460E310A',
  },
  usd_plus: {
    1: '',
    5: '',
    42161: '0x52D0a9E74fC159F47cEE668801082a975c10bBba',
  },
  dai_dsr: {
    1: '0x7537035fE6fFb0ed72Ee65B5569a5c090729f0Fa',
    5: '',
    42161: '',
  },
  maple: {
    1: '0x6B8DcAD70Ff24FbB8Bc5807EF06A7930cD6702c8'
  }
}

module.exports = {
  wallets,
  tokens,
  libraries,
  protocol,
  uniswap,
  maple,
  networks,
  chainIDs,
  rpcLinks,
  apiKeys,
  chainlinkOracle,
  assets,
}