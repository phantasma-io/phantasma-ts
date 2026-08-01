import type { VmValue } from './vm-value.js';

export interface KeyValue {
  key: string;
  /** Decoded VM value: a scalar string, or the array/struct shape the value really has. */
  value: VmValue;
}
