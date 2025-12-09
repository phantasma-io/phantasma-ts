import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmStructSchema, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { findMetadataField, MetadataField, nftDefaultMetadataFields, pushMetadataField } from './MetadataHelper';

export class NftRomBuilder {
  static buildAndSerialize(
    nftRomSchema: VmStructSchema,
    phantasmaNftId: bigint,
    metadata: MetadataField[]
  ): Uint8Array {
    const wRom = new CarbonBinaryWriter();

    const romField = findMetadataField(metadata, 'rom');
    let rom: Uint8Array | string;
    if(romField) {
      if(!(romField.value instanceof Uint8Array || typeof romField.value === "string")) {
        throw Error("'rom' must be a byte array or hex string");
      }
      rom = romField.value;
    }

    const nftRom = new VmDynamicStruct();
    nftRom.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, phantasmaNftId),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, rom ? rom : [])
    ];

    nftRomSchema.fields.forEach(s => {
      // We don't verify default fields here, they are treated differently
      // in the code above.
      if(!nftDefaultMetadataFields.some(df => df.name === s.name.data)) {
        pushMetadataField(s, nftRom, metadata);
      }
    });

    nftRom.writeWithSchema(
      nftRomSchema,
      wRom
    );

    // console.log("nftRom.fields.length: ", nftRom.fields.length);
    // TokenSchemasBuilder.logSchema(nftRomSchema);

    return wRom.toUint8Array();
  }
}
