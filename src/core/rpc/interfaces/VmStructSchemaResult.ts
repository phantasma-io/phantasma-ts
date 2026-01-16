import type { VmNamedVariableSchemaResult } from './VmNamedVariableSchemaResult.js';

export interface VmStructSchemaResult {
  fields: VmNamedVariableSchemaResult[];
  flags: number;
}

