import { ContractInterface } from "../types/index.js";

export interface IContract {
  Name: string;
  ABI: ContractInterface;
}

export enum NativeContractKind {
  Gas,
  Block,
  Stake,
  Swap,
  Account,
  Consensus,
  Governance,
  Storage,
  Validator,
  Interop,
  Exchange,
  Privacy,
  Relay,
  Ranking,
  Market,
  Friends,
  Mail,
  Sale,
  Unknown,
}
