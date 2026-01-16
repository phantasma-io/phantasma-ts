import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';

export class TxMsgTransferFungibleGasPayer implements ICarbonBlob {
  to: Bytes32;
  from: Bytes32;
  tokenId: bigint; // uint64
  amount: bigint; // uint64

  constructor(init?: Partial<TxMsgTransferFungibleGasPayer>) {
    this.to = new Bytes32();
    this.from = new Bytes32();
    this.tokenId = 0n;
    this.amount = 0n;
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write32(this.to);
    w.write32(this.from);
    w.write8u(this.tokenId);
    w.write8u(this.amount);
  }

  read(r: CarbonBinaryReader): void {
    this.to = Bytes32.read(r);
    this.from = Bytes32.read(r);
    this.tokenId = r.read8u();
    this.amount = r.read8u();
  }

  static read(r: CarbonBinaryReader): TxMsgTransferFungibleGasPayer {
    const v = new TxMsgTransferFungibleGasPayer();
    v.read(r);
    return v;
  }
}
