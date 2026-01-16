import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { VmStructSchema } from '../Vm/VmStructSchema.js';

export class TokenSchemas implements ICarbonBlob {
  seriesMetadata: VmStructSchema;
  rom: VmStructSchema;
  ram: VmStructSchema;

  constructor(init?: Partial<TokenSchemas>) {
    this.seriesMetadata = new VmStructSchema();
    this.rom = new VmStructSchema();
    this.ram = new VmStructSchema();
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    this.seriesMetadata.write(w);
    this.rom.write(w);
    this.ram.write(w);
  }

  read(r: CarbonBinaryReader): void {
    this.seriesMetadata = r.readBlob(VmStructSchema);
    this.rom = r.readBlob(VmStructSchema);
    this.ram = r.readBlob(VmStructSchema);
  }

  static read(r: CarbonBinaryReader): TokenSchemas {
    const v = new TokenSchemas();
    v.read(r);
    return v;
  }
}
