import type { VmStructSchemaResult } from './VmStructSchemaResult';

export interface TokenSchemasResult {
  seriesMetadata: VmStructSchemaResult;
  rom: VmStructSchemaResult;
  ram: VmStructSchemaResult;
}
