import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { VmType } from './VmType.js';
import { VmStructSchema } from './VmStructSchema.js';

export class VmVariableSchema implements ICarbonBlob {
  type!: VmType;
  structure!: VmStructSchema;

  constructor(type?: VmType, structure?: VmStructSchema) {
    if (type) this.type = type;
    if (structure) this.structure = structure;
  }

  write(w: CarbonBinaryWriter): void {
    w.write1(this.type & 0xff);
    if (this.type === VmType.Struct || this.type === (VmType.Struct | VmType.Array)) {
      this.structure.write(w);
    }
  }
  read(r: CarbonBinaryReader): void {
    this.type = r.read1() as VmType;
    if (this.type === VmType.Struct || this.type === (VmType.Struct | VmType.Array)) {
      this.structure = r.readBlob(VmStructSchema);
    }
  }

  static read(r: CarbonBinaryReader): VmVariableSchema {
    const v = new VmVariableSchema();
    v.read(r);
    return v;
  }
}
