import { CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { Bytes32 } from '../../Bytes32.js';

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

  private static readUint64LE(bytes: Uint8Array, offset: number): bigint {
    let result = 0n;
    for (let i = 0; i < 8; i++) {
      result |= BigInt(bytes[offset + i]) << (BigInt(i) * 8n);
    }
    return result;
  }

  /**
   * Unpacks a Carbon NFT address (32 bytes) into its logical parts:
   * - carbonTokenId: identifies the NFT token contract
   * - instanceId: 64-bit composite id (series + mint)
   * - seriesId / mintNumber: 32-bit halves of instanceId
   */
  static unpackNftAddress(address: Uint8Array): TokenHelper.CarbonNftAddressInfo {
    const carbonTokenId = this.readUint64LE(address, 16);
    const instanceId = this.readUint64LE(address, 24);

    const seriesId = Number(instanceId & 0xffffffffn);
    const mintNumber = Number((instanceId >> 32n) & 0xffffffffn);

    return {
      carbonTokenId,
      instanceId,
      seriesId,
      mintNumber,
    };
  }
}

export namespace TokenHelper {
  export type CarbonNftAddressInfo = {
    carbonTokenId: bigint;
    instanceId: bigint;
    seriesId: number;
    mintNumber: number;
  };
}

