import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';
import { Bytes32 } from '../Bytes32';
import { IntX } from '../IntX';

export class TxMsgMintFungible implements ICarbonBlob {
  tokenId: bigint; // uint64
  to: Bytes32;
  amount: IntX;

  constructor(init?: Partial<TxMsgMintFungible>) {
    this.tokenId = 0n;
    this.to = new Bytes32();
    this.amount = IntX.fromI64(0);
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    w.write32(this.to);
    this.amount.write(w);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.to = Bytes32.read(r);
    this.amount = IntX.read(r);
  }

  static read(r: CarbonBinaryReader): TxMsgMintFungible {
    const v = new TxMsgMintFungible();
    v.read(r);
    return v;
  }
}
