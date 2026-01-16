import { TokenExternal } from './TokenExternal.js';
import { TokenPrice } from './TokenPrice.js';
import { TokenSeries } from './TokenSeries.js';
import type { TokenSchemasResult } from './TokenSchemasResult.js';

export interface Token {
  symbol: string; //Ticker symbol for the token
  name: string;
  decimals: number; //Amount of decimals when converting from fixed point format to decimal format
  currentSupply: string; //Amount of minted tokens
  maxSupply: string; //Max amount of tokens that can be minted
  burnedSupply: string;
  address: string;
  owner: string;
  flags: string;
  script: string;
  series: Array<TokenSeries>;
  carbonId: string;
  tokenSchemas?: TokenSchemasResult;
  external?: Array<TokenExternal>;
  price?: Array<TokenPrice>;
}
