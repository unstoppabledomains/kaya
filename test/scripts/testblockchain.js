const fs = require('fs');
const { BN, Long, bytes } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const path = require('path');

const zilliqa = new Zilliqa('http://localhost:4200');

const CHAIN_ID = 111;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

// Populate the wallet with an account
zilliqa.wallet.addByPrivateKey('db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3');

async function testChainCalls() {
  try {
    const [, ccb1] = await zilliqa.contracts
      .new(fs.readFileSync(path.join(__dirname, 'chain-call-balance-1.scilla'), 'utf-8'), [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: '_creation_block',
          type: 'BNum',
          value: '100',
        },
      ])
      .deploy({
        version: VERSION,
        gasPrice: new BN('1_000_000_000'),
        gasLimit: Long.fromNumber(5000),
      });

    const [, ccb2] = await zilliqa.contracts
      .new(fs.readFileSync(path.join(__dirname, 'chain-call-balance-2.scilla'), 'utf-8'), [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: '_creation_block',
          type: 'BNum',
          value: '100',
        },
      ])
      .deploy({
        version: VERSION,
        gasPrice: new BN('1_000_000_000'),
        gasLimit: Long.fromNumber(5000),
      });

    const [, ccb3] = await zilliqa.contracts
      .new(fs.readFileSync(path.join(__dirname, 'chain-call-balance-3.scilla'), 'utf-8'), [
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: '_creation_block',
          type: 'BNum',
          value: '100',
        },
      ])
      .deploy({
        version: VERSION,
        gasPrice: new BN('1_000_000_000'),
        gasLimit: Long.fromNumber(5000),
      });

    const tx = await ccb1.call(
      'a_accept_callBcallC',
      [
        { vname: 'addrB', type: 'ByStr20', value: `0x${ccb2.address}` },
        { vname: 'addrC', type: 'ByStr20', value: `0x${ccb3.address}` },
      ],
      {
        version: VERSION,
        amount: new BN(100),
        gasPrice: new BN('1_000_000_000'),
        gasLimit: Long.fromNumber(5000),
      },
    );

    console.log({
      ccb1Addr: ccb1.address,
      ccb2Addr: ccb2.address,
      ccb3Addr: ccb3.address,
    });

    console.log(`tx: ${JSON.stringify(tx.txParams, null, 2)}`);

    console.log({
      ccb1: await ccb1.getState(),
      ccb2: await ccb2.getState(),
      ccb3: await ccb3.getState(),
    });

    console.log({
      ccb1Balance: await zilliqa.blockchain.getBalance(ccb1.address),
      ccb2Balance: await zilliqa.blockchain.getBalance(ccb2.address),
      ccb3Balance: await zilliqa.blockchain.getBalance(ccb3.address),
    });
  } catch (err) {
    console.log('Blockchain Error');
    console.log(err);
  }
}

testChainCalls();

async function testBlockchain() {
  try {
    // Send a transaction to the network
    const tx = await zilliqa.blockchain.createTransaction(
      zilliqa.transactions.new({
        version: VERSION,
        toAddr: 'd90f2e538ce0df89c8273cad3b63ec44a3c4ed82',
        amount: new BN(888),
        // gasPrice must be >= minGasPrice
        gasPrice: new BN('1_000_000_000'),
        // can be `number` if size is <= 2^53 (i.e., window.MAX_SAFE_INTEGER)
        gasLimit: Long.fromNumber(10),
      }),
    );
    console.log(tx);

    console.log('Deploying a contract now');
    // Deploy a contract
    const code = fs.readFileSync('HelloWorld.scilla', 'utf-8');
    const init = [
      {
        vname: '_scilla_version',
        type: 'Uint32',
        value: '0',
      },
      {
        vname: 'owner',
        type: 'ByStr20',
        // NOTE: all byte strings passed to Scilla contracts _must_ be
        // prefixed with 0x. Failure to do so will result in the network
        // rejecting the transaction while consuming gas!
        value: '0x7bb3b0e8a59f3f61d9bff038f4aeb42cae2ecce8',
      },
      // Necessary for local Kaya testing
      {
        vname: '_creation_block',
        type: 'BNum',
        value: '100',
      },
    ];

    // instance of class Contract
    const contract = zilliqa.contracts.new(code, init);

    const [deployTx, hello] = await contract.deploy({
      version: VERSION,
      gasPrice: new BN('1_000_000_000'),
      gasLimit: Long.fromNumber(5000),
    });

    // Introspect the state of the underlying transaction
    console.log('Deployment Transaction ID: ', deployTx.id);
    console.log('Deployment Transaction Receipt: ', deployTx.txParams.receipt);

    const setHelloTx = await hello.call(
      'setHello',
      [
        {
          vname: 'msg',
          type: 'String',
          value: 'Hello World',
        },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN('1_000_000_000'),
        gasLimit: Long.fromNumber(5000),
      },
    );
    console.log('setHelloTx.receipt:', setHelloTx.txParams.receipt);
    console.log(await hello.getState());

    const getHelloTx = await hello.call('getHello', [], {
      version: VERSION,
      amount: new BN(0),
      gasPrice: new BN('1_000_000_000'),
      gasLimit: Long.fromNumber(5000),
    });

    console.log('getHelloTx:', await zilliqa.provider.send('GetTransaction', getHelloTx.id));
  } catch (err) {
    console.log('Blockchain Error');
    console.log(err);
  }
}

// testBlockchain();
