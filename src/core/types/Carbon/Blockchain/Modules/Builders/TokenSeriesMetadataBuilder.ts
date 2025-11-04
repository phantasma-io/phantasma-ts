import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmStructSchema, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { pushStandardMetadataField } from './StandardMetadataHelper';
import { TokenSchemasBuilder } from './TokenSchemasBuilder';

export class TokenSeriesMetadataBuilder {
  static buildAndSerialize(
    seriesMetadataSchema: VmStructSchema,
    newPhantasmaSeriesId: bigint,
    sharedName?: string,
    sharedDescription?: string,
    sharedImageURL?: string,
    sharedInfoURL?: string,
    sharedRoyalties?: number,
    sharedRom?: Uint8Array
  ): Uint8Array {
    const wMetadata = new CarbonBinaryWriter();

    let seriesMetadata = new VmDynamicStruct();
    seriesMetadata.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, newPhantasmaSeriesId),
      VmNamedDynamicVariable.from('mode', VmType.Int8, sharedRom == null || sharedRom.length == 0 ? 0 : 1),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, sharedRom ? sharedRom : [])
    ];

    pushStandardMetadataField(seriesMetadata, seriesMetadataSchema, 'name', VmType.String, sharedName);
    pushStandardMetadataField(seriesMetadata, seriesMetadataSchema, 'description', VmType.String, sharedDescription);
    pushStandardMetadataField(seriesMetadata, seriesMetadataSchema, 'imageURL', VmType.String, sharedImageURL);
    pushStandardMetadataField(seriesMetadata, seriesMetadataSchema, 'infoURL', VmType.String, sharedInfoURL);
    pushStandardMetadataField(seriesMetadata, seriesMetadataSchema, 'royalties', VmType.Int32, sharedRoyalties);

    seriesMetadata.writeWithSchema(
      seriesMetadataSchema,
      wMetadata
    );

    return wMetadata.toUint8Array();
  }
}
