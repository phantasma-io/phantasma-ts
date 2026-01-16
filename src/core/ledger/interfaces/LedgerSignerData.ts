import { Address } from '../../types/index.js';

export interface LedgerSignerData {
  success: boolean;
  message: string;
  publicKey?: string;
  address?: Address;
}
