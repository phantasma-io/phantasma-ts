import { Bytes32 } from '../../../Bytes32';
import { VmStructSchema } from '../../Vm';
import { SeriesInfo } from '../SeriesInfo';
import { MetadataField } from './MetadataHelper';
import { TokenSeriesMetadataBuilder } from './TokenSeriesMetadataBuilder';

export class SeriesInfoBuilder {
  static build(
    seriesSchema: VmStructSchema,
    phantasmaSeriesId: bigint,
    maxMint: number,
    maxSupply: number,
    ownerPublicKey: Bytes32,
    metadata: MetadataField[]
  ): SeriesInfo {
    const serializedMetadata = TokenSeriesMetadataBuilder.buildAndSerialize(
      seriesSchema,
      phantasmaSeriesId,
      metadata
    );

    return new SeriesInfo({
      maxMint: maxMint, // limit on minting, or 0=no limit
      maxSupply: maxSupply, // limit on how many can exist at once
      owner: ownerPublicKey,
      metadata: serializedMetadata, // VmDynamicStruct encoded with TokenInfo.tokenSchemas.seriesMetadata
      rom: new VmStructSchema(),
      ram: new VmStructSchema(),
    });
  }
}
