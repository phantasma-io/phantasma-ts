import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob.js';
import {
  CarbonBinaryReader,
  CarbonBinaryWriter,
  twosComplementLEToBigInt,
} from '../CarbonSerialization.js';

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

  // Returns true when the current value fits into a signed 64-bit integer without overflow.
  is8ByteSafe(): boolean {
    const value = this.toBigInt();
    const minI64 = -(1n << 63n);
    const maxI64 = (1n << 63n) - 1n;
    return value >= minI64 && value <= maxI64;
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
    const len = header & 0x3f;
    if (len < 8) {
      throw new Error('invalid intx packing');
    }

    if (len === 8) {
      // IntX keeps the 8-byte fast path, but the header sign bit still refers to the reconstructed
      // 256-bit value. If those signs disagree, this payload is not an int64; it is a wider IntX
      // whose compact validator encoding happens to fit in 8 serialized bytes.
      const value = r.read8();
      const headerIsNegative = (header & 0x80) !== 0;
      const valueIsNegative = value < 0n;

      if (headerIsNegative === valueIsNegative) {
        this.isBig = false;
        this.small = value;
        return;
      }

      // Rebuild the full 256-bit word using the header sign bit as the omitted fill byte.
      const rawBytes = new Uint8Array(8);
      new DataView(rawBytes.buffer).setBigInt64(0, value, true);
      const fill = headerIsNegative ? 0xff : 0x00;
      const word = new Uint8Array(32);
      word.set(rawBytes, 0);
      word.fill(fill, rawBytes.length);

      this.isBig = true;
      this.big = twosComplementLEToBigInt(word);
      return;
    }

    // Wider IntX values reuse the exact validator BigInt reader contract with the already-consumed header.
    this.isBig = true;
    this.big = r.readBigInt(header);
  }

  static read(r: CarbonBinaryReader): IntX {
    const v = new IntX();
    v.read(r);
    return v;
  }
}
