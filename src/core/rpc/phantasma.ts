/* eslint-disable */

import fetch from 'cross-fetch';
import { Balance } from './interfaces/Balance.js';
import { Organization } from './interfaces/Organization.js';
import { Nexus } from './interfaces/Nexus.js';
import { Account } from './interfaces/Account.js';
import { Leaderboard } from './interfaces/Leaderboard.js';
import { Chain } from './interfaces/Chain.js';
import { Contract } from './interfaces/Contract.js';
import { TransactionData } from './interfaces/TransactionData.js';
import { AccountTransactions } from './interfaces/AccountTransactions.js';
import { Paginated } from './interfaces/Paginated.js';
import { Block } from './interfaces/Block.js';
import { Token } from './interfaces/Token.js';
import { TokenData } from './interfaces/TokenData.js';
import { Auction } from './interfaces/Auction.js';
import { Script } from './interfaces/Script.js';
import { Archive } from './interfaces/Archive.js';
import { NFT } from './interfaces/NFT.js';
import { CursorPaginatedResult, TokenSeriesResult } from './interfaces/index.js';

export class PhantasmaAPI {
  host: string;
  rpcName: string;
  nexus: string;
  availableHosts: any[];

  pingAsync(host: string): Promise<number> {
    return new Promise((resolve, reject) => {
      var started = new Date().getTime();
      var http = new XMLHttpRequest();

      http.open('GET', host + '/rpc', true);
      http.timeout = 4500;
      http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
          var ended = new Date().getTime();
          var milliseconds = ended - started;
          resolve(milliseconds);
        }

        http.ontimeout = function () {
          resolve(100000);
        };
        http.onerror = function () {
          resolve(100000);
        };
      };
      try {
        http.send(null);
      } catch (exception) {
        // this is expected
        reject();
      }
    });
  }

  constructor(defHost: string, peersUrlJson: string | undefined | null, nexus: string) {
    this.rpcName = 'Auto';
    this.nexus = nexus;
    this.host = defHost;
    this.availableHosts = [];

    if (peersUrlJson != undefined && peersUrlJson != null) {
      fetch(peersUrlJson + '?_=' + new Date().getTime()).then(async (res) => {
        const data = await res.json();
        for (var i = 0; i < data.length; i++) {
          console.log('Checking RPC: ', data[i]);
          try {
            const msecs = await this.pingAsync(data[i].url);
            data[i].info = data[i].location + ' • ' + msecs + ' ms';
            data[i].msecs = msecs;
            console.log(data[i].location + ' • ' + msecs + ' ms • ' + data[i].url + '/rpc');
            this.availableHosts.push(data[i]);
          } catch (err) {
            console.log('Error with RPC: ' + data[i]);
          }
        }
        this.availableHosts.sort((a, b) => a.msecs - b.msecs);
        this.updateRpc();
      });
    }
  }

  async JSONRPC(method: string, params: Array<any>): Promise<any> {
    let res = await fetch(this.host, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: '1',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    let resJson = await res.json();
    console.log('method', method, resJson);
    if (resJson.error) {
      if (resJson.error.message) return { error: resJson.error.message };
      return { error: resJson.error };
    }
    return await resJson.result;
  }

  setRpcHost(rpcHost: string) {
    this.host = rpcHost;
  }

  setRpcByName(rpcName: string) {
    this.rpcName = rpcName;
    if (this.nexus === 'mainnet') this.updateRpc();
  }

  setNexus(nexus: string) {
    this.nexus = nexus.toLowerCase();
  }

  updateRpc() {
    if (this.nexus === 'mainnet' && this.availableHosts.length > 0) {
      console.log('%cUpdate RPC with name ' + this.rpcName, 'font-size: 20px');
      if (this.rpcName == 'Auto') {
        this.host = this.availableHosts[0].url + '/rpc';
      } else {
        const rpc = this.availableHosts.find((h) => h.location == this.rpcName);
        if (rpc) this.host = rpc.url + '/rpc';
        else this.host = this.availableHosts[0].url + '/rpc';
      }
      console.log('%cSet RPC api to ' + this.host, 'font-size: 20px');
    }
  }

  convertDecimals(amount: number, decimals: number): number {
    let mult = Math.pow(10, decimals);
    return amount / mult;
  }

  //Returns the account name and balance of given address.
  async getAccount(account: string, extended: boolean = true): Promise<Account> {
    let params: Array<any> = [account, extended];
    return (await this.JSONRPC('getAccount', params)) as Account;
  }

  //Returns the accounts name and balance of given addresses.
  async getAccounts(accounts: string[], extended: boolean = true): Promise<Account[]> {
    let params: Array<any> = [accounts.join(','), extended];
    return (await this.JSONRPC('getAccounts', params)) as Account[];
  }

  //Returns the address that owns a given name.
  async lookUpName(name: string): Promise<string> {
    let params: Array<any> = [name];
    return (await this.JSONRPC('lookUpName', params)) as string;
  }

  //Returns the height of a chain.
  async getBlockHeight(chainInput: string): Promise<number> {
    let params: Array<any> = [chainInput];
    return (await this.JSONRPC('getBlockHeight', params)) as number;
  }

  //Returns the number of transactions of given block hash or error if given hash is invalid or is not found.
  async getBlockTransactionCountByHash(blockHash: string): Promise<number> {
    let params: Array<any> = [blockHash];
    return (await this.JSONRPC('getBlockTransactionCountByHash', params)) as number;
  }

  //Returns information about a block by hash.
  async getBlockByHash(blockHash: string): Promise<Block> {
    let params: Array<any> = [blockHash];
    return (await this.JSONRPC('getBlockByHash', params)) as Block;
  }

  //Returns information about a block by height and chain.
  async getBlockByHeight(chainInput: string, height: number): Promise<Block> {
    let params: Array<any> = [chainInput, height];
    return (await this.JSONRPC('getBlockByHeight', params)) as Block;
  }

  //Returns information about a block by height and chain.
  async getLatestBlock(chainInput: string): Promise<Block> {
    let params: Array<any> = [chainInput];
    return (await this.JSONRPC('getLatestBlock', params)) as Block;
  }

  //Returns the information about a transaction requested by a block hash and transaction index.
  async getTransactionByBlockHashAndIndex(
    blockHash: string,
    index: number
  ): Promise<TransactionData> {
    let params: Array<any> = [blockHash, index];
    return (await this.JSONRPC('getTransactionByBlockHashAndIndex', params)) as TransactionData;
  }

  //Returns last X transactions of given address.
  async getAddressTransactions(
    account: string,
    page: number,
    pageSize: number
  ): Promise<Paginated<AccountTransactions>> {
    let params: Array<any> = [account, page, pageSize];
    return (await this.JSONRPC('getAddressTransactions', params)) as Paginated<AccountTransactions>;
  }

  //Get number of transactions in a specific address and chain
  async getAddressTransactionCount(account: string, chainInput: string): Promise<number> {
    let params: Array<any> = [account, chainInput];
    return (await this.JSONRPC('getAddressTransactionCount', params)) as number;
  }

  //Allows to broadcast a signed operation on the network, but it&apos;s required to build it manually.
  async sendRawTransaction(txData: string): Promise<string> {
    let params: Array<any> = [txData];
    return (await this.JSONRPC('sendRawTransaction', params)) as string;
  }

  //Allows to broadcast a signed carbon transaction on the network.
  async sendCarbonTransaction(txData: string): Promise<string> {
    let params: Array<any> = [txData];
    return (await this.JSONRPC('sendCarbonTransaction', params)) as string;
  }

  //Allows to invoke script based on network state, without state changes.
  async invokeRawScript(chainInput: string, scriptData: string): Promise<Script> {
    let params: Array<any> = [chainInput, scriptData];
    return (await this.JSONRPC('invokeRawScript', params)) as Script;
  }

  //Returns information about a transaction by hash.
  async getTransaction(hashText: string): Promise<TransactionData> {
    let params: Array<any> = [hashText];
    return (await this.JSONRPC('getTransaction', params)) as TransactionData;
  }

  //Returns an array of all chains deployed in Phantasma.
  async getChains(extended: boolean = true): Promise<Chain[]> {
    let params: Array<any> = [extended];
    return (await this.JSONRPC('getChains', params)) as Chain[];
  }

  //Return the chain
  async getChain(name: string, extended: boolean = true): Promise<Chain> {
    let params: Array<any> = [name, extended];
    return (await this.JSONRPC('getChain', params)) as Chain;
  }

  //Returns info about the nexus.
  async getNexus(extended: boolean = true): Promise<Nexus> {
    let params: Array<any> = [extended];
    return (await this.JSONRPC('getNexus', params)) as Nexus;
  }

  //Returns an array of contracts  deployed in Phantasma.
  async getContracts(
    chainAddressOrName: string = 'main',
    extended: boolean = true
  ): Promise<Contract[]> {
    let params: Array<any> = [chainAddressOrName, extended];
    return (await this.JSONRPC('getContracts', params)) as Contract[];
  }

  //Returns the contract info deployed in Phantasma.
  async getContract(chainAddressOrName: string = 'main', contractName: string): Promise<Contract> {
    let params: Array<any> = [chainAddressOrName, contractName];
    return (await this.JSONRPC('getContract', params)) as Contract;
  }

  async getContractByAddress(
    chainAddressOrName: string = 'main',
    contractAddress: string
  ): Promise<Contract> {
    let params: Array<any> = [chainAddressOrName, contractAddress];
    return (await this.JSONRPC('getContractByAddress', params)) as Contract;
  }

  //Returns info about an organization.
  async getOrganization(ID: string, extended: boolean = true): Promise<Organization> {
    let params: Array<any> = [ID, extended];
    return (await this.JSONRPC('getOrganization', params)) as Organization;
  }

  async getOrganizationByName(name: string, extended: boolean = true): Promise<Organization> {
    let params: Array<any> = [name, extended];
    return (await this.JSONRPC('getOrganizationByName', params)) as Organization;
  }

  async getOrganizations(extended: boolean = false): Promise<Organization[]> {
    let params: Array<any> = [extended];
    return (await this.JSONRPC('getOrganizations', params)) as Organization[];
  }

  //Returns content of a Phantasma leaderboard.
  async getLeaderboard(name: string): Promise<Leaderboard> {
    let params: Array<any> = [name];
    return (await this.JSONRPC('getLeaderboard', params)) as Leaderboard;
  }

  //Returns an array of tokens deployed in Phantasma.
  async getTokens(
    ownerAddress: string | undefined | null,
    extended: boolean = true
  ): Promise<Token[]> {
    let params: Array<any> = [extended, ownerAddress];
    return (await this.JSONRPC('getTokens', params)) as Token[];
  }

  //Returns info about a specific token deployed in Phantasma.
  async getToken(symbol: string, extended: boolean = true, carbonTokenId: bigint = 0n): Promise<Token> {
    let params: Array<any> = [symbol, extended, carbonTokenId.toString()];
    return (await this.JSONRPC('getToken', params)) as Token;
  }

  //Returns data of a non-fungible token, in hexadecimal format.
  async getTokenData(symbol: string, IDtext: string): Promise<TokenData> {
    let params: Array<any> = [symbol, IDtext];
    return (await this.JSONRPC('getTokenData', params)) as TokenData;
  }

  //Returns the balance for a specific token and chain, given an address.
  async getTokenBalance(
    account: string,
    tokenSymbol: string,
    chainInput: string,
    checkAddressResevedByte: boolean = true
  ): Promise<Balance> {
    let params: Array<any> = [account, tokenSymbol, chainInput, checkAddressResevedByte];
    return (await this.JSONRPC('getTokenBalance', params)) as Balance;
  }

  //Returns series for specified token.
  // Returns NFT series for a specific token using cursor-based pagination.
  async getTokenSeries(
    symbol: string,
    carbonTokenId: bigint,
    pageSize: number = 10,
    cursor: string = ''
  ): Promise<CursorPaginatedResult<TokenSeriesResult[]>> {
    let params: Array<any> = [symbol, carbonTokenId.toString(), pageSize, cursor];
    return (await this.JSONRPC('getTokenSeries', params)) as CursorPaginatedResult<TokenSeriesResult[]>;
  }

  // Returns NFTs for a token (optionally restricted to a series) with cursor pagination.
  async getTokenNFTs(
    carbonTokenId: bigint,
    carbonSeriesId: number = 0,
    pageSize: number = 10,
    cursor: string = '',
    extended: boolean = false
  ): Promise<CursorPaginatedResult<NFT[]>> {
    let params: Array<any> = [
      carbonTokenId.toString(),
      carbonSeriesId,
      pageSize,
      cursor,
      extended,
    ];
    return (await this.JSONRPC('getTokenNFTs', params)) as CursorPaginatedResult<NFT[]>;
  }

  // Returns fungible token balances owned by an address, optionally filtered to one token.
  async getAccountFungibleTokens(
    account: string,
    tokenSymbol: string = '',
    carbonTokenId: bigint = 0n,
    pageSize: number = 10,
    cursor: string = '',
    checkAddressReservedByte: boolean = true
  ): Promise<CursorPaginatedResult<Balance[]>> {
    let params: Array<any> = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      pageSize,
      cursor,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountFungibleTokens', params)) as CursorPaginatedResult<Balance[]>;
  }

  // Returns NFTs owned by an address, with optional token/series filters and extended properties.
  async getAccountNFTs(
    account: string,
    tokenSymbol: string = '',
    carbonTokenId: bigint = 0n,
    carbonSeriesId: number = 0,
    pageSize: number = 10,
    cursor: string = '',
    extended: boolean = false,
    checkAddressReservedByte: boolean = true
  ): Promise<CursorPaginatedResult<NFT[]>> {
    let params: Array<any> = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      carbonSeriesId,
      pageSize,
      cursor,
      extended,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountNFTs', params)) as CursorPaginatedResult<NFT[]>;
  }

  // Returns NFT tokens for which the address owns at least one NFT instance.
  async getAccountOwnedTokens(
    account: string,
    tokenSymbol: string = '',
    carbonTokenId: bigint = 0n,
    pageSize: number = 10,
    cursor: string = '',
    checkAddressReservedByte: boolean = true
  ): Promise<CursorPaginatedResult<Token[]>> {
    let params: Array<any> = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      pageSize,
      cursor,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountOwnedTokens', params)) as CursorPaginatedResult<Token[]>;
  }

  // Returns NFT series for which the address owns at least one NFT instance.
  async getAccountOwnedTokenSeries(
    account: string,
    tokenSymbol: string = '',
    carbonTokenId: bigint = 0n,
    pageSize: number = 10,
    cursor: string = '',
    checkAddressReservedByte: boolean = true
  ): Promise<CursorPaginatedResult<TokenSeriesResult[]>> {
    let params: Array<any> = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      pageSize,
      cursor,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountOwnedTokenSeries', params)) as CursorPaginatedResult<TokenSeriesResult[]>;
  }

  //Returns the number of active auctions.
  async getAuctionsCount(chainAddressOrName: string, symbol: string): Promise<number> {
    let params: Array<any> = [chainAddressOrName, symbol];
    return (await this.JSONRPC('getAuctionsCount', params)) as number;
  }

  //Returns the auctions available in the market.
  async getAuctions(
    chainAddressOrName: string,
    symbol: string,
    page: number,
    pageSize: number
  ): Promise<Auction> {
    let params: Array<any> = [chainAddressOrName, symbol, page, pageSize];
    return (await this.JSONRPC('getAuctions', params)) as Auction;
  }

  //Returns the auction for a specific token.
  async getAuction(chainAddressOrName: string, symbol: string, IDtext: string): Promise<Auction> {
    let params: Array<any> = [chainAddressOrName, symbol, IDtext];
    return (await this.JSONRPC('getAuction', params)) as Auction;
  }

  //Returns info about a specific archive.
  async getArchive(hashText: string): Promise<Archive> {
    let params: Array<any> = [hashText];
    return (await this.JSONRPC('getArchive', params)) as Archive;
  }

  //Writes the contents of an incomplete archive.
  async writeArchive(hashText: string, blockIndex: number, blockContent: string): Promise<boolean> {
    let params: Array<any> = [hashText, blockIndex, blockContent];
    return (await this.JSONRPC('writeArchive', params)) as boolean;
  }

  //Returns info of a nft.
  async getNFT(symbol: string, nftId: string, extended: boolean = true): Promise<NFT> {
    let params: Array<any> = [symbol, nftId, extended];
    return (await this.JSONRPC('getNFT', params)) as NFT;
  }

  async getNFTs(symbol: string, nftIDs: string[], extended: boolean = true): Promise<NFT[]> {
    let params: Array<any> = [symbol, nftIDs.join(','), extended];
    return (await this.JSONRPC('getNFTs', params)) as NFT[];
  }
}
