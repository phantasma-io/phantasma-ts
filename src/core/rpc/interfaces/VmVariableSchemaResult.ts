import type { VmStructSchemaResult } from './VmStructSchemaResult.js';

export interface VmVariableSchemaResult {
  type: string;
  schema?: VmStructSchemaResult;
}
