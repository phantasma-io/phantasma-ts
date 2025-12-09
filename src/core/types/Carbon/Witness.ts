import { ICarbonBlob } from '../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../CarbonSerialization';
import { Bytes32 } from './Bytes32';
import { Bytes64 } from './Bytes64';

export class Witness implements ICarbonBlob {
  constructor(
    public address?: Bytes32,
    public signature?: Bytes64
  ) {}
  write(w: CarbonBinaryWriter): void {
    this.address.write(w);
    this.signature.write(w);
  }
  read(r: CarbonBinaryReader): void {
    this.address = Bytes32.read(r);
    this.signature = Bytes64.read(r);
  }
  static read(r: CarbonBinaryReader): Witness {
    const v = new Witness();
    v.read(r);
    return v;
  }
}
