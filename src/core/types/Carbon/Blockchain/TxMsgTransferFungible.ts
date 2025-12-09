import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';
import { Bytes32 } from '../Bytes32';

export class TxMsgTransferFungible implements ICarbonBlob {
  constructor(
    public to?: Bytes32,
    public tokenId?: bigint,
    public amount?: bigint
  ) {}
  write(w: CarbonBinaryWriter): void {
    this.to.write(w);
    w.write8u(this.tokenId);
    w.write8u(this.amount);
  }
  read(r: CarbonBinaryReader): void {
    this.to = Bytes32.read(r);
    this.tokenId = r.read8u();
    this.amount = r.read8u();
  }

  static read(r: CarbonBinaryReader): TxMsgTransferFungible {
    const v = new TxMsgTransferFungible();
    v.read(r);
    return v;
  }
}
