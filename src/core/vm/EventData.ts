import bigInt from "big-integer";
import { isCallSignatureDeclaration } from "typescript";
import { Decoder } from "./Decoder";
import { VMType } from "./VMType";

export enum EventKind {
  Unknown = 0,
  ChainCreate = 1,
  TokenCreate = 2,
  TokenSend = 3,
  TokenReceive = 4,
  TokenMint = 5,
  TokenBurn = 6,
  TokenStake = 7,
  TokenClaim = 8,
  AddressRegister = 9,
  AddressLink = 10,
  AddressUnlink = 11,
  OrganizationCreate = 12,
  OrganizationAdd = 13,
  OrganizationRemove = 14,
  GasEscrow = 15,
  GasPayment = 16,
  AddressUnregister = 17,
  OrderCreated = 18,
  OrderCancelled = 19,
  OrderFilled = 20,
  OrderClosed = 21,
  FeedCreate = 22,
  FeedUpdate = 23,
  FileCreate = 24,
  FileDelete = 25,
  ValidatorPropose = 26,
  ValidatorElect = 27,
  ValidatorRemove = 28,
  ValidatorSwitch = 29,
  PackedNFT = 30,
  ValueCreate = 31,
  ValueUpdate = 32,
  PollCreated = 33,
  PollClosed = 34,
  PollVote = 35,
  ChannelCreate = 36,
  ChannelRefill = 37,
  ChannelSettle = 38,
  LeaderboardCreate = 39,
  LeaderboardInsert = 40,
  LeaderboardReset = 41,
  PlatformCreate = 42,
  ChainSwap = 43,
  ContractRegister = 44,
  ContractDeploy = 45,
  AddressMigration = 46,
  ContractUpgrade = 47,
  Log = 48,
  Inflation = 49,
  OwnerAdded = 50,
  OwnerRemoved = 51,
  DomainCreate = 52,
  DomainDelete = 53,
  TaskStart = 54,
  TaskStop = 55,
  CrownRewards = 56,
  Infusion = 57,
  Crowdsale = 58,
  OrderBid = 59,
  ContractKill = 60,
  OrganizationKill = 61,
  MasterClaim = 62,
  ExecutionFailure = 63,
  Custom = 64,
  Custom_V2 = 65,
  GovernanceSetGasConfig = 66,
  GovernanceSetChainConfig = 67,
  TokenSeriesCreate = 68,
  SpecialResolution = 69,
}

export enum TypeAuction {
  Fixed = 0,
  Classic = 1,
  Reserve = 2,
  Dutch = 3,
}

export function decodeVMObject(str: string) {
  var dec = new Decoder(str);
  return dec.readVmObject();
}

export function getTokenEventData(str: string) {
  var dec = new Decoder(str);

  return {
    symbol: dec.readString(),
    value: dec.readBigIntAccurate(),
    chainName: dec.readString(),
  };
}

export function getChainValueEventData(str: string) {
  var dec = new Decoder(str);
  return {
    name: dec.readString,
    value: dec.readBigInt(),
  };
}

export function getTransactionSettleEventData(str: string) {
  var dec = new Decoder(str);
  return {
    hash: dec.read(dec.readByte()),
    platform: dec.readString(),
    chain: dec.readString(),
  };
  // public readonly Hash Hash;
}

export function getGasEventData(str: string) {
  var dec = new Decoder(str);
  return {
    address: dec.read(dec.readByte()),
    price: dec.readBigInt(),
    amount: dec.readBigInt(),
    endAmount: dec.isEnd() ? 0 : dec.readBigInt(),
  };
}

export function getInfusionEventData(str: string) {
  var dec = new Decoder(str);
  return {
    baseSymbol: dec.readString(),
    TokenID: dec.readBigIntAccurate(),
    InfusedSymbol: dec.readString(),
    InfusedValue: dec.readBigIntAccurate(),
    ChainName: dec.readString(),
  };
}

export function getMarketEventData(str: string) {
  var dec = new Decoder(str);
  return {
    baseSymbol: dec.readString(),
    quoteSymbol: dec.readString(),
    id: dec.readBigIntAccurate(),
    amount: dec.readBigInt(),
  };
}

export function getString(str: string) {
  return new Decoder(str).readString();
}
