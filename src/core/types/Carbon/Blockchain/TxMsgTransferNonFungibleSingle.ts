import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';

export class TxMsgTransferNonFungibleSingle implements ICarbonBlob {
  to: Bytes32;
  tokenId: bigint; // uint64
  instanceId: bigint; // uint64

  constructor(init?: Partial<TxMsgTransferNonFungibleSingle>) {
    this.to = new Bytes32();
    this.tokenId = 0n;
    this.instanceId = 0n;
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write32(this.to);
    w.write8u(this.tokenId);
    w.write8u(this.instanceId);
  }

  read(r: CarbonBinaryReader): void {
    this.to = Bytes32.read(r);
    this.tokenId = r.read8u();
    this.instanceId = r.read8u();
  }

  static read(r: CarbonBinaryReader): TxMsgTransferNonFungibleSingle {
    const v = new TxMsgTransferNonFungibleSingle();
    v.read(r);
    return v;
  }
}
