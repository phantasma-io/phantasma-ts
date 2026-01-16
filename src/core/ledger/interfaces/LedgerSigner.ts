import { Address } from '../../types/index.js';

export interface LedgerSigner {
  GetPublicKey: () => string;
  GetAccount: () => Address;
}
