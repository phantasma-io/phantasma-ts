import { CarbonBinaryWriter } from '../../../../CarbonSerialization.js';
import {
  VmDynamicStruct,
  VmNamedVariableSchema,
  VmStructSchema,
} from '../../Vm/index.js';
import { MetadataField, pushMetadataField } from './MetadataHelper.js';

export class PhantasmaNftRomBuilder {
  private static readonly reservedFieldNames = new Set(['_i', 'rom']);

  static buildPublicMintSchema(nftRomSchema: VmStructSchema): VmStructSchema {
    return new VmStructSchema(
      (nftRomSchema.fields ?? []).filter(
        (field: VmNamedVariableSchema) => !this.reservedFieldNames.has(field.name.data)
      ),
      nftRomSchema.flags
    );
  }

  static buildAndSerialize(
    nftRomSchema: VmStructSchema,
    metadata: MetadataField[]
  ): Uint8Array {
    const reservedField = (metadata ?? []).find((field) =>
      this.reservedFieldNames.has(field.name.toLowerCase())
    );
    if (reservedField) {
      throw new Error(
        `Metadata field '${reservedField.name}' is reserved for chain-owned deterministic mint fields`
      );
    }

    const publicMintSchema = this.buildPublicMintSchema(nftRomSchema);
    const rom = new VmDynamicStruct();
    rom.fields = [];

    for (const fieldSchema of publicMintSchema.fields ?? []) {
      pushMetadataField(fieldSchema, rom, metadata);
    }

    const writer = new CarbonBinaryWriter();
    rom.writeWithSchema(publicMintSchema, writer);
    return writer.toUint8Array();
  }
}
