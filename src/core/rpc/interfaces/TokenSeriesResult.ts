import type { ABIMethod } from './ABIMethod.js';
import type { KeyValue } from './KeyValue.js';

export interface TokenSeriesResult {
  seriesId: string; // Phantasma series ID, up to 32 bytes
  carbonTokenId: string; // Carbon token ID to which this series belongs
  carbonSeriesId: string; // Carbon series ID
  currentSupply: string; // Current amount of tokens in circulation
  maxSupply: string; // Maximum possible amount of tokens
  burnedSupply: string; // Total amount of burned tokens
  mode: string;
  script: string;
  methods: ABIMethod[]; // List of methods
  metadata: KeyValue[]; // Series metadata
}
