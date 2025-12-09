import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../CarbonSerialization';

export class SmallString implements ICarbonBlob {
  constructor(public data: string = '') {
    const len = new TextEncoder().encode(data).length;
    if (len > 255) throw new Error('SmallString too long');
  }
  write(w: CarbonBinaryWriter): void {
    const bytes = new TextEncoder().encode(this.data);
    if (bytes.length > 255) throw new Error('SmallString too long');
    w.write1(bytes.length);
    for (let i = 0; i < bytes.length; i++) w.write1(bytes[i]);
  }
  read(r: CarbonBinaryReader) {
    const len = r.read1();
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) out[i] = r.read1();
    this.data = new TextDecoder().decode(out);
  }
  static read(r: CarbonBinaryReader): SmallString {
    const v = new SmallString();
    v.read(r);
    return v;
  }
  static readonly empty = new SmallString('');

  compareTo(other: SmallString): number {
    if (this.data === other.data) return 0;
    return this.data < other.data ? -1 : 1;
  }
}
