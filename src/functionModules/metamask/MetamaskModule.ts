import { TransactOpts } from '@computable/computablejs/dist/interfaces'
import { buildTransaction } from '@computable/computablejs/dist/helpers'

import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'

import { Transaction } from '../../global'

import Flash from '../../models/Flash'
import { FlashType } from '../../models/Flash'

import Web3Module from '../../vuexModules/Web3Module'
import FlashesModule from '../../vuexModules/FlashesModule'
import NewListingModule from '../../vuexModules/NewListingModule'
import UploadModule from '../../vuexModules/UploadModule'
import EventModule from '../../vuexModules/EventModule'
import Servers from '../../util/Servers'

import { Errors, Messages, ZERO_HASHED } from '../../util/Constants'

import Web3 from 'web3'

export default class MetamaskModule {

  public static async enable(): Promise<string|Error> {
    let result: string
    try {
      const ary = await ethereum.enable()
      result = ary[0]
    } catch (e) {
      console.log(e)
      result = e
    }
    return result
  }

  public static async enableEthereum(flashesModule: FlashesModule, web3Module: Web3Module): Promise<boolean> {

    const result = await MetamaskModule.enable()
    const enabled = typeof result === 'string'

    let message = Errors.METAMASK_NOT_CONNECTED
    let flashType = FlashType.error

    if (enabled) {
      // web3Module.initialize(ethereum)
      web3Module.initialize(Servers.SkynetJsonRpc)
      message = Messages.METAMASK_CONNECTED
      flashType = FlashType.success
    }
    flashesModule.append(new Flash(message, flashType))
    return enabled
  }

  public static async buildAndSendTransaction(
    account: string,
    method: [Transaction, TransactOpts],
    contractAddress: string,
    processId: string,
    appStore: Store<any>) {

    const web3Module = getModule(Web3Module, appStore)

    //  get gas estimate using method[0]
    // @ts-ignore
    const estimatedGas = await method[0].estimateGas({ from: account })
    const unsigned = await buildTransaction(web3Module.web3, method)
    unsigned.to = contractAddress
    // if given a value use that, else default 0
    unsigned.value = !!method[1].value ? web3Module.web3.utils.toHex(method[1].value) : ZERO_HASHED
    // MM ignores any nonce, let's just remove it
    delete unsigned.nonce
    // take the larger of the two gas estimates to be safe
    unsigned.gas = Math.max(estimatedGas, unsigned.gas)
    MetamaskModule.send(web3Module.web3, unsigned, processId, appStore)
  }

  public static async send(
    web3: Web3,
    unsignedTransaction: Transaction,
    processId: string,
    appStore: Store<any>) {

    if (!!!web3.utils) {
      const eventModule = getModule(EventModule, appStore)
      eventModule.append({
        timestamp: new Date().getTime(),
        processId,
        response: undefined,
        error: new Error('No web3 available!'),
      })
      return
    }

    unsignedTransaction.gas = web3.utils.toHex(unsignedTransaction.gas)
    unsignedTransaction.gasPrice = web3.utils.toHex(unsignedTransaction.gasPrice)

    MetamaskModule.ethereumOperation(
      'eth_sendTransaction',
      [unsignedTransaction],
      processId,
      appStore)
  }

  public static async sign(
    message: string,
    processId: string,
    appStore: Store<any>) {

    const params = [message, ethereum.selectedAddress]

    MetamaskModule.ethereumOperation(
      'personal_sign',
      params,
      processId,
      appStore)
  }

  public static async ethereumOperation(
    ethereumMethod: string,
    params: any[],
    processId: string,
    appStore: Store<any>) {

    if (!!!ethereum || !!!ethereum.selectedAddress || !!!ethereum.sendAsync) {
      const eventModule = getModule(EventModule, appStore)
      eventModule.append({
        timestamp: new Date().getTime(),
        processId,
        response: undefined,
        error: new Error('Metamask is not connected!'),
      })
      return
    }

    ethereum.sendAsync(
      {
        method: ethereumMethod,
        params,
        from: ethereum.selectedAddress,
      },
      (err: any, res: any) => {
        const eventModule = getModule(EventModule, appStore)
        eventModule.append({
          timestamp: new Date().getTime(),
          processId,
          response: res,
          error: err,
        })
      })
  }
}
