import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';
import { TxMsgCall } from './TxMsgCall';

export class TxMsgCallMulti implements ICarbonBlob {
  constructor(public calls: TxMsgCall[] = []) {}

  write(w: CarbonBinaryWriter): void {
    w.writeArrayBlob(this.calls);
  }

  read(r: CarbonBinaryReader): void {
    this.calls = r.readArrayBlob(TxMsgCall);
  }

  static read(r: CarbonBinaryReader): TxMsgCallMulti {
    const v = new TxMsgCallMulti();
    v.read(r);
    return v;
  }
}
