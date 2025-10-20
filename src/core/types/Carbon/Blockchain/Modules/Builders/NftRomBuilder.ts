import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { TokenSchemas } from '../TokenSchemas';
import { TokenSchemasBuilder } from './TokenSchemasBuilder';

export class NftRomBuilder {
  static buildAndSerialize(
    phantasmaNftId: bigint,
    name: string,
    description: string,
    imageURL: string,
    infoURL: string,
    royalties: number,
    rom: Uint8Array,
    tokenSchemas?: TokenSchemas
  ): Uint8Array {
    tokenSchemas = tokenSchemas || TokenSchemasBuilder.prepareStandardTokenSchemas();

    const wRom = new CarbonBinaryWriter();

    const vmDynamicStruct = new VmDynamicStruct();
    vmDynamicStruct.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, phantasmaNftId),
      VmNamedDynamicVariable.from('name', VmType.String, name),
      VmNamedDynamicVariable.from('description', VmType.String, description),
      VmNamedDynamicVariable.from('imageURL', VmType.String, imageURL),
      VmNamedDynamicVariable.from('infoURL', VmType.String, infoURL),
      VmNamedDynamicVariable.from('royalties', VmType.Int32, royalties),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, rom),
    ];
    vmDynamicStruct.writeWithSchema(tokenSchemas.rom, wRom);

    return wRom.toUint8Array();
  }
}
