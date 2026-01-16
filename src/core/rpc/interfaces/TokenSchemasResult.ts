import type { VmStructSchemaResult } from './VmStructSchemaResult.js';

export interface TokenSchemasResult {
  seriesMetadata: VmStructSchemaResult;
  rom: VmStructSchemaResult;
  ram: VmStructSchemaResult;
}
