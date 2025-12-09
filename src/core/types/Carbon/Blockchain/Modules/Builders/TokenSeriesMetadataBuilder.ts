import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmStructSchema, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { findMetadataField, MetadataField, pushMetadataField, seriesDefaultMetadataFields } from './MetadataHelper';

export class TokenSeriesMetadataBuilder {
  static buildAndSerialize(
    seriesMetadataSchema: VmStructSchema,
    newPhantasmaSeriesId: bigint,
    metadata: MetadataField[]
  ): Uint8Array {
    const wMetadata = new CarbonBinaryWriter();

    const sharedRomField = findMetadataField(metadata, 'rom');
    let rom: Uint8Array | string;
    if(sharedRomField) {
      if(!(sharedRomField.value instanceof Uint8Array || typeof sharedRomField.value === "string")) {
        throw Error("'rom' must be a byte array or hex string");
      }
      rom = sharedRomField.value;
    }

    let seriesMetadata = new VmDynamicStruct();
    seriesMetadata.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, newPhantasmaSeriesId),
      VmNamedDynamicVariable.from('mode', VmType.Int8, rom == null || rom.length == 0 ? 0 : 1),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, rom ? rom : [])
    ];

    seriesMetadataSchema.fields.forEach(s => {
      // We don't verify default fields here, they are treated differently
      // in the code above.
      if(!seriesDefaultMetadataFields.some(df => df.name === s.name.data)) {
        pushMetadataField(s, seriesMetadata, metadata);
      }
    });

    seriesMetadata.writeWithSchema(
      seriesMetadataSchema,
      wMetadata
    );

    return wMetadata.toUint8Array();
  }
}
