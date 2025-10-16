import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';
import { Bytes32 } from '../Bytes32';
import { SmallString } from '../SmallString';
import { TxTypes } from '../TxTypes';
import { TxMsgCall } from './TxMsgCall';
import { TxMsgMintNonFungible } from './TxMsgMintNonFungible';
import { TxMsgTransferFungible } from './TxMsgTransferFungible';

export class TxMsg implements ICarbonBlob {
  constructor(
    public type?: TxTypes,
    public expiry?: bigint, // int64
    public maxGas?: bigint, // uint64
    public maxData?: bigint, // uint64
    public gasFrom?: Bytes32,
    public payload?: SmallString,
    public msg?: TxMsgTransferFungible | TxMsgMintNonFungible
    // TODO: Add other message types here
  ) {}

  write(w: CarbonBinaryWriter): void {
    w.write1(this.type);
    w.write8(this.expiry);
    w.write8u(this.maxGas);
    w.write8u(this.maxData);
    this.gasFrom.write(w);
    this.payload.write(w);
    switch (this.type) {
      case TxTypes.Call:
        (this.msg as TxMsgCall).write(w);
        break;
      case TxTypes.TransferFungible:
        (this.msg as TxMsgTransferFungible).write(w);
        break;
      case TxTypes.MintNonFungible:
        (this.msg as TxMsgMintNonFungible).write(w);
        break;
      default:
        throw new Error('Unsupported transaction type');
    }
  }

  read(r: CarbonBinaryReader): void {
    this.type = r.read1() as TxTypes;
    this.expiry = r.read8();
    this.maxGas = r.read8u();
    this.maxData = r.read8u();
    this.gasFrom = Bytes32.read(r);
    this.payload = SmallString.read(r);
    switch (this.type) {
      case TxTypes.Call:
        this.msg = TxMsgCall.read(r);
        break;
      case TxTypes.TransferFungible:
        this.msg = TxMsgTransferFungible.read(r);
        break;
      case TxTypes.MintNonFungible:
        this.msg = TxMsgMintNonFungible.read(r);
        break;
      default:
        throw new Error('Unsupported transaction type');
    }
  }

  static read(r: CarbonBinaryReader): TxMsg {
    const v = new TxMsg();
    v.read(r);
    return v;
  }
}
