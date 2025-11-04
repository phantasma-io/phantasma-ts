import { Bytes32 } from '../../../Bytes32';
import { VmStructSchema } from '../../Vm';
import { SeriesInfo } from '../SeriesInfo';
import { TokenSeriesMetadataBuilder } from './TokenSeriesMetadataBuilder';

export class SeriesInfoBuilder {
  static build(
    seriesSchema: VmStructSchema,
    phantasmaSeriesId: bigint,
    maxMint: number,
    maxSupply: number,
    ownerPublicKey: Bytes32,
    sharedName?: string,
    sharedDescription?: string,
    sharedImageURL?: string,
    sharedInfoURL?: string,
    sharedRoyalties?: number,
    sharedRom?: Uint8Array
  ): SeriesInfo {
    const metadata = TokenSeriesMetadataBuilder.buildAndSerialize(
      seriesSchema,
      phantasmaSeriesId,
      sharedName,
      sharedDescription,
      sharedImageURL,
      sharedInfoURL,
      sharedRoyalties,
      sharedRom
    );

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
