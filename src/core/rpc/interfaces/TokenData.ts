import type { KeyValue } from './KeyValue';

export interface TokenData {
  ID: string; //ID of token
  series: string;
  carbonTokenId: string;
  carbonNftAddress: string; //Carbon NFT address (hex)
  mint: string;
  chainName: string; //Chain where currently is stored
  ownerAddress: string; //Address who currently owns the token
  creatorAddress: string;
  ram: string; //Writable data of token, hex encoded
  rom: string; //Read-only data of token, hex encoded
  status: string;
  infusion: KeyValue[];
  properties: KeyValue[];
}
