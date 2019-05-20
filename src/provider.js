const logic = require('./logic');
const wallet = require('./components/wallet/wallet');
const config = require('./config');
//const { BaseProvider } = require('@zilliqa-js/core/dist/providers/base');

class Provider {
  constructor(options) {
    this.options = options;
    this.middleware = {
      request: {
        use: (fn, match) => { },
      },
      response: {
        use: (fn, match) => { },
      },
    };
  }

  /**
   * Process the JSON RPC call
   * @param { String } method - Zilliqa RPC method name
   * @param { Array } params - Zilliqa RPC method parameters
   * @returns { Object } - returned parameters
   */
  async send(method, ...params) {
    try {
      let data = await this.rpcResponse(method, ...params)
      return {result: data};
    } catch(err) {
      return {
        error: {
          code: err.code,
          data: err.data,
          message: err.message,
        },
      };
    }
  }

  async rpcResponse(method, ...params) {
    switch (method) {
      case 'GetBalance':
        let addr = params[0];
        if (typeof addr === 'object') {
          addr = JSON.stringify(addr);
        }
        return wallet.getBalance(addr);
      case 'GetNetworkId':
        return config.chainId.toString();
      case 'GetSmartContractCode':
        return logic.processGetDataFromContract(params, this.options.dataPath, 'code');
      case 'GetSmartContractState':
        return logic.processGetDataFromContract(params, this.options.dataPath, 'state');
      case 'GetSmartContractInit':
        return logic.processGetDataFromContract(params, this.options.dataPath, 'init');
      case 'GetSmartContracts':
        return logic.processGetSmartContracts(params, this.options.dataPath);
      case 'CreateTransaction':
        return await logic.processCreateTxn(params, this.options);
      case 'GetTransaction':
        return logic.processGetTransaction(params);
      case 'GetRecentTransactions':
        return logic.processGetRecentTransactions();
      case 'GetContractAddressFromTransactionID':
        return logic.processGetContractAddressByTransactionID(params);
      case 'GetMinimumGasPrice':
        return config.blockchain.minimumGasPrice.toString();
      default:
        throw new RPCError('METHOD_NOT_FOUND: The method being requested is not available on this server', errorCodes.RPC_INVALID_REQUEST, null);
    }     
  }
}

module.exports = Provider
