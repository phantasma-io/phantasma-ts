import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { VmNamedVariableSchema } from './VmNamedVariableSchema.js';

export class VmStructSchema implements ICarbonBlob {
  static Flags = {
    None: 0,
    DynamicExtras: 1 << 0,
    IsSorted: 1 << 1,
  } as const;

  fields: VmNamedVariableSchema[] = [];
  flags: number = VmStructSchema.Flags.None;

  constructor(fields?: VmNamedVariableSchema[], flags?: number) {
    if (fields) {
      this.fields = fields;
    }
    if (flags) {
      this.flags = flags;
    }
  }

  write(w: CarbonBinaryWriter): void {
    w.writeArrayBlob(this.fields);
    w.write1(this.flags & 0xff);
  }
  read(r: CarbonBinaryReader): void {
    this.fields = r.readArrayBlob(VmNamedVariableSchema);
    this.flags = r.read1();
  }

  static read(r: CarbonBinaryReader): VmStructSchema {
    const v = new VmStructSchema();
    v.read(r);
    return v;
  }
}
