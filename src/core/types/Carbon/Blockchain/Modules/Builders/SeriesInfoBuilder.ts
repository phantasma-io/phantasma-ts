import { Bytes32 } from '../../../Bytes32';
import { VmStructSchema } from '../../Vm';
import { SeriesInfo } from '../SeriesInfo';
import { TokenSeriesMetadataBuilder } from './TokenSeriesMetadataBuilder';

export class SeriesInfoBuilder {
  static build(
    phantasmaSeriesId: bigint,
    maxMint: number,
    maxSupply: number,
    ownerPublicKey: Bytes32,
    sharedRom: Uint8Array,
    metadata?: Uint8Array
  ): SeriesInfo {
    metadata =
      metadata || TokenSeriesMetadataBuilder.buildAndSerialize(phantasmaSeriesId, sharedRom, null);

    return new SeriesInfo({
      maxMint: maxMint, // limit on minting, or 0=no limit
      maxSupply: maxSupply, // limit on how many can exist at once
      owner: ownerPublicKey,
      metadata: metadata, // VmDynamicStruct encoded with TokenInfo.tokenSchemas.seriesMetadata
      rom: new VmStructSchema(),
      ram: new VmStructSchema(),
    });
  }
}
