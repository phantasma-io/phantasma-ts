import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { TxMsgCall } from './TxMsgCall.js';

export class TxMsgSpecialResolution implements ICarbonBlob {
  constructor(
    public resolutionId: bigint = 0n,
    public calls: TxMsgCall[] = []
  ) {}

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.resolutionId);
    w.writeArrayBlob(this.calls);
  }

  read(r: CarbonBinaryReader): void {
    this.resolutionId = r.read8u();
    this.calls = r.readArrayBlob(TxMsgCall);
  }

  static read(r: CarbonBinaryReader): TxMsgSpecialResolution {
    const v = new TxMsgSpecialResolution();
    v.read(r);
    return v;
  }
}
