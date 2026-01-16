import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';
import { IntX } from '../IntX.js';

export class TxMsgBurnFungibleGasPayer implements ICarbonBlob {
  tokenId: bigint; // uint64
  from: Bytes32;
  amount: IntX;

  constructor(init?: Partial<TxMsgBurnFungibleGasPayer>) {
    this.tokenId = 0n;
    this.from = new Bytes32();
    this.amount = IntX.fromI64(0);
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    w.write32(this.from);
    this.amount.write(w);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.from = Bytes32.read(r);
    this.amount = IntX.read(r);
  }

  static read(r: CarbonBinaryReader): TxMsgBurnFungibleGasPayer {
    const v = new TxMsgBurnFungibleGasPayer();
    v.read(r);
    return v;
  }
}
