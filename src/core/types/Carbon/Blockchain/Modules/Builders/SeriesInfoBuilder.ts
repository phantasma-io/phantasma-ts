import { Bytes32 } from '../../../Bytes32.js';
import { VmStructSchema } from '../../Vm/index.js';
import { SeriesInfo } from '../SeriesInfo.js';
import { MetadataField } from './MetadataHelper.js';
import { TokenSeriesMetadataBuilder } from './TokenSeriesMetadataBuilder.js';

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
