import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { IntX } from '../IntX.js';

export class TxMsgBurnFungible implements ICarbonBlob {
  tokenId: bigint; // uint64
  amount: IntX;

  constructor(init?: Partial<TxMsgBurnFungible>) {
    this.tokenId = 0n;
    this.amount = IntX.fromI64(0);
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    this.amount.write(w);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.amount = IntX.read(r);
  }

  static read(r: CarbonBinaryReader): TxMsgBurnFungible {
    const v = new TxMsgBurnFungible();
    v.read(r);
    return v;
  }
}
