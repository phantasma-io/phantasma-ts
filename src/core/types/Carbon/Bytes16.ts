import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../CarbonSerialization';

export class Bytes16 implements ICarbonBlob {
  static readonly Empty = new Bytes16(new Uint8Array(16));
  constructor(public bytes: Uint8Array = new Uint8Array(16)) {
    if (bytes.length !== 16) throw new Error('Bytes16 length must be 16');
    this.bytes = new Uint8Array(bytes);
  }
  write(w: CarbonBinaryWriter): void {
    w.write16(this.bytes);
  }
  read(r: CarbonBinaryReader): void {
    this.bytes = r.read16();
  }
  static read(r: CarbonBinaryReader): Bytes16 {
    const v = new Bytes16();
    v.read(r);
    return v;
  }
  equals(other: Bytes16): boolean {
    const a = this.bytes,
      b = other.bytes;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
}
