import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../CarbonSerialization.js';

type Ctor<T> = new () => T;

export class CarbonBlob {
  // New<T>(BinaryReader r)
  static New<T extends ICarbonBlob>(ctor: Ctor<T>, r: CarbonBinaryReader): T {
    const t = new ctor();
    t.read(r);
    return t;
  }

  // New<T>(bytes, offset)
  static NewFromBytes<T extends ICarbonBlob>(ctor: Ctor<T>, bytes: Uint8Array, offset: number): T {
    return CarbonBlob.NewFromBytesEx(ctor, bytes, false, offset);
  }

  // New<T>(bytes, allowTrailingBytes = false, offset = 0)
  static NewFromBytesEx<T extends ICarbonBlob>(
    ctor: Ctor<T>,
    bytes: Uint8Array,
    allowTrailingBytes: boolean = false,
    offset: number = 0
  ): T {
    const view = offset > 0 ? bytes.subarray(offset) : bytes;
    const r = new CarbonBinaryReader(view);
    const t = CarbonBlob.New(ctor, r);

    if (!allowTrailingBytes) {
      const rem = (r as any).readRemaining?.() as Uint8Array | undefined;
      if (rem && rem.length !== 0) {
        throw new Error('unexpected trailing bytes');
      }
    }
    return t;
  }

  // Serialize<T>(carbonBlob)
  static Serialize<T extends ICarbonBlob>(carbonBlob: T): Uint8Array {
    const w = new CarbonBinaryWriter();
    carbonBlob.write(w);
    return w.toUint8Array();
  }
}
