import type { SpecialResolutionArguments } from './special-resolution-arguments.js';

// Numeric fields mirror the wire exactly. Chain amounts and big-integer ids (tokenId, seriesId,
// prices) travel as strings because JSON numbers lose precision above 2^53; Carbon-side ids
// (carbonTokenId, carbonInstanceId, resolutionId) and timestamps are plain JSON numbers, exactly
// as the node serializes them.

export interface TokenCreateData {
  symbol: string;
  maxSupply: string;
  decimals: number;
  isNonFungible: boolean;
  carbonTokenId: number;
  metadata: Record<string, string>;
}

export interface TokenSeriesCreateData {
  symbol: string;
  seriesId: string;
  maxMint: number;
  maxSupply: number;
  owner: string;
  carbonTokenId: number;
  carbonSeriesId: number;
  metadata: Record<string, string>;
}

export interface MarketOrderData {
  baseSymbol: string;
  quoteSymbol: string;
  tokenId: string;
  carbonBaseTokenId: number;
  carbonQuoteTokenId: number;
  carbonInstanceId: number;
  seller: string;
  buyer: string;
  price: string;
  endPrice: string;
  startDate: number;
  endDate: number;
  type: string;
}

/**
 * One call carried by a special resolution.
 *
 * `arguments` is typed per method: `module` and `method` decide the shape, and
 * `SpecialResolutionArgumentsByMethod` lists every pair this build models. Declare the type
 * parameter once the method is known - `SpecialResolutionCall<TransferFungibleArguments>` - to read
 * the fields without a cast.
 */
export interface SpecialResolutionCall<
  TArguments extends SpecialResolutionArguments = SpecialResolutionArguments,
> {
  moduleId: number;
  module: string;
  methodId: number;
  method: string;
  arguments?: TArguments;
  calls?: SpecialResolutionCall[];
}

export interface SpecialResolutionData {
  /** Numeric on the wire, unlike the string `resolutionId` of `NestedResolutionArguments`. */
  resolutionId: number;
  description?: string;
  calls: SpecialResolutionCall[];
}

export type ExtendedEventData =
  | TokenCreateData
  | TokenSeriesCreateData
  | MarketOrderData
  | SpecialResolutionData;

export interface EventExtended<T = unknown> {
  address: string;
  contract: string;
  kind: string;
  data: T;
}

export type EventExtendedTyped = EventExtended<ExtendedEventData>;
