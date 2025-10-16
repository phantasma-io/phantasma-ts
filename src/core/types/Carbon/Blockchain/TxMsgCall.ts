import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';

export class TxMsgCall implements ICarbonBlob {
  moduleId: number; // uint32
  methodId: number; // uint32
  args: Uint8Array;

  constructor(moduleId: number = 0, methodId: number = 0, args: Uint8Array = new Uint8Array()) {
    this.moduleId = moduleId >>> 0;
    this.methodId = methodId >>> 0;
    this.args = args;
  }

  write(w: CarbonBinaryWriter): void {
    w.write4u(this.moduleId);
    w.write4u(this.methodId);
    w.writeArray(this.args);
  }

  read(r: CarbonBinaryReader): void {
    this.moduleId = r.read4u();
    this.methodId = r.read4u();
    this.args = r.readArray();
  }

  static read(r: CarbonBinaryReader): TxMsgCall {
    const v = new TxMsgCall();
    v.read(r);
    return v;
  }
}
