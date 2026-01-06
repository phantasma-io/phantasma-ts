export interface TokenCreateData {
  symbol: string;
  maxSupply: string;
  decimals: number;
  isNonFungible: boolean;
  carbonTokenId: string;
  metadata: Record<string, string>;
}

export interface TokenSeriesCreateData {
  symbol: string;
  seriesId: string;
  maxMint: number;
  maxSupply: number;
  owner: string;
  carbonTokenId: string;
  carbonSeriesId: number;
  metadata: Record<string, string>;
}

export interface TokenMintData {
  symbol: string;
  tokenId: string;
  seriesId: string;
  mintNumber: number;
  carbonTokenId: string;
  carbonSeriesId: number;
  carbonInstanceId: string;
  owner: string;
  metadata: Record<string, string>;
}

export interface MarketOrderData {
  baseSymbol: string;
  quoteSymbol: string;
  tokenId: string;
  carbonBaseTokenId: string;
  carbonQuoteTokenId: string;
  carbonInstanceId: string;
  seller: string;
  buyer: string;
  price: string;
  endPrice: string;
  startDate: number;
  endDate: number;
  type: string;
}

export interface SpecialResolutionCall {
  moduleId: number;
  module: string;
  methodId: number;
  method: string;
  arguments?: Record<string, string>;
  calls?: SpecialResolutionCall[];
}

export interface SpecialResolutionData {
  resolutionId: string;
  description?: string;
  calls: SpecialResolutionCall[];
}

export type ExtendedEventData =
  | TokenCreateData
  | TokenSeriesCreateData
  | TokenMintData
  | MarketOrderData
  | SpecialResolutionData;

export interface EventExtended<T = unknown> {
  address: string;
  contract: string;
  kind: string;
  data: T;
}

export type EventExtendedTyped = EventExtended<ExtendedEventData>;
