import type { VmVariableSchemaResult } from './VmVariableSchemaResult.js';

export interface VmNamedVariableSchemaResult {
  name: string;
  schema: VmVariableSchemaResult;
}
