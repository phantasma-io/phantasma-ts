import { Interop } from './Interop.js';

export interface Platform {
  platform: string;
  chain: string;
  fuel: string;
  tokens: Array<string>;
  interop: Array<Interop>;
}
