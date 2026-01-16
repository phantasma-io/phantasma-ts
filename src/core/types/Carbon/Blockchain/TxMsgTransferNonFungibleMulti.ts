import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';

export class TxMsgTransferNonFungibleMulti implements ICarbonBlob {
  to: Bytes32;
  tokenId: bigint; // uint64
  instanceIds: bigint[]; // uint64[]

  constructor(init?: Partial<TxMsgTransferNonFungibleMulti>) {
    this.to = new Bytes32();
    this.tokenId = 0n;
    this.instanceIds = [];
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write32(this.to);
    w.write8u(this.tokenId);
    w.writeArray64u(this.instanceIds);
  }

  read(r: CarbonBinaryReader): void {
    this.to = Bytes32.read(r);
    this.tokenId = r.read8u();
    this.instanceIds = r.readArray64u();
  }

  static read(r: CarbonBinaryReader): TxMsgTransferNonFungibleMulti {
    const v = new TxMsgTransferNonFungibleMulti();
    v.read(r);
    return v;
  }
}
