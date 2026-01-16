import { Address, ContractInterface } from "../types/index.js";

export enum TokenFlags {
  None = 0,
  Transferable = 1 << 0,
  Fungible = 1 << 1,
  Finite = 1 << 2,
  Divisible = 1 << 3,
  Fuel = 1 << 4,
  Stakable = 1 << 5,
  Fiat = 1 << 6,
  Swappable = 1 << 7,
  Burnable = 1 << 8,
}

export enum TokenSeriesMode {
  Unique,
  Duplicated,
}

export interface IToken {
  readonly Name: string;
  readonly Symbol: string;
  readonly Owner: Address;
  readonly Flags: TokenFlags;
  readonly MaxSupply: BigInteger;
  readonly Decimals: number;
  readonly Script: Uint8Array;
  readonly ABI: ContractInterface;
}
