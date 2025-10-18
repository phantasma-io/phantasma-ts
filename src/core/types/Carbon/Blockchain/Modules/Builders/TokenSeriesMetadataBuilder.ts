import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { TokenSchemas } from '../TokenSchemas';
import { TokenSchemasBuilder } from './TokenSchemasBuilder';

export class TokenSeriesMetadataBuilder {
  static BuildAndSerialize(
    newPhantasmaSeriesId: bigint,
    sharedRom: Uint8Array,
    tokenSchemas?: TokenSchemas
  ): Uint8Array {
    tokenSchemas = tokenSchemas || TokenSchemasBuilder.PrepareStandardTokenSchemas();

    const wMetadata = new CarbonBinaryWriter();

    let vmDynamicStruct = new VmDynamicStruct();
    vmDynamicStruct.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, newPhantasmaSeriesId),
      VmNamedDynamicVariable.from('mode', VmType.Int8, sharedRom.length == 0 ? 0 : 1),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, sharedRom),
    ];
    vmDynamicStruct.writeWithSchema(tokenSchemas.seriesMetadata, wMetadata);

    return wMetadata.toUint8Array();
  }
}
