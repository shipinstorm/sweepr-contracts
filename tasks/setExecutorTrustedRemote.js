const CHAIN_ID = require("../utils/layerzero/chainIds.json");
const { getDeployedAddress } = require('../utils/address');

module.exports = async function (taskArgs, hre) {
    // get deployed local and remote sweep address
    const localAddress = getDeployedAddress(hre.network.name, 'executor');
    const remoteAddress = getDeployedAddress(taskArgs.targetNetwork, 'sender');

    // get local contract
    const localInstance = await ethers.getContractAt("OmnichainGovernanceExecutor", localAddress);

    // get remote chain id
    const remoteChainId = CHAIN_ID[taskArgs.targetNetwork]

    try {
        let tx = await (await localInstance.setTrustedRemoteAddress(remoteChainId, remoteAddress)).wait()
        console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAddress})`)
        console.log(` tx: ${tx.transactionHash}`)
    } catch (e) {
        console.log(`❌ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAddress})`)
    }
}
