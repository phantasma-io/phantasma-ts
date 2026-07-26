import { logger } from '../utils/logger.js';
import fetch from 'cross-fetch';
import { Balance } from './interfaces/balance.js';
import { Organization, OrganizationMember, RpcAddressType } from './interfaces/organization.js';
import { Nexus } from './interfaces/nexus.js';
import { Account } from './interfaces/account.js';
import { AccountInfo } from './interfaces/account-info.js';
import { Leaderboard } from './interfaces/leaderboard.js';
import { Chain } from './interfaces/chain.js';
import { GasConfigResult } from './interfaces/gas-config.js';
import { EstimateTransactionResult } from './interfaces/estimate-transaction.js';
import { Contract } from './interfaces/contract.js';
import { TransactionData } from './interfaces/transaction-data.js';
import { AccountTransactions } from './interfaces/account-transactions.js';
import { Paginated } from './interfaces/paginated.js';
import { Block } from './interfaces/block.js';
import { Token } from './interfaces/token.js';
import { TokenData } from './interfaces/token-data.js';
import { Auction } from './interfaces/auction.js';
import { Script } from './interfaces/script.js';
import { Archive } from './interfaces/archive.js';
import { NFT } from './interfaces/nft.js';
import {
  BuildInfoResult,
  CursorPaginatedResult,
  PhantasmaVmConfig,
  TokenSeriesResult,
} from './interfaces/index.js';
import {
  JsonRpcParam,
  JsonRpcResponse,
  normalizeRpcError,
  RpcErrorResult,
  RpcResult,
} from './rpc-result.js';

interface RpcPeer {
  url: string;
  location: string;
  info?: string;
  msecs?: number;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function rpcHttpError(status: number, statusText: string): RpcErrorResult {
  return {
    error: statusText ? `HTTP ${status}: ${statusText}` : `HTTP ${status}`,
    status,
    statusText,
  };
}

interface HistoricalJsonRpcResponse {
  id?: string | number | null;
  result?: unknown;
  error?: { message?: string } | string;
}

export interface PhantasmaAPIOptions {
  maxRpcResponseBytes?: number;
  /** Optional API key sent in the X-Api-Key header on every RPC request. */
  apiKey?: string;
}

export const DEFAULT_MAX_RPC_RESPONSE_BYTES = 16 * 1024 * 1024;

function parseRpcNumber(result: unknown): number {
  return typeof result === 'string' ? parseInt(result, 10) : (result as number);
}

function rpcResponseIdMatches(responseId: unknown, requestId: string): boolean {
  if (typeof responseId === 'string') {
    return responseId === requestId;
  }
  if (typeof responseId === 'number' && Number.isInteger(responseId)) {
    return String(responseId) === requestId;
  }
  return false;
}

function normalizeMaxRpcResponseBytes(value: number | undefined): number {
  const maxBytes = value ?? DEFAULT_MAX_RPC_RESPONSE_BYTES;
  if (maxBytes !== Number.POSITIVE_INFINITY && (!Number.isFinite(maxBytes) || maxBytes <= 0)) {
    throw new Error('maxRpcResponseBytes must be a positive number');
  }
  return maxBytes;
}

type ResponseChunk = Uint8Array | string;

interface AsyncIterableResponseBody extends AsyncIterable<ResponseChunk> {
  destroy?: () => void;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isWebReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    isObject(value) &&
    'getReader' in value &&
    typeof (value as { getReader?: unknown }).getReader === 'function'
  );
}

function isAsyncIterableBody(value: unknown): value is AsyncIterableResponseBody {
  return isObject(value) && Symbol.asyncIterator in value;
}

function chunkBytes(chunk: ResponseChunk): Uint8Array {
  return typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
}

function appendLimitedChunk(
  chunks: Uint8Array[],
  chunk: ResponseChunk,
  totalBytes: number,
  maxBytes: number,
  method: string
): number {
  const bytes = chunkBytes(chunk);
  const nextTotal = totalBytes + bytes.byteLength;
  if (nextTotal > maxBytes) {
    throw new Error(`RPC request ${method} response body exceeds ${maxBytes} bytes`);
  }
  chunks.push(bytes);
  return nextTotal;
}

function decodeChunks(chunks: Uint8Array[], totalBytes: number): string {
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function readStreamBody(
  body: ReadableStream<Uint8Array> | AsyncIterableResponseBody,
  method: string,
  maxBytes: number
): Promise<string> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  if (isWebReadableStream(body)) {
    const reader = body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes = appendLimitedChunk(chunks, value, totalBytes, maxBytes, method);
        }
      }
    } catch (error) {
      await reader.cancel().catch(() => undefined);
      throw error;
    } finally {
      reader.releaseLock();
    }
    return decodeChunks(chunks, totalBytes);
  }

  for await (const chunk of body) {
    totalBytes = appendLimitedChunk(chunks, chunk, totalBytes, maxBytes, method);
  }
  return decodeChunks(chunks, totalBytes);
}

async function readJsonResponseBody(
  res: Response,
  method: string,
  maxBytes: number
): Promise<unknown> {
  const contentLength = res.headers.get('content-length');
  if (contentLength !== null) {
    const contentLengthBytes = Number(contentLength);
    if (Number.isFinite(contentLengthBytes) && contentLengthBytes > maxBytes) {
      throw new Error(`RPC request ${method} response body exceeds ${maxBytes} bytes`);
    }
  }

  let text: string;
  const body = res.body;
  if (isWebReadableStream(body) || isAsyncIterableBody(body)) {
    text = await readStreamBody(body, method, maxBytes);
  } else if (contentLength !== null || maxBytes === Number.POSITIVE_INFINITY) {
    text = await res.text();
  } else {
    throw new Error(`RPC request ${method} response body stream is not available`);
  }
  try {
    return JSON.parse(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON: ${message}`);
  }
}

export class PhantasmaAPI {
  host: string;
  rpcName: string;
  nexus: string;
  availableHosts: RpcPeer[];
  maxRpcResponseBytes: number;
  private nextRpcRequestId = 1;
  private apiKey?: string;

  private nextJsonRpcRequestId(): string {
    const requestId = String(this.nextRpcRequestId);
    this.nextRpcRequestId += 1;
    return requestId;
  }

  private rpcHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    return headers;
  }

  pingAsync(host: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const started = new Date().getTime();
      const http = new XMLHttpRequest();

      http.open('GET', host + '/rpc', true);
      // Under keys-only mode the health-check ping must present the key too, otherwise it gets 401 and
      // the host is wrongly dropped from availableHosts during auto-discovery.
      if (this.apiKey) {
        http.setRequestHeader('X-Api-Key', this.apiKey);
      }
      http.timeout = 4500;
      http.onreadystatechange = function () {
        if (http.readyState == 4 && http.status == 200) {
          const ended = new Date().getTime();
          const milliseconds = ended - started;
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
      } catch {
        // this is expected
        reject();
      }
    });
  }

  constructor(
    defHost: string,
    peersUrlJson: string | undefined | null,
    nexus: string,
    options: PhantasmaAPIOptions = {}
  ) {
    this.rpcName = 'Auto';
    this.nexus = nexus;
    this.host = defHost;
    this.availableHosts = [];
    this.maxRpcResponseBytes = normalizeMaxRpcResponseBytes(options.maxRpcResponseBytes);
    this.apiKey = options.apiKey || undefined;

    if (peersUrlJson != undefined && peersUrlJson != null) {
      fetch(peersUrlJson + '?_=' + new Date().getTime()).then(async (res) => {
        const data = (await res.json()) as RpcPeer[];
        for (let i = 0; i < data.length; i++) {
          const peer = data[i];
          logger.log('Checking RPC: ', peer);
          try {
            const msecs = await this.pingAsync(peer.url);
            peer.info = peer.location + ' • ' + msecs + ' ms';
            peer.msecs = msecs;
            logger.log(peer.location + ' • ' + msecs + ' ms • ' + peer.url + '/rpc');
            this.availableHosts.push(peer);
          } catch {
            logger.log('Error with RPC: ' + peer.url);
          }
        }
        this.availableHosts.sort(
          (a, b) => (a.msecs ?? Number.MAX_SAFE_INTEGER) - (b.msecs ?? Number.MAX_SAFE_INTEGER)
        );
        this.updateRpc();
      });
    }
  }

  async JSONRPCResult<T = unknown>(method: string, params: JsonRpcParam[]): Promise<RpcResult<T>> {
    const requestId = this.nextJsonRpcRequestId();
    let res;
    try {
      res = await fetch(this.host, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: requestId,
        }),
        headers: this.rpcHeaders(),
      });
    } catch (error: unknown) {
      return normalizeRpcError(error, `RPC request ${method} failed`);
    }

    if (!res.ok) {
      return rpcHttpError(res.status, res.statusText);
    }

    let resJson: unknown;
    try {
      resJson = await readJsonResponseBody(res, method, this.maxRpcResponseBytes);
    } catch (error: unknown) {
      return normalizeRpcError(error, `RPC request ${method} returned invalid JSON`);
    }

    logger.log('method', method, resJson);
    if (!isObjectRecord(resJson)) {
      return normalizeRpcError(undefined, `RPC request ${method} returned an invalid response`);
    }

    const response = resJson as Partial<JsonRpcResponse<T>> & { error?: unknown };
    if (!rpcResponseIdMatches(response.id, requestId)) {
      return normalizeRpcError(
        undefined,
        `RPC request ${method} returned a mismatched response id`
      );
    }
    if (response.error !== undefined && response.error !== null) {
      return normalizeRpcError(response.error, `RPC request ${method} failed`);
    }
    if (!('result' in response)) {
      return normalizeRpcError(undefined, `RPC request ${method} returned no result`);
    }

    return response.result as T;
  }

  async JSONRPC(method: string, params: JsonRpcParam[]): Promise<unknown> {
    const requestId = this.nextJsonRpcRequestId();
    let res;
    try {
      res = await fetch(this.host, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: requestId,
        }),
        headers: this.rpcHeaders(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`RPC request ${method} failed: ${message}`);
    }

    if (!res.ok) {
      throw new Error(
        res.statusText ? `HTTP ${res.status}: ${res.statusText}` : `HTTP ${res.status}`
      );
    }

    const resJson: unknown = await readJsonResponseBody(res, method, this.maxRpcResponseBytes);
    logger.log('method', method, resJson);
    if (!isObjectRecord(resJson)) {
      throw new Error(`RPC request ${method} returned an invalid response`);
    }
    const response = resJson as HistoricalJsonRpcResponse;
    if (!rpcResponseIdMatches(response.id, requestId)) {
      throw new Error(`RPC request ${method} returned a mismatched response id`);
    }
    if (response.error) {
      if (typeof response.error === 'object' && response.error.message)
        return { error: response.error.message };
      return { error: response.error };
    }
    if (!('result' in response)) {
      throw new Error(`RPC request ${method} returned no result`);
    }
    return response.result;
  }

  setMaxRpcResponseBytes(maxBytes: number): this {
    this.maxRpcResponseBytes = normalizeMaxRpcResponseBytes(maxBytes);
    return this;
  }

  setApiKey(apiKey: string): this {
    this.apiKey = apiKey || undefined;
    return this;
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
      logger.log('%cUpdate RPC with name ' + this.rpcName, 'font-size: 20px');
      if (this.rpcName == 'Auto') {
        this.host = this.availableHosts[0].url + '/rpc';
      } else {
        const rpc = this.availableHosts.find((h) => h.location == this.rpcName);
        if (rpc) this.host = rpc.url + '/rpc';
        else this.host = this.availableHosts[0].url + '/rpc';
      }
      logger.log('%cSet RPC api to ' + this.host, 'font-size: 20px');
    }
  }

  convertDecimals(amount: number, decimals: number): number {
    const mult = Math.pow(10, decimals);
    return amount / mult;
  }

  /**
   * Returns the account name and staking info of a given address.
   *
   * Cost is independent of how much the address holds, which makes this the endpoint to use in
   * wallet refresh loops; balances and NFTs are fetched separately through the cursor-paginated
   * account endpoints.
   */
  async getAccountInfo(account: string): Promise<AccountInfo> {
    const params: JsonRpcParam[] = [account];
    return (await this.JSONRPC('getAccountInfo', params)) as AccountInfo;
  }

  //Returns the account name and balance of given address.
  async getAccount(account: string, extended: boolean = true): Promise<Account> {
    const params: JsonRpcParam[] = [account, extended];
    return (await this.JSONRPC('getAccount', params)) as Account;
  }

  //Returns the accounts name and balance of given addresses.
  async getAccounts(accounts: string[], extended: boolean = true): Promise<Account[]> {
    const params: JsonRpcParam[] = [accounts.join(','), extended];
    return (await this.JSONRPC('getAccounts', params)) as Account[];
  }

  //Returns the address that owns a given name.
  async lookUpName(name: string): Promise<string> {
    const params: JsonRpcParam[] = [name];
    return (await this.JSONRPC('lookUpName', params)) as string;
  }

  //Returns the height of a chain.
  async getBlockHeight(chainInput: string): Promise<number> {
    const params: JsonRpcParam[] = [chainInput];
    const result = await this.JSONRPC('getBlockHeight', params);
    return parseRpcNumber(result);
  }

  //Returns the number of transactions of given block hash or error if given hash is invalid or is not found.
  async getBlockTransactionCountByHash(
    chainAddressOrName: string,
    blockHash: string
  ): Promise<number> {
    const params: JsonRpcParam[] = [chainAddressOrName, blockHash];
    const result = await this.JSONRPC('getBlockTransactionCountByHash', params);
    return parseRpcNumber(result);
  }

  //Returns information about a block by hash.
  async getBlockByHash(blockHash: string): Promise<Block> {
    const params: JsonRpcParam[] = [blockHash];
    return (await this.JSONRPC('getBlockByHash', params)) as Block;
  }

  //Returns information about a block by height and chain.
  async getBlockByHeight(chainInput: string, height: number): Promise<Block> {
    const params: JsonRpcParam[] = [chainInput, height];
    return (await this.JSONRPC('getBlockByHeight', params)) as Block;
  }

  //Returns information about a block by height and chain.
  async getLatestBlock(chainInput: string): Promise<Block> {
    const params: JsonRpcParam[] = [chainInput];
    return (await this.JSONRPC('getLatestBlock', params)) as Block;
  }

  //Returns the information about a transaction requested by a block hash and transaction index.
  async getTransactionByBlockHashAndIndex(
    chainAddressOrName: string,
    blockHash: string,
    index: number
  ): Promise<TransactionData> {
    const params: JsonRpcParam[] = [chainAddressOrName, blockHash, index];
    return (await this.JSONRPC('getTransactionByBlockHashAndIndex', params)) as TransactionData;
  }

  //Returns last X transactions of given address.
  async getAddressTransactions(
    account: string,
    page: number,
    pageSize: number
  ): Promise<Paginated<AccountTransactions>> {
    const params: JsonRpcParam[] = [account, page, pageSize];
    return (await this.JSONRPC('getAddressTransactions', params)) as Paginated<AccountTransactions>;
  }

  //Get number of transactions in a specific address and chain
  async getAddressTransactionCount(account: string, chainInput: string): Promise<number> {
    const params: JsonRpcParam[] = [account, chainInput];
    return (await this.JSONRPC('getAddressTransactionCount', params)) as number;
  }

  // Broadcasts a manually built signed operation to the network.
  async sendRawTransaction(txData: string): Promise<string> {
    const params: JsonRpcParam[] = [txData];
    return (await this.JSONRPC('sendRawTransaction', params)) as string;
  }

  // Broadcasts a signed Carbon transaction to the network.
  async sendCarbonTransaction(txData: string): Promise<string> {
    const params: JsonRpcParam[] = [txData];
    return (await this.JSONRPC('sendCarbonTransaction', params)) as string;
  }

  // Invokes a script against network state without state changes.
  async invokeRawScript(chainInput: string, scriptData: string): Promise<Script> {
    const params: JsonRpcParam[] = [chainInput, scriptData];
    return (await this.JSONRPC('invokeRawScript', params)) as Script;
  }

  //Returns information about a transaction by hash.
  async getTransaction(hashText: string): Promise<TransactionData> {
    const params: JsonRpcParam[] = [hashText];
    return (await this.JSONRPC('getTransaction', params)) as TransactionData;
  }

  //Returns an array of all chains deployed in Phantasma.
  // Warning: current Carbon RPC endpoint is stubbed and returns an empty array.
  async getChains(extended: boolean = true): Promise<Chain[]> {
    const params: JsonRpcParam[] = [extended];
    return (await this.JSONRPC('getChains', params)) as Chain[];
  }

  //Return the chain
  // Warning: current Carbon RPC endpoint is stubbed and returns a default chain object.
  async getChain(name: string, extended: boolean = true): Promise<Chain> {
    const params: JsonRpcParam[] = [name, extended];
    return (await this.JSONRPC('getChain', params)) as Chain;
  }

  /**
   * Returns the current on-chain gas configuration plus the chain parameters fee estimation
   * needs (block rate target, expiry window). Changes only via governance resolutions, so the
   * result is safe to cache. Feed gasConfigFromRpc() into estimateNativeFee() for Tier-1 fee
   * estimates.
   */
  async getGasConfig(): Promise<GasConfigResult> {
    const params: JsonRpcParam[] = [];
    return (await this.JSONRPC('getGasConfig', params)) as GasConfigResult;
  }

  /**
   * Dry-runs a serialized transaction envelope against current chain state and returns its exact
   * fee bill with recommended maxGas/maxData ceilings (gas-model-v2 Tier-2 estimate). Signatures
   * inside the envelope may be zero-filled dummies of the correct length - the simulation skips
   * signature checks, and dummies preserve the exact envelope byte length the bill depends on.
   * Until the estimate service is launched this method returns a standard RPC error; use the
   * Tier-1 estimateNativeFee() with getGasConfig() as the fallback.
   */
  async estimateTransaction(txData: string): Promise<EstimateTransactionResult> {
    const params: JsonRpcParam[] = [txData];
    return (await this.JSONRPC('estimateTransaction', params)) as EstimateTransactionResult;
  }

  //Returns info about the nexus.
  // Warning: current Carbon RPC endpoint is stubbed and returns a default nexus object.
  async getNexus(extended: boolean = true): Promise<Nexus> {
    const params: JsonRpcParam[] = [extended];
    return (await this.JSONRPC('getNexus', params)) as Nexus;
  }

  //Returns an array of contracts  deployed in Phantasma.
  async getContracts(
    chainAddressOrName: string = 'main',
    extended: boolean = true
  ): Promise<Contract[]> {
    const params: JsonRpcParam[] = [chainAddressOrName, extended];
    return (await this.JSONRPC('getContracts', params)) as Contract[];
  }

  //Returns the contract info deployed in Phantasma.
  async getContract(chainAddressOrName: string = 'main', contractName: string): Promise<Contract> {
    const params: JsonRpcParam[] = [chainAddressOrName, contractName];
    return (await this.JSONRPC('getContract', params)) as Contract;
  }

  async getContractByAddress(
    chainAddressOrName: string = 'main',
    contractAddress: string
  ): Promise<Contract> {
    const params: JsonRpcParam[] = [chainAddressOrName, contractAddress];
    return (await this.JSONRPC('getContractByAddress', params)) as Contract;
  }

  async getOrganization(name: string, includeMemberCount: boolean = false): Promise<Organization> {
    const params: JsonRpcParam[] = [name, includeMemberCount];
    return (await this.JSONRPC('getOrganization', params)) as Organization;
  }

  async getOrganizations(
    pageSize: number = 10,
    cursor: string = '',
    includeMemberCount: boolean = false
  ): Promise<CursorPaginatedResult<Organization[]>> {
    const params: JsonRpcParam[] = [pageSize, cursor, includeMemberCount];
    return (await this.JSONRPC('getOrganizations', params)) as CursorPaginatedResult<
      Organization[]
    >;
  }

  async getOrganizationMembers(
    name: string,
    pageSize: number = 10,
    cursor: string = '',
    includeMemberTime: boolean = true
  ): Promise<CursorPaginatedResult<OrganizationMember[]>> {
    const params: JsonRpcParam[] = [name, pageSize, cursor, includeMemberTime];
    return (await this.JSONRPC('getOrganizationMembers', params)) as CursorPaginatedResult<
      OrganizationMember[]
    >;
  }

  async getOrganizationMember(
    name: string,
    address: string,
    checkAddressReservedByte: boolean = true,
    addressType: RpcAddressType = 'Phantasma'
  ): Promise<OrganizationMember> {
    const params: JsonRpcParam[] = [name, address, checkAddressReservedByte, addressType];
    return (await this.JSONRPC('getOrganizationMember', params)) as OrganizationMember;
  }

  //Returns content of a Phantasma leaderboard.
  // Warning: current Carbon RPC endpoint is stubbed and returns a default leaderboard object.
  async getLeaderboard(name: string): Promise<Leaderboard> {
    const params: JsonRpcParam[] = [name];
    return (await this.JSONRPC('getLeaderboard', params)) as Leaderboard;
  }

  //Returns an array of tokens deployed in Phantasma.
  async getTokens(
    ownerAddress: string | undefined | null,
    extended: boolean = true
  ): Promise<Token[]> {
    const params: JsonRpcParam[] = [extended, ownerAddress];
    return (await this.JSONRPC('getTokens', params)) as Token[];
  }

  //Returns info about a specific token deployed in Phantasma.
  async getToken(
    symbol: string,
    extended: boolean = true,
    carbonTokenId: bigint = 0n
  ): Promise<Token> {
    const params: JsonRpcParam[] = [symbol, extended, carbonTokenId.toString()];
    return (await this.JSONRPC('getToken', params)) as Token;
  }

  //Returns data of a non-fungible token, in hexadecimal format.
  async getTokenData(symbol: string, IDtext: string): Promise<TokenData> {
    const params: JsonRpcParam[] = [symbol, IDtext];
    return (await this.JSONRPC('getTokenData', params)) as TokenData;
  }

  //Returns the balance for a specific token and chain, given an address.
  async getTokenBalance(
    account: string,
    tokenSymbol: string,
    chainInput: string,
    checkAddressResevedByte: boolean = true
  ): Promise<Balance> {
    const params: JsonRpcParam[] = [account, tokenSymbol, chainInput, checkAddressResevedByte];
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
    const params: JsonRpcParam[] = [symbol, carbonTokenId.toString(), pageSize, cursor];
    return (await this.JSONRPC('getTokenSeries', params)) as CursorPaginatedResult<
      TokenSeriesResult[]
    >;
  }

  // Returns one token series by Phantasma or Carbon identifiers.
  async getTokenSeriesById(
    symbol: string,
    carbonTokenId: bigint,
    seriesId: string,
    carbonSeriesId: number
  ): Promise<TokenSeriesResult> {
    const params: JsonRpcParam[] = [symbol, carbonTokenId.toString(), seriesId, carbonSeriesId];
    return (await this.JSONRPC('getTokenSeriesById', params)) as TokenSeriesResult;
  }

  // Returns NFTs for a token (optionally restricted to a series) with cursor pagination.
  async getTokenNFTs(
    carbonTokenId: bigint,
    carbonSeriesId: number = 0,
    pageSize: number = 10,
    cursor: string = '',
    extended: boolean = false
  ): Promise<CursorPaginatedResult<NFT[]>> {
    const params: JsonRpcParam[] = [
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
    const params: JsonRpcParam[] = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      pageSize,
      cursor,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountFungibleTokens', params)) as CursorPaginatedResult<
      Balance[]
    >;
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
    const params: JsonRpcParam[] = [
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
    const params: JsonRpcParam[] = [
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
    const params: JsonRpcParam[] = [
      account,
      tokenSymbol,
      carbonTokenId.toString(),
      pageSize,
      cursor,
      checkAddressReservedByte,
    ];
    return (await this.JSONRPC('getAccountOwnedTokenSeries', params)) as CursorPaginatedResult<
      TokenSeriesResult[]
    >;
  }

  //Returns the number of active auctions.
  async getAuctionsCount(chainAddressOrName: string, symbol: string): Promise<number> {
    const params: JsonRpcParam[] = [chainAddressOrName, symbol];
    return (await this.JSONRPC('getAuctionsCount', params)) as number;
  }

  //Returns the auctions available in the market.
  async getAuctions(
    chainAddressOrName: string,
    symbol: string,
    page: number,
    pageSize: number
  ): Promise<Paginated<Auction[]>> {
    const params: JsonRpcParam[] = [chainAddressOrName, symbol, page, pageSize];
    return (await this.JSONRPC('getAuctions', params)) as Paginated<Auction[]>;
  }

  //Returns the auction for a specific token.
  async getAuction(chainAddressOrName: string, symbol: string, IDtext: string): Promise<Auction> {
    const params: JsonRpcParam[] = [chainAddressOrName, symbol, IDtext];
    return (await this.JSONRPC('getAuction', params)) as Auction;
  }

  //Returns info about a specific archive.
  // Warning: current Carbon RPC endpoint is stubbed and returns a default archive object.
  async getArchive(hashText: string): Promise<Archive> {
    const params: JsonRpcParam[] = [hashText];
    return (await this.JSONRPC('getArchive', params)) as Archive;
  }

  //Writes the contents of an incomplete archive.
  // Warning: current Carbon RPC endpoint is stubbed and returns false without persisting data.
  async writeArchive(hashText: string, blockIndex: number, blockContent: string): Promise<boolean> {
    const params: JsonRpcParam[] = [hashText, blockIndex, blockContent];
    return (await this.JSONRPC('writeArchive', params)) as boolean;
  }

  //Returns info of a nft.
  async getNFT(symbol: string, nftId: string, extended: boolean = true): Promise<NFT> {
    const params: JsonRpcParam[] = [symbol, nftId, extended];
    return (await this.JSONRPC('getNFT', params)) as NFT;
  }

  async getNFTs(symbol: string, nftIDs: string[], extended: boolean = true): Promise<NFT[]> {
    const params: JsonRpcParam[] = [symbol, nftIDs.join(','), extended];
    return (await this.JSONRPC('getNFTs', params)) as NFT[];
  }

  async getVersion(): Promise<BuildInfoResult> {
    return (await this.JSONRPC('getVersion', [])) as BuildInfoResult;
  }

  async getPhantasmaVmConfig(chainAddressOrName: string): Promise<PhantasmaVmConfig> {
    const params: JsonRpcParam[] = [chainAddressOrName];
    return (await this.JSONRPC('getPhantasmaVmConfig', params)) as PhantasmaVmConfig;
  }
}
