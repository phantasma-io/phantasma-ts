# phantasma-sdk-ts

A TypeScript SDK for the Phantasma blockchain.

## Installation

Use the package manager [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to install phatasma-ts.

```bash
npm install phantasma-sdk-ts
```

## Importing

```javascript
const { PhantasmaTS } = require("phantasma-sdk-ts");
```

## Standalone HTML Import

```html
<script src="https://cdn.jsdelivr.net/npm/phantasma-sdk-ts@latest/html/phantasma.js"></script>
```

```javascript
phantasma.PhantasmaTS; // To use PhantasmaTS
phantasma.PhantasmaLink; // To use PhantasmaLink
phantasma.EasyConnect; // To use EasyConnect, an easy to use PhantasmaLink wrapper
```

## Table Of Contents

The Phantasma TypeScript SDK transpiles into PhantasmaTS, PhantasmaLink and EasyConnect.

1. [PhantasmaTS](#phantasmats) - Allows you to interact with the Phantasma Blockchain

   - [Utility Functions](#phantasmats-utility-functions)
   - [Script Builder](#building-a-script-with-script-builder)
     - [Interop Commands](#interop-functions)
     - [Building Transaction](#building-a-transaction)
     - [Deploying Smart Contract](#deploying-a-contract)
     - [RPC](#using-rpc)

2. [PhantasmaLink](#phantasmalink) - Allows you to interact with Phantasma based wallets
   - [Functions](#functions)
   - [Examples](#example-code)

3. [EasyConnect](#easyconnect) - Easy plug and play solution for creating DApps

   - [Core Functions](#core-functions)
   - [Query Function](#query-function)
   - [Action Function](#action-function)
   - [Easy Script](#easy-script-create)

4. [Misc]
   - [Vocab](#vocab)

---

## PhantasmaTS

Use PhantasmaTS to interact with the Phantasma blockchain directly.

### PhantasmaTS Utility Functions

Just some standard useful functions that you probably will end up using at some point.

```javascript
PhantasmaTS.byteArrayToHex(arr: ArrayBuffer | ArrayLike<number>); //Turns a Byte Array into Serialized Hex
```

```javascript
PhantasmaTS.getAddressFromWif(wif: string); //Get's Public Address from WIF (Wallet Import Format)
```

```javascript
PhantasmaTS.getPrivateKeyFromWif(wif: string); //Get's Private Key from WIF (Wallet Import Format)
```

```javascript
PhantasmaTS.hexToByteArray(hexBytes: string); //Turns Serialized Hex into Byte Array
```

```javascript
PhantasmaTS.reverseHex(hex: string); //Reverse <-> esreveR Serialized Hex
```

```javascript
PhantasmaTS.signData(msgHex: string, privateKey: string); //Signs some text with given Private Key
```

### Building a Script with Script Builder

Building a script is the most important part of interacting with the Phantasma blockchain. Without a propper script, the Phantasma blockchain will not know what you are trying to do.

These functions, `.CallContract` and `.CallInterop`, are your bread and butter for creating new scripts.

` .CallContract(contractName: string, methodName: string, [arguments]: array)`

` .CallInterop(functionName: string, [arguments]: array)`

- You can find out all the diffrent `.CallInterop` functions below.

- For `.CallContract`, you will have to look through the ABI's of all the diffrent smart contracts currently deployed on the Phantasma 'mainnet': [Link Here](https://explorer.phantasma.info/chain/main#tab_contracts)

#### Example:

```javascript
//Creating a new Script Builder Object
let sb = new PhantasmaTS.ScriptBuilder();

//Here is an example of a Transactional Script
    sb
    .AllowGas(fromAddress, sb.NullAddress, gasPrice, gasLimit)
    .CallInterop("Runtime.TransferTokens", ['fromAddress', 'toAddress', 'KCAL', 10000000000]) //10000000000 = 1 KCAL
    .SpendGas(fromAddress)
    .EndScript();

--- OR ----

//Here is an example of a non Transactional Script

    sb
    .CallContract('account', 'LookUpName', ['accountName'])
    .EndScript();

```
#### InvokeRawScript and decoding the result
```javascript

let sb = new PhantasmaTS.ScriptBuilder();
sb.CallContract("stake", "GetMasterCount", []);
let script = sb.EndScript();
let targetNet = 'main';

// NOTE - we assume RPC was instantiated previously already, check other samples to see how
let response = await RPC.invokeRawScript(targetNet, script);

const decoder = new PhantasmaTS.Decoder(response.result);
const value = decoder.readVmObject();
console.log(value); // print the decoded value to the console

```

#### Interop Functions:

Here are some Interop functions that are used to interact with the core functionality of the Phantasma blockchain. Use these inside your script to add extra functionality.

```javascript
sb.CallInterop("Runtime.MintTokens", [from: string, target: string, tokenSymbol: string , amount: number]); //Used for Fungible Tokens
```

```javascript
sb.CallInterop("Runtime.TransferTokens", [from: string, to: string, tokenSymbol: string, amount: number]); //Used for Fungible Tokens
```

```javascript
sb.CallInterop("Runtime.TransferBalance", [from: string, to: string, tokenSymbol: string]);
```

```javascript
sb.CallInterop("Runtime.TransferToken", [from: string, to: string, tokenSymbol: string, tokenId: number]); //Used for Non Fungible Tokens
```

```javascript
sb.CallInterop("Runtime.SendTokens", [destinationChain: string, from: string, to: string, tokenSymbol: string, amount: number); //Used for Fungible Tokens
```

```javascript
sb.CallInterop("Runtime.SendToken", [destinationChain: string, from: string, to: string, tokenSymbol: string, tokenId: number]); //Used for Non Fungible Tokens
```

```javascript
sb.CallInterop("Runtime.DeployContract", [from: string, contractName: string, pvm: hexString, abi: hexString]);
```

### Building a Transaction

To build a transaction you will first need to build a script.

Note, building a Transaction is for transactional scripts only. Non transactional scripts should use the RPC function `RPC.invokeRawScript(chainInput: string, scriptData: string)`

```javascript
const { PhantasmaTS } = require("phantasma-sdk-ts");


async function sendTransaction() {

  let WIF = "WIF"; //In WIF Format
  let fromAddress = "yourPublicWalletAddress";
  let toAddress = "addressYoureSendingTo";

  //Creating RPC Connection **(Needs To Be Updated)
  let RPC = new PhantasmaTS.PhantasmaAPI(
    "http://localhost:7077/rpc",
    null,
    "simnet"
  );

  //set Gas parameters for Runtime.TransferTokens
  let gasPrice = PhantasmaTS.DomainSettings.DefaultMinimumGasFee; //Internal Blockchain minimum gas fee needed - i.e 100000
  let gasLimit = 9999;

  //Creating a new Script Builder Object
  let sb = new PhantasmaTS.ScriptBuilder();

  //Making a Script
  let script = sb
    .BeginScript()
    .AllowGas(fromAddress, sb.NullAddress, gasPrice, gasLimit)
    .CallInterop("Runtime.TransferTokens", [
      fromAddress,
      toAddress,
      "SOUL",
      100000000,
    ]) //100000000 = 1 SOUL
    .SpendGas(fromAddress)
    .EndScript();

  //Used to set expiration date
  let expiration = 5; //This is in miniutes
  let getTime = new Date();
  let expiration_date = new Date(getTime.getTime() + expiration * 60000);

  let payload = PhantasmaTS.Base16.encode("Phantasma-ts"); //Says '7068616e7461736d612d7473' in hex

  //Creating New Transaction Object
  let transaction = new PhantasmaTS.Transaction(
    "simnet", //Nexus Name - if you're using mainnet change it to mainnet or simnet if you're using you localnode
    "main", //Chain
    script, //In string format
    expiration_date, //Date Object
    payload //Extra Info to attach to Transaction in Serialized Hex
  );

  //Sign's Transaction with WIF
  transaction.sign(WIF);
  let hexEncodedTx = transaction.ToStringEncoded(true); //converts trasnaction to base16 string -true means transaction is signed-

  //Send Transaction
  let txHash = await RPC.sendRawTransaction(hexEncodedTx);
  //Return Transaction Hash
  return txHash;
}

```
### Staking SOUL

This is an example how to stake SOUL

```javascript
async function stakeSOUL() {
  let WIF = "WIF"; //WIF format

  let fromAddress = "yourPublicWalletAddress"; // Phantasma Public Address

  //Creating a new Script Builder Object
  let sb = new PhantasmaTS.ScriptBuilder();
  let gasPrice = PhantasmaTS.DomainSettings.DefaultMinimumGasFee; //Internal Blockchain minimum gas fee needed - i.e 100000
  let gasLimit = 21000;
  let amount = String(10 * 10 ** 8); // 100 the amount - 10**8 it's to get the decimals to the desired amount
  // Soul has 8 decimals places.

  //Creating RPC Connection **(Needs To Be Updated)
  let RPC = new PhantasmaTS.PhantasmaAPI(
    "http://localhost:7077/rpc",
    null,
    "simnet"
  );

  //Making a Script
  let script = sb
    .AllowGas(fromAddress, sb.NullAddress, gasPrice, gasLimit)
    .CallContract("stake", "Stake", [fromAddress, amount])
    .SpendGas(fromAddress)
    .EndScript();

  //Used to set expiration date
  let expiration = 5; //This is in miniutes
  let getTime = new Date();
  let expiration_date = new Date(getTime.getTime() + expiration * 60000);

  let payload = "7068616e7461736d612d7473"; //Says 'Phantasma-ts' in hex

  //Creating New Transaction Object
  let transaction = new PhantasmaTS.Transaction(
    "simnet", //Nexus Name - if you're using mainnet change it to mainnet
    "main", //Chain
    script, //In string format
    expiration_date, //Date Object
    payload //Extra Info to attach to Transaction in Serialized Hex
  );

  //Sign's Transaction with WIF
  transaction.sign(WIF);

  let hexEncodedTx = transaction.ToStringEncoded(true);

  //Send Transaction
  let txHash = await RPC.sendRawTransaction(hexEncodedTx);

  //Return Transaction Hash
  return txHash;
}
```

### Deploying a Contract

```javascript
async function deployContract() {
  //Wallet Stuff
  let WIF = "WIF"; //In wif Format
  let fromAddress = "yourPublicWalletAddress";

  //Contract Stuff
  let pvm = "PVM HEX String";
  let abi = "ABI HEX String";

  //convert Pvm to Bytes -> uint8Array
  let pvm_byteArr = PhantasmaTS.hexToByteArray(pvm);
  pvm_byteArr.shift();
  let byte_pvm = new Uint8Array(pvm_byteArr);

  //convert abi to Bytes -> uint8Array
  let abi_byteArr = PhantasmaTS.hexToByteArray(abi);
  abi_byteArr.shift();
  let byte_abi = new Uint8Array(abi_byteArr);

  let gasPrice = PhantasmaTS.DomainSettings.DefaultMinimumGasFee; //Internal Blockchain minimum gas fee needed - i.e 100000
  let gasLimit = 21000;
  let contractName = "contractName"; //Whatever you want

  //Creating a new Script Builder Object
  let sb = new PhantasmaTS.ScriptBuilder();

  //New RPC and Peers Needed
  //Creating RPC Connection, use ('http://testnet.phantasma.info/rpc', null, 'testnet') for testing
  let RPC = new PhantasmaTS.PhantasmaAPI(
    "http://localhost:5172/rpc",
    null,
    "simnet"
  );

  //Making a Script
  let script = sb
    .AllowGas(fromAddress, sb.NullAddress, gasPrice, gasLimit)
    .CallInterop("Runtime.DeployContract", [
      fromAddress,
      contractName,
      byte_pvm,
      byte_abi,
    ])
    .SpendGas(fromAddress)
    .EndScript();

  //Used to set expiration date
  let expiration = 5; //This is in miniutes
  let getTime = new Date();
  let expiration_date = new Date(getTime.getTime() + expiration * 60000);

  //Setting Temp Payload
  let payload = "MyApp";

  //Creating New Transaction Object
  let transaction = new PhantasmaTS.Transaction(
    "simnet", //Nexus Name
    "main", //Chain
    script, //In string format
    expiration_date, //Date Object
    payload //Extra Info to attach to Transaction in Serialized Hex
  );

  //Deploying Contract Requires POW -- Use a value of 5 to increase the hash difficulty by at least 5
  transaction.mineTransaction(5);

  //Signs Transaction with your WIF
  transaction.sign(WIF);

  let hexEncodedTx = transaction.ToStringEncoded(true);

  //Sends Transaction
  let txHash = await RPC.sendRawTransaction(hexEncodedTx);

  //Returns Transaction Hash
  return txHash;
}
```

### Scanning the blockchain for incoming transactions

```javascript
const { PhantasmaTS } = require("phantasma-sdk-ts");

let RPC = new PhantasmaTS.PhantasmaAPI(
  "https://pharpc1.phantasma.info/rpc",
  null,
  "mainnet"
);

// Store the current height of the chain
let currentHeight = 1;

let chainName = "main";

function onTransactionReceived(address, symbol, amount) {}

// Function that periodically checks the height of the chain and fetches the latest block if the height has increased
async function checkForNewBlocks() {
  // Get the current height of the chain
  let newHeight = await RPC.getBlockHeight(chainName);

  // Check if the height has increased
  if (newHeight > currentHeight) {
    // Fetch the latest block
    let latestBlock = await RPC.getBlockByHeight(chainName, newHeight);

    // Check all transactions in this block
    for (i = 0; i < latestBlock.txs.length; i++) {
      let tx = latestBlock.txs[i];

      // Check all events in this transaction
      for (j = 0; j < tx.events.length; j++) {
        let evt = tx.events[j];
        if (evt.kind == "TokenReceive") {
          var data = PhantasmaTS.getTokenEventData(evt.data);
          onTransactionReceived(evt.address, data.symbol, data.value);
        }
      }
    }

    // Update the current height of the chain
    currentHeight = newHeight;
  }

  // Repeat this process after a delay
  setTimeout(checkForNewBlocks, 1000);
}

// Start checking for new blocks
checkForNewBlocks();
```

### Using RPC

```javascript
let RPC = new PhantasmaTS.PhantasmaAPI(
  "https://pharpc1.phantasma.info/rpc",
  null,
  "mainnet"
);
```

#### Utillities:

- `RPC.JSONRPC(method: string, params: Array<any>);` <- Used to make any Phantasma RPC call
- ` RPC.updateRpc()`
- ` RPC.setRpcHost(rpcHost: string)`
- ` RPC.setRpcByName(rpcName: string)`
- ` RPC.setNexus(nexus: string)`
- ` RPC.convertDecimals(amount: number, decimals: number)`

#### All RPC Function Calls:

```javascript
await RPC.getAccount(account: string); //Returns the account name and balance of given address.
```

```javascript
await RPC.lookUpName(name: string); //Returns the address that owns a given name.
```

```javascript
await RPC.getBlockHeight(chainInput: string); //Returns the height of a chain.
```

```javascript
await RPC.getBlockTransactionCountByHash(blockHash: string); //Returns the number of transactions of given block hash or error if given hash is invalid or is not found.
```

```javascript
await RPC.getBlockByHash(blockHash: string); //Returns information about a block by hash.
```

```javascript
await RPC.getRawBlockByHash(blockHash: string); //Returns a serialized string, containing information about a block by hash.
```

```javascript
await RPC.getBlockByHeight(chainInput: string, height: number); //Returns information about a block by height and chain.
```

```javascript
await RPC.getRawBlockByHeight(chainInput: string, height: number); //Returns a serialized string, in hex format, containing information about a block by height and chain.
```

```javascript
await RPC.getTransactionByBlockHashAndIndex(blockHash: string, index: number); //Returns the information about a transaction requested by a block hash and transaction index.
```

```javascript
await RPC.getAddressTransactions(account: string, page: number, pageSize: number); //Returns last X transactions of given address.
```

```javascript
await RPC.getAddressTransactionCount(account: string, chainInput: string); //Get number of transactions in a specific address and chain.
```

```javascript
await RPC.sendRawTransaction(txData: string); //Allows to broadcast a signed operation on the network, but it&apos;s required to build it manually.
```

```javascript
await RPC.invokeRawScript(chainInput: string, scriptData: string); //Allows to invoke script based on network state, without state changes.
```

```javascript
await RPC.getTransaction(hashText: string); //Returns information about a transaction by hash.
```

```javascript
await RPC.cancelTransaction(hashText: string); //Removes a pending transaction from the mempool.
```

```javascript
await RPC.getChains(); //Returns an array of all chains deployed in Phantasma.
```

```javascript
await RPC.getNexus(); //Returns info about the nexus.
```

```javascript
await RPC.getOrganization(ID: string); //Returns info about an organization.
```

```javascript
await RPC.getLeaderboard(name: string); //Returns content of a Phantasma leaderboard.
```

```javascript
await RPC.getTokens(); //Returns an array of tokens deployed in Phantasma.
```

```javascript
await RPC.getToken(symbol: string); //Returns info about a specific token deployed in Phantasma.
```

```javascript
await RPC.getTokenData(symbol: string, IDtext: string); //Returns data of a non-fungible token, in hexadecimal format.
```

```javascript
await RPC.getTokenBalance(account: string, tokenSymbol: string, chainInput: string); //Returns the balance for a specific token and chain, given an address.
```

```javascript
await RPC.getAuctionsCount(chainAddressOrName: string, symbol: string); //Returns the number of active auctions.
```

```javascript
await RPC.getAuctions(chainAddressOrName: string, symbol: string, page: number, pageSize: number); //Returns the auctions available in the market.
```

```javascript
await RPC.getAuction(chainAddressOrName: string, symbol: string, IDtext: string); //Returns the auction for a specific token.
```

```javascript
await RPC.getArchive(hashText: string)getArchive(hashText: string); //Returns info about a specific archive.
```

```javascript
await RPC.writeArchive(hashText: string, blockIndex: number, blockContent: string); //Writes the contents of an incomplete archive.
```

```javascript
await RPC.getABI(chainAddressOrName: string, contractName: string); //Returns the ABI interface of specific contract.
```

```javascript
await RPC.getPeers(); //Returns list of known peers.
```

```javascript
await RPC.relaySend(receiptHex: string); //Writes a message to the relay network.
```

```javascript
await RPC.relayReceive(account: string); //Receives messages from the relay network.
```

```javascript
await RPC.getEvents(account: string); //Reads pending messages from the relay network.
```

```javascript
await RPC.getPlatforms(); //Returns an array of available interop platforms.
```

```javascript
await RPC.getValidators(); //Returns an array of available validators.
```

```javascript
await RPC.settleSwap(sourcePlatform: string, destPlatform: string, hashText: string); //Tries to settle a pending swap for a specific hash.
```

```javascript
await RPC.getSwapsForAddressOld(account: string); //Returns platform swaps for a specific address.
```

```javascript
await RPC.getSwapsForAddress(account: string, platform: string); //Returns platform swaps for a specific address.
```

```javascript
await RPC.getNFT(symbol: string, nftId: string); //Returns info of a nft.
```

## PhantasmaLink

PhantasmaLink is a core connecting piece that allows you to interact with Phantasma based Wallets. PhantasmaLink is a building block to help you connect with wallets, however if you are more interested in using a more simple plug and play product, please see [EasyConnect](#easyconnect) **<- Super Useful**

Since phantasmaLink is a Class we are going to initiate a new phantasmaLink object.

```javascript
let dappID = "Dapp Name"; //This is just the name you want to give the connection
let consoleLogging = true; //This is if you want console logging for Debugging Purposes [Default is set to true]

let link = new PhantasmaLink(dappID, consoleLogging);
```

#### Vocab

- ` Callback - Function that gets called on after a success`
- ` onErrorCallback - Function that gets called on after a failure`
- ` Script - A set of instructions for that PhantasmaChain to decode that lies inside of a transaction object` See [ScriptBuilder](#building-a-script-with-script-builder)
- ` Nexus - The chain on Phantasma that is being used: Either 'mainnet' or 'testnet'`
- ` Payload - Extra data attached to a transaction object`
- ` ProviderHint - Tells PhantasmaLink which wallet you intend to connect with`

### Functions:

```javascript
link.login(onLoginCallback, onErrorCallback, providerHint); //Provider Hint can be 'ecto' or 'poltergeist'
```

```javascript
link.invokeScript(script, callback); //Allows you to do a ReadOnly script operation on the Phantasma Blockchain (Sends results as an Argument to Callback Function)
```

```javascript
link.signTx(nexus, script, payload, callback, onErrorCallback); //Signs a Transaction via Wallet (payload can be Null) (Sends results as an Argument to Callback Function)
```

```javascript
link.signTxPow(nexus, script, payload, proofOfWork, callback, onErrorCallback);  //Signs a Transaction via Wallet with ProofOfWork Attached (Used for Contract Deployment)

//ProofOfWork Enum
enum ProofOfWork {
    None = 0,
    Minimal = 5,
    Moderate = 15,
    Hard = 19,
    Heavy = 24,
    Extreme = 30
}
```

```javascript
link.getPeer(callback, onErrorCallback); //Get's the peer list for the currently connected network
```

```javascript
link.signData(data, callback, onErrorCallback); //Allows you to sign some data via your Wallet (Sends results as an Argument to Callback Function)
```

```javascript
link.toggleMessageLogging(); //Toggles Console Message Logging
```

```javascript
link.dappID(); //Returns DappID
```

```javascript
link.sendLinkRequest(request, callback); //Used internally and sends wallet instructions through socket, you probably won't use it unless you know what your doing
```

```javascript
link.createSocket(); //Used internally to connect to wallet, you probably won't use it unless you know what your doing
link.retry(); //Used internally to retry socket connection, you probably won't use it unless you know what your doing
```

```javascript
link.disconnect(message); //Disconnects From Socket (You can add a reason with the Message Argument)
```


### Example Code
Here is some example code to initate a wallet connection.

```javascript
let link = new PhantasmaLink("Dapp"); //"Dapp" is just whatever name you want to give your application

//Use this code snippet to connect to a phantasma wallet
link.login(
  function (success) {
    //Console Logging for Debugging Purposes
    if (success) {
      console.log(
        "Connected to account " + this.account.address + " via " + this.wallet
      );
    } else {
      console.log("Connection Failed");
    }
  },
  (data) => {
    console.log(data);
  },
  "ecto"
); //Swap out ecto for 'poltergeist' if wanting to connect to Poltergeist Wallet
```

## EasyConnect

EasyConnect is a plug and play wrapper for PhantasmaLink that makes creating a DApp simple and easy.

Since EasyConnect is a Class we are going to initiate a new EasyConnect object.

```javascript
//Optional Arguments [ requiredVersion: number, platform: string, providerHint: string]
let link = new EasyConnect(); //Has Optional Arguments input as Array
```

### Core Functions

```javascript
link.connect(onSuccess, onFail); //Has two optional callback functions, one for Success and one for Failure
```

```javascript
link.disconnect(_message: string); //Allows you to disconnect from the wallet with a desired message
```

```javascript
link.signTransaction(script: string, payload: string, onSuccess, onFail); //Used to send a transaction to Wallet
```

```javascript
link.signData(data:any, onSuccess, onFail); //Allows you to sign data with a wallet keypair
```

```javascript
link.setConfig(_provider: string); //Allows you to set wallet provider, 'auto', 'ecto', 'poltergeist' (Default is already set to 'auto')
```

```javascript
//Allows Async aswell
link.query(_type: string, _arguments: Array<string>, _callback); //Allows you to query connected wallet/account information (arguments and callback are optional)
```

```javascript
//Allows Async aswell
link.action(_type: string, _arguments: Array<string>, _callback); //Allows you to send a specified action quickly
```

```javascript
//Allows Async aswell
link.script.buildScript(_type: string, _arguments: Array<string>, _callback); //Allows you to quickly create a script with only arguments
// Script Types
// 'interact', [contractName, methodName, [arguments]]
// 'invoke', [contractName, methodName, [arguments]]
// 'interop', [interopName, [arguments]]
```

```javascript
link.invokeScript(script: string, _callback); //Allows you to query data from smart contracts on Phantasma (Non Transactional)
```

```javascript
link.deployContract(script: string, payload:string, proofOfWork, onSuccess, onFail) //Allows you to deploy a contract script

//Proof of Work Enum
export enum ProofOfWork {
    None = 0,
    Minimal = 5,
    Moderate = 15,
    Hard = 19,
    Heavy = 24,
    Extreme = 30
}
```

### Query Function

The Query function is an async function that also allows you to use callbacks. You can use it is a promise, or in a chain!

```javascript
await link.query("account"); //Retrieves all connected wallet account information
```

```javascript
await link.query("name"); //Retrieves registered name associated with connect wallet
```

```javascript
await link.query("balances"); //Shows complete token balance accociated with connected wallet
```

```javascript
await link.query("walletAddress"); //Shows connected wallet address
```

```javascript
await link.query("avatar"); //Shows connected wallet avatar
```

### Action Function

The Action function is an async function that also allows you to use callbacks. You can use it is a promise, or in a chain!

```javascript
await link.action('sendFT', [fromAddress:string, toAddress:string, tokenSymbol:string, amount:number]); //Send Fungible Token
```

```javascript
await link.action('sendNFT', [fromAddress:string, toAddress:string, tokenSymbol:string, tokenID:number]); //Send Non Fungible Token
```

### Easy Script Create

(WIP)
Allows you to generate scripts quickly.

```javascript
async buildScript(_type: string, _options: Array<any>);
// Script Types
// 'interact', [contractName, methodName, [arguments]]
// 'invoke', [contractName, methodName, [arguments]]
// 'interop', [interopName, [arguments]]
```
