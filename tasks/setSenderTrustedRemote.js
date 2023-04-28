const CHAIN_ID = require("../utils/layerzero/chainIds.json");
const { getDeployedAddress } = require('../utils/address');

module.exports = async function (taskArgs, hre) {
    // get deployed local and remote sweep address
    const localAddress = getDeployedAddress(hre.network.name, 'sender');
    const remoteAddress = getDeployedAddress(taskArgs.targetNetwork, 'executor');

    // get local contract
    const localInstance = await ethers.getContractAt("OmnichainProposalSender", localAddress);

    // get remote chain id
    const remoteChainId = CHAIN_ID[taskArgs.targetNetwork]

    // concat remote and local address
    let remoteAndLocal = hre.ethers.utils.solidityPack(
        ['address','address'],
        [remoteAddress, localAddress]
    )

    try {
        let tx = await (await localInstance.setTrustedRemoteAddress(remoteChainId, remoteAndLocal)).wait()
        console.log(`✅ [${hre.network.name}] setTrustedRemoteAddress(${remoteChainId}, ${remoteAndLocal})`)
        console.log(` tx: ${tx.transactionHash}`)
    } catch (e) {
        console.log(`❌ [${hre.network.name}] setTrustedRemoteAddress(${remoteChainId}, ${remoteAndLocal})`)
    }
}
