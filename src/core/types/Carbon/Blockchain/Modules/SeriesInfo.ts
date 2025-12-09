import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { Bytes32 } from '../../Bytes32';
import { VmStructSchema } from '../Vm/VmStructSchema';

export class SeriesInfo implements ICarbonBlob {
  maxMint: number; // uint32
  maxSupply: number; // uint32
  owner: Bytes32;
  metadata: Uint8Array;
  rom: VmStructSchema;
  ram: VmStructSchema;

  constructor(init?: Partial<SeriesInfo>) {
    this.maxMint = 0;
    this.maxSupply = 0;
    this.owner = new Bytes32();
    this.metadata = new Uint8Array();
    this.rom = new VmStructSchema();
    this.ram = new VmStructSchema();
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write4u(this.maxMint);
    w.write4u(this.maxSupply);
    this.owner.write(w);
    w.writeArray(this.metadata);
    this.rom.write(w);
    this.ram.write(w);
  }

  read(r: CarbonBinaryReader): void {
    this.maxMint = r.read4u();
    this.maxSupply = r.read4u();
    this.owner = Bytes32.read(r);
    this.metadata = r.readArray();
    this.rom = r.readBlob(VmStructSchema);
    this.ram = r.readBlob(VmStructSchema);
  }

  static read(r: CarbonBinaryReader): SeriesInfo {
    const v = new SeriesInfo();
    v.read(r);
    return v;
  }
}
