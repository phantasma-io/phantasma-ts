import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';

export class TxMsgBurnNonFungible implements ICarbonBlob {
  tokenId: bigint; // uint64
  instanceId: bigint; // uint64

  constructor(init?: Partial<TxMsgBurnNonFungible>) {
    this.tokenId = 0n;
    this.instanceId = 0n;
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    w.write8u(this.instanceId);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.instanceId = r.read8u();
  }

  static read(r: CarbonBinaryReader): TxMsgBurnNonFungible {
    const v = new TxMsgBurnNonFungible();
    v.read(r);
    return v;
  }
}
