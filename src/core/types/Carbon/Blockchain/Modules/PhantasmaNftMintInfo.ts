import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { IntX } from '../../IntX.js';

export class PhantasmaNftMintInfo implements ICarbonBlob {
  phantasmaSeriesId: IntX;
  rom: Uint8Array;
  ram: Uint8Array;

  constructor(init?: Partial<PhantasmaNftMintInfo>) {
    this.phantasmaSeriesId = new IntX();
    this.rom = new Uint8Array();
    this.ram = new Uint8Array();
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    this.phantasmaSeriesId.write(w);
    w.writeArray(this.rom);
    w.writeArray(this.ram);
  }

  read(r: CarbonBinaryReader): void {
    this.phantasmaSeriesId = IntX.read(r);
    this.rom = r.readArray();
    this.ram = r.readArray();
  }

  static read(r: CarbonBinaryReader): PhantasmaNftMintInfo {
    const v = new PhantasmaNftMintInfo();
    v.read(r);
    return v;
  }
}
