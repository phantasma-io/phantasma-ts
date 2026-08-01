import type { VmValue } from './vm-value.js';

/**
 * Decoded arguments of one call inside a special resolution.
 *
 * The shape is decided by the `module` and `method` of the call that carries it, so read
 * `arguments` after checking those two - `SpecialResolutionArgumentsByMethod` maps every pair this
 * build models to its shape. A call whose method the answering node could not decode carries
 * {@link RawArguments} instead, never a half-filled object.
 *
 * Every numeric field is a string: chain values are big integers and JSON numbers lose precision
 * above 2^53.
 *
 * The union is closed over the methods this build knows. A node newer than this SDK can answer a
 * method that is not listed here; its arguments then arrive as a plain object matching none of the
 * members, so treat an unrecognised `module`/`method` pair as opaque instead of assuming one of
 * these shapes.
 */
export type SpecialResolutionArguments =
  | RawArguments
  | GasConfigArguments
  | ChainConfigArguments
  | NestedResolutionArguments
  | MetadataArguments
  | NodeConfigArguments
  | RegisterNameArguments
  | AddressArguments
  | NameArguments
  | ExecuteScriptArguments
  | RegisterTokenContractArguments
  | DeployContractArguments
  | PhantasmaVmConfigArguments
  | ImportContractsArguments
  | RepairSeriesArguments
  | RepairTokenArguments
  | TokenReferenceArguments
  | TokenSeriesReferenceArguments
  | SymbolArguments
  | TransferFungibleArguments
  | TransferNonFungibleArguments
  | MintFungibleArguments
  | BurnFungibleArguments
  | BalanceArguments
  | CreateTokenArguments
  | TokenSeriesArguments
  | CreateMintedTokenSeriesArguments
  | MintNonFungibleArguments
  | MintPhantasmaNonFungibleArguments
  | BurnNonFungibleArguments
  | NonFungibleInfoArguments
  | NonFungibleInfoByRomIdArguments
  | SeriesInfoByMetaIdArguments
  | TokensConfigArguments
  | UpdateTokenMetadataArguments
  | UpdateSeriesMetadataArguments;

/** Arguments of a call this node build cannot decode: the raw argument buffer as hex. */
export interface RawArguments {
  rawArgs: string;
}

// Governance module.

export interface GasConfigArguments {
  version: string;
  maxNameLength: string;
  maxTokenSymbolLength: string;
  feeShift: string;
  maxStructureSize: string;
  feeMultiplier: string;
  gasTokenId: string;
  dataTokenId: string;
  minimumGasOffer: string;
  dataEscrowPerRow: string;
  gasFeeTransfer: string;
  gasFeeQuery: string;
  gasFeeCreateTokenBase: string;
  gasFeeCreateTokenSymbol: string;
  gasFeeCreateTokenSeries: string;
  gasFeePerByte: string;
  gasFeeRegisterName: string;
  gasBurnRatioMul: string;
  gasBurnRatioShift: string;
  // Gas-model-v2 tail: present only when the packaged config declares version >= 1.
  minimumGasBill?: string;
  gasProducerRatioMul?: string;
  gasProducerRatioShift?: string;
  gasDappRatioMul?: string;
  gasDappRatioShift?: string;
  policyFeeCreateTokenBase?: string;
  policyFeeCreateTokenSymbol?: string;
  policyFeeCreateTokenSeries?: string;
  policyFeeRegisterName?: string;
  legacyDataEscrowPerRow?: string;
}

export interface ChainConfigArguments {
  version: string;
  reserved1: string;
  reserved2: string;
  reserved3: string;
  allowedTxTypes: string;
  expiryWindow: string;
  blockRateTarget: string;
}

/**
 * A special resolution nested inside another one. Its own calls are reported in the carrying call's
 * `calls`, not here.
 */
export interface NestedResolutionArguments {
  resolutionId: string;
}

export interface MetadataArguments {
  metadata: Record<string, VmValue>;
}

export interface ConsensusNode {
  id: string;
  type: string;
}

export interface NodeConfigArguments {
  nodes: ConsensusNode[];
}

export interface RegisterNameArguments {
  address: string;
  name: string;
}

export interface AddressArguments {
  address: string;
}

export interface NameArguments {
  name: string;
}

// Phantasma VM module.

export interface ExecuteScriptArguments {
  maxGas: string;
  gasFrom: string;
  script: string;
}

export interface RegisterTokenContractArguments {
  tokenId: string;
  symbol: string;
  script: string;
  abi: string;
  /** Resolved token symbol; absent when the token could not be resolved at answer time. */
  token?: string;
}

export interface DeployContractArguments {
  from: string;
  contractName: string;
  script: string;
  abi: string;
}

export interface PhantasmaVmConfigArguments {
  featureLevel: string;
  gasConstructor: string;
  gasNexus: string;
  gasOrganization: string;
  gasAccount: string;
  gasLeaderboard: string;
  gasStandard: string;
  gasOracle: string;
  fuelPerContractDeploy: string;
}

/** A key/value row of contract storage, both sides hex-encoded because they hold arbitrary bytes. */
export interface ContractStorageRow {
  key: string;
  value: string;
}

/** One map or list table of a contract, with every row it carries. */
export interface ContractStorageTable {
  name: string;
  rows: ContractStorageRow[];
}

/** One contract restored by a migration: identity, code and the whole of its stored state. */
export interface ImportedContract {
  name: string;
  address: string;
  owner: string;
  script: string;
  abi: string;
  /** Root-level contract variables. */
  rootVariables: ContractStorageRow[];
  /** Map and list tables, including their backing rows. */
  tables: ContractStorageTable[];
}

export interface ImportContractsArguments {
  contractsCount: string;
  contracts: ImportedContract[];
}

/** Definition needed to rebuild one Phantasma series. */
export interface SeriesSupplement {
  token: string;
  tokenId: string;
  phantasmaSeriesId: string;
  maxSupply: string;
  mintCount: string;
  mode: string;
  script: string;
  abi: string;
  rom: string;
}

/** Mint-count repair of one Phantasma series. */
export interface SeriesMintCountRepair {
  token: string;
  tokenId: string;
  phantasmaSeriesId: string;
  importedLiveCount: string;
  script: string;
  abi: string;
}

export interface RepairSeriesArguments {
  supplementsCount: string;
  supplements: SeriesSupplement[];
  repairsCount: string;
  repairs: SeriesMintCountRepair[];
}

/** Repair of one token definition. */
export interface TokenRepair {
  token: string;
  tokenId: string;
  symbol: string;
  script: string;
  abi: string;
  tokenFlags: string;
  /**
   * Bitmask of the repair operations the chain was asked to perform. Kept numeric on purpose: a new
   * chain-side operation must not silently render as an unrelated name here.
   */
  repairMask: string;
}

export interface RepairTokenArguments {
  repairsCount: string;
  repairs: TokenRepair[];
}

// Token module. Shapes that repeat across methods share one type on purpose: a query by token id
// looks the same whichever query it is.

/** Token identity: the resolved symbol plus the numeric id it was resolved from. */
export interface TokenReferenceArguments {
  token: string;
  tokenId: string;
}

export interface TokenSeriesReferenceArguments extends TokenReferenceArguments {
  seriesId: string;
}

export interface SymbolArguments {
  symbol: string;
}

export interface TransferFungibleArguments extends TokenReferenceArguments {
  from: string;
  to: string;
  amount: string;
}

export interface TransferNonFungibleArguments extends TokenReferenceArguments {
  from: string;
  to: string;
  instanceIds: string[];
}

export interface MintFungibleArguments extends TokenReferenceArguments {
  to: string;
  amount: string;
}

export interface BurnFungibleArguments extends TokenReferenceArguments {
  from: string;
  amount: string;
}

export interface BalanceArguments extends TokenReferenceArguments {
  address: string;
}

export interface CreateTokenArguments {
  symbol: string;
  owner: string;
  maxSupply: string;
  decimals: string;
  flags: string;
  /** Decoded metadata fields; absent when the token carries none. */
  metadata?: Record<string, VmValue>;
  /** NFT schema blob as hex; absent for fungible tokens. */
  tokenSchemas?: string;
}

/** Series definition, as carried by a series-creating call. */
export interface TokenSeriesArguments extends TokenReferenceArguments {
  owner: string;
  maxMint: string;
  maxSupply: string;
  /** Decoded series metadata; absent when the token declares no schema for it. */
  metadata?: Record<string, VmValue>;
  /** Phantasma series id taken from the decoded metadata, when the schema carries one. */
  seriesId?: string;
  /** Metadata blob as hex, reported instead of `metadata` when it cannot be decoded. */
  metadataRaw?: string;
}

export interface CreateMintedTokenSeriesArguments extends TokenSeriesArguments {
  recipient: string;
  roms: string[];
  rams: string[];
}

/** One NFT to mint, addressed by the carbon series id. */
export interface NftMint {
  seriesId: string;
  rom: string;
  ram: string;
}

/** One NFT to mint, addressed by the 32-byte Phantasma series id. */
export interface PhantasmaNftMint {
  phantasmaSeriesId: string;
  rom: string;
  ram: string;
}

export interface MintNonFungibleArguments extends TokenReferenceArguments {
  owner: string;
  tokens: NftMint[];
}

export interface MintPhantasmaNonFungibleArguments extends TokenReferenceArguments {
  owner: string;
  tokens: PhantasmaNftMint[];
}

export interface BurnNonFungibleArguments extends TokenReferenceArguments {
  address: string;
  instanceIds: string[];
}

export interface NonFungibleInfoArguments extends TokenReferenceArguments {
  instanceId: string;
  getSchemas: string;
}

export interface NonFungibleInfoByRomIdArguments extends TokenReferenceArguments {
  romId: string;
  getSchemas: string;
}

export interface SeriesInfoByMetaIdArguments extends TokenReferenceArguments {
  romId: string;
}

export interface TokensConfigArguments {
  flags: string;
  /** Names of the flags that are set, including a Reserved0xNN entry for unknown bits. */
  flagsNames: string[];
}

export interface UpdateTokenMetadataArguments extends TokenReferenceArguments {
  metadata?: Record<string, VmValue>;
}

export interface UpdateSeriesMetadataArguments extends TokenReferenceArguments {
  seriesId: string;
  /** Metadata blob as hex: this call carries it unschematized. */
  metadata: string;
}

/**
 * Argument shape per `${module}.${method}`, for the methods this build models.
 *
 * Use it to type a call once its module and method are known:
 * `const args = call.arguments as SpecialResolutionArgumentsByMethod['token.TransferFungible']`,
 * or by declaring the call as `SpecialResolutionCall<TransferFungibleArguments>`. A method missing
 * from this map is not an error - the node answers `rawArgs` for anything it cannot decode.
 */
export interface SpecialResolutionArgumentsByMethod {
  'governance.SetGasConfig': GasConfigArguments;
  'governance.SetChainConfig': ChainConfigArguments;
  'governance.SpecialResolution': NestedResolutionArguments;
  'governance.SetMetadata': MetadataArguments;
  'governance.SetNodeConfig': NodeConfigArguments;
  'governance.RegisterName': RegisterNameArguments;
  'governance.LookupName': AddressArguments;
  'governance.LookupAddress': NameArguments;
  'phantasma_vm.ExecuteScript': ExecuteScriptArguments;
  'phantasma_vm.RegisterTokenContract': RegisterTokenContractArguments;
  'phantasma_vm.DeployContract': DeployContractArguments;
  'phantasma_vm.IsContractDeployed': NameArguments;
  'phantasma_vm.SetConfig': PhantasmaVmConfigArguments;
  'phantasma_vm.ImportContracts': ImportContractsArguments;
  'phantasma_vm.RepairSeries': RepairSeriesArguments;
  'phantasma_vm.RepairToken': RepairTokenArguments;
  'token.TransferFungible': TransferFungibleArguments;
  'token.TransferNonFungible': TransferNonFungibleArguments;
  'token.CreateToken': CreateTokenArguments;
  'token.MintFungible': MintFungibleArguments;
  'token.BurnFungible': BurnFungibleArguments;
  'token.GetBalance': BalanceArguments;
  'token.CreateTokenSeries': TokenSeriesArguments;
  'token.DeleteTokenSeries': TokenSeriesReferenceArguments;
  'token.MintNonFungible': MintNonFungibleArguments;
  'token.BurnNonFungible': BurnNonFungibleArguments;
  'token.GetNonFungibleInfo': NonFungibleInfoArguments;
  'token.GetNonFungibleInfoByRomId': NonFungibleInfoByRomIdArguments;
  'token.GetSeriesInfo': TokenSeriesReferenceArguments;
  'token.GetSeriesInfoByMetaId': SeriesInfoByMetaIdArguments;
  'token.GetTokenInfo': TokenReferenceArguments;
  'token.GetTokenInfoBySymbol': SymbolArguments;
  'token.GetTokenSupply': TokenReferenceArguments;
  'token.GetSeriesSupply': TokenSeriesReferenceArguments;
  'token.GetTokenIdBySymbol': SymbolArguments;
  'token.GetBalances': AddressArguments;
  'token.CreateMintedTokenSeries': CreateMintedTokenSeriesArguments;
  'token.ApplyInflation': TokenReferenceArguments;
  'token.UpdateTokenMetadata': UpdateTokenMetadataArguments;
  'token.GetNextTokenInflation': TokenReferenceArguments;
  'token.SetTokensConfig': TokensConfigArguments;
  'token.UpdateSeriesMetadata': UpdateSeriesMetadataArguments;
  'token.MintPhantasmaNonFungible': MintPhantasmaNonFungibleArguments;
}
