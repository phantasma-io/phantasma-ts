import { CarbonBinaryWriter } from '../../../CarbonSerialization';
import { Bytes32 } from '../../Bytes32';

export class TokenHelper {
  static getNftAddress(carbonTokenId: bigint, instanceId: bigint): Bytes32 {
    const w = new CarbonBinaryWriter();
    w.write(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]) // Carbon NFT ID prefix
    );

    w.write8u(carbonTokenId);
    w.write8u(instanceId);

    return new Bytes32(w.toUint8Array());
  }
}
