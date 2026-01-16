import type { KeyValue } from './KeyValue.js';

export interface NFT {
  ID: string;
  series: string;
  carbonTokenId: string;
  carbonNftAddress: string;
  mint: string;
  chainName: string;
  ownerAddress: string;
  creatorAddress: string;
  ram: string;
  rom: string;
  status: string;
  infusion: KeyValue[];
  properties: KeyValue[];
}
