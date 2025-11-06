import type { VmVariableSchemaResult } from './VmVariableSchemaResult';

export interface VmNamedVariableSchemaResult {
  name: string;
  schema: VmVariableSchemaResult;
}
