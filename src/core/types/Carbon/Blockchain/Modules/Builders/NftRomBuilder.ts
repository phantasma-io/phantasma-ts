import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmStructSchema, VmType } from '../../Vm';
import { StandardMeta } from '../StandardMeta';
import { pushStandardMetadataField } from './StandardMetadataHelper';
import { TokenSchemasBuilder } from './TokenSchemasBuilder';

export class NftRomBuilder {
  static buildAndSerialize(
    nftRomSchema: VmStructSchema,
    phantasmaNftId: bigint,
    name?: string,
    description?: string,
    imageURL?: string,
    infoURL?: string,
    royalties?: number,
    rom?: Uint8Array
  ): Uint8Array {
    const wRom = new CarbonBinaryWriter();

    const nftRom = new VmDynamicStruct();
    nftRom.fields = [
      VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, phantasmaNftId),
      VmNamedDynamicVariable.from('rom', VmType.Bytes, rom ? rom : [])
    ];

    pushStandardMetadataField(nftRom, nftRomSchema, 'name', VmType.String, name);
    pushStandardMetadataField(nftRom, nftRomSchema, 'description', VmType.String, description);
    pushStandardMetadataField(nftRom, nftRomSchema, 'imageURL', VmType.String, imageURL);
    pushStandardMetadataField(nftRom, nftRomSchema, 'infoURL', VmType.String, infoURL);
    pushStandardMetadataField(nftRom, nftRomSchema, 'royalties', VmType.Int32, royalties);

    nftRom.writeWithSchema(
      nftRomSchema,
      wRom
    );

    // console.log("nftRom.fields.length: ", nftRom.fields.length);
    // TokenSchemasBuilder.logSchema(nftRomSchema);

    return wRom.toUint8Array();
  }
}
