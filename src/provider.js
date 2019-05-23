const zCore = require('@zilliqa-js/core');
const { isTxParams } = require('@zilliqa-js/account/dist/util');
const logic = require('./logic');
const wallet = require('./components/wallet/wallet');
const config = require('./config');
const { RPCError } = require('./components/CustomErrors');
const { addBnum } = require('./components/blockchain');

const errorCodes = zCore.RPCErrorCode;

class Provider {
  constructor(options, fixtures) {
    this.options = options;

    if (fixtures) wallet.loadAccounts(fixtures);

    this.middleware = {
      request: {
        use: (fn, match) => {},
      },
      response: {
        use: (fn, match) => {},
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
      const data = method === 'CreateTransaction' && isTxParams(params[0])
        ? await this.rpcResponse('CreateTransaction', {
          ...params[0],
          amount: params[0].amount.toString(),
          gasPrice: params[0].gasPrice.toString(),
          gasLimit: params[0].gasLimit.toString(),
        })
        : await this.rpcResponse(method, ...params);
      return { result: data };
    } catch (err) {
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
        return logic.processCreateTxn(params, this.options);
      case 'GetTransaction':
        return logic.processGetTransaction(params);
      case 'GetRecentTransactions':
        return logic.processGetRecentTransactions();
      case 'GetContractAddressFromTransactionID':
        return logic.processGetContractAddressByTransactionID(params);
      case 'GetMinimumGasPrice':
        return config.blockchain.minimumGasPrice.toString();
      case 'KayaMine':
        return addBnum();
      default:
        throw new RPCError(
          'METHOD_NOT_FOUND: The method being requested is not available on this server',
          errorCodes.RPC_INVALID_REQUEST,
          null,
        );
    }
  }
}

module.exports = Provider;
