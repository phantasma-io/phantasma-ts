import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob';
import {
  CarbonBinaryReader,
  CarbonBinaryWriter,
  twosComplementLEToBigInt,
} from '../CarbonSerialization';

export class IntX implements ICarbonBlob {
  private big: bigint = 0n;
  private small: bigint = 0n;
  private isBig = false;

  // Constructors
  static fromBigInt(v: bigint): IntX {
    const x = new IntX();
    x.big = v;
    x.isBig = true;
    return x;
  }

  static fromI64(v: number | bigint): IntX {
    const x = new IntX();
    x.small = typeof v === 'number' ? BigInt(v) : v;
    x.isBig = false;
    return x;
  }

  toBigInt(): bigint {
    return this.isBig ? this.big : this.small;
  }

  toString(): string {
    return this.toBigInt().toString();
  }

  // Serialization (must match C# IntX.Write)
  write(w: CarbonBinaryWriter): void {
    if (this.isBig) {
      const v = this.big;
      const minI64 = -(1n << 63n);
      const maxI64 = (1n << 63n) - 1n;
      if (v >= minI64 && v <= maxI64) {
        const header = (v < 0n ? 0x88 : 0x08) & 0xff;
        w.write1(header);
        w.write8(v);
        return;
      }
      // Compact BigInt format (writer emits header + payload)
      w.writeBigInt(v);
      return;
    }

    // Small path always uses 8-byte encoding with header 0x08/0x88
    const v = this.small;
    const header = (v < 0n ? 0x88 : 0x08) & 0xff;
    w.write1(header);
    w.write8(v);
  }

  // Deserialization (must match C# IntX.Read)
  read(r: CarbonBinaryReader): void {
    const header = r.read1();
    if (header === 0) {
      // Zero in compact format
      this.isBig = false;
      this.small = 0n;
      return;
    }

    const len = header & 0x3f;
    const signBit = (header & 0x80) !== 0;

    if (len === 8) {
      // Fast int64 path
      this.isBig = false;
      this.small = r.read8();
      const valueIsNegative = this.small < 0;
      if (valueIsNegative !== signBit) {
        throw new Error('invalid intx sign header');
      }
      return;
    }

    // Compact BigInt path - we already consumed header, so read payload manually
    // and convert LE two’s complement to bigint
    if (len > 32) {
      throw new Error('BigInt too big');
    }
    let bytes = r.readExactly(len);

    // Ensure sign extension byte matches header sign
    const inherentNegative = (bytes[bytes.length - 1] & 0x80) !== 0;
    if (inherentNegative !== signBit) {
      const ext = signBit ? 0xff : 0x00;
      const tmp = new Uint8Array(bytes.length + 1);
      tmp.set(bytes, 0);
      tmp[tmp.length - 1] = ext;
      bytes = tmp;
    }

    this.isBig = true;
    this.big = twosComplementLEToBigInt(bytes);
  }

  static read(r: CarbonBinaryReader): IntX {
    const v = new IntX();
    v.read(r);
    return v;
  }
}
