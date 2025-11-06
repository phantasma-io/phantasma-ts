import type { TokenPropertyResult } from './TokenPropertyResult';

export interface TokenData {
  ID: string; //ID of token
  series: string;
  mint: string;
  chainName: string; //Chain where currently is stored
  ownerAddress: string; //Address who currently owns the token
  creatorAddress: string;
  ram: string; //Writable data of token, hex encoded
  rom: string; //Read-only data of token, hex encoded
  status: string;
  infusion: TokenPropertyResult[];
  properties: TokenPropertyResult[];
}
