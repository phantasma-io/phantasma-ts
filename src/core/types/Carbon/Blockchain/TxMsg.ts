import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';
import { SmallString } from '../SmallString.js';
import { TxTypes } from '../TxTypes.js';
import { TxMsgCall } from './TxMsgCall.js';
import { TxMsgCallMulti } from './TxMsgCallMulti.js';
import { TxMsgMintFungible } from './TxMsgMintFungible.js';
import { TxMsgMintNonFungible } from './TxMsgMintNonFungible.js';
import { TxMsgTrade } from './TxMsgTrade.js';
import { TxMsgTransferFungible } from './TxMsgTransferFungible.js';
import { TxMsgTransferFungibleGasPayer } from './TxMsgTransferFungibleGasPayer.js';
import { TxMsgTransferNonFungibleMulti } from './TxMsgTransferNonFungibleMulti.js';
import { TxMsgTransferNonFungibleMultiGasPayer } from './TxMsgTransferNonFungibleMultiGasPayer.js';
import { TxMsgTransferNonFungibleSingle } from './TxMsgTransferNonFungibleSingle.js';
import { TxMsgTransferNonFungibleSingleGasPayer } from './TxMsgTransferNonFungibleSingleGasPayer.js';
import { TxMsgBurnFungible } from './TxMsgBurnFungible.js';
import { TxMsgBurnFungibleGasPayer } from './TxMsgBurnFungibleGasPayer.js';
import { TxMsgBurnNonFungible } from './TxMsgBurnNonFungible.js';
import { TxMsgBurnNonFungibleGasPayer } from './TxMsgBurnNonFungibleGasPayer.js';
import { TxMsgPhantasma } from './TxMsgPhantasma.js';
import { TxMsgPhantasmaRaw } from './TxMsgPhantasmaRaw.js';

type TxMsgPayload =
  | TxMsgCall
  | TxMsgCallMulti
  | TxMsgTrade
  | TxMsgTransferFungible
  | TxMsgTransferFungibleGasPayer
  | TxMsgTransferNonFungibleSingle
  | TxMsgTransferNonFungibleSingleGasPayer
  | TxMsgTransferNonFungibleMulti
  | TxMsgTransferNonFungibleMultiGasPayer
  | TxMsgMintFungible
  | TxMsgBurnFungible
  | TxMsgBurnFungibleGasPayer
  | TxMsgMintNonFungible
  | TxMsgBurnNonFungible
  | TxMsgBurnNonFungibleGasPayer
  | TxMsgPhantasma
  | TxMsgPhantasmaRaw;

export class TxMsg implements ICarbonBlob {
  constructor(
    public type: TxTypes = TxTypes.Call,
    public expiry: bigint = 0n, // int64
    public maxGas: bigint = 0n, // uint64
    public maxData: bigint = 0n, // uint64
    public gasFrom: Bytes32 = new Bytes32(),
    public payload: SmallString = new SmallString(''),
    public msg?: TxMsgPayload
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
      case TxTypes.Call_Multi:
        (this.msg as TxMsgCallMulti).write(w);
        break;
      case TxTypes.Trade:
        (this.msg as TxMsgTrade).write(w);
        break;
      case TxTypes.TransferFungible:
        (this.msg as TxMsgTransferFungible).write(w);
        break;
      case TxTypes.TransferFungible_GasPayer:
        (this.msg as TxMsgTransferFungibleGasPayer).write(w);
        break;
      case TxTypes.TransferNonFungible_Single:
        (this.msg as TxMsgTransferNonFungibleSingle).write(w);
        break;
      case TxTypes.TransferNonFungible_Single_GasPayer:
        (this.msg as TxMsgTransferNonFungibleSingleGasPayer).write(w);
        break;
      case TxTypes.TransferNonFungible_Multi:
        (this.msg as TxMsgTransferNonFungibleMulti).write(w);
        break;
      case TxTypes.TransferNonFungible_Multi_GasPayer:
        (this.msg as TxMsgTransferNonFungibleMultiGasPayer).write(w);
        break;
      case TxTypes.MintFungible:
        (this.msg as TxMsgMintFungible).write(w);
        break;
      case TxTypes.BurnFungible:
        (this.msg as TxMsgBurnFungible).write(w);
        break;
      case TxTypes.BurnFungible_GasPayer:
        (this.msg as TxMsgBurnFungibleGasPayer).write(w);
        break;
      case TxTypes.MintNonFungible:
        (this.msg as TxMsgMintNonFungible).write(w);
        break;
      case TxTypes.BurnNonFungible:
        (this.msg as TxMsgBurnNonFungible).write(w);
        break;
      case TxTypes.BurnNonFungible_GasPayer:
        (this.msg as TxMsgBurnNonFungibleGasPayer).write(w);
        break;
      case TxTypes.Phantasma:
        (this.msg as TxMsgPhantasma).write(w);
        break;
      case TxTypes.Phantasma_Raw:
        (this.msg as TxMsgPhantasmaRaw).write(w);
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
      case TxTypes.Call_Multi:
        this.msg = TxMsgCallMulti.read(r);
        break;
      case TxTypes.Trade:
        this.msg = TxMsgTrade.read(r);
        break;
      case TxTypes.TransferFungible:
        this.msg = TxMsgTransferFungible.read(r);
        break;
      case TxTypes.TransferFungible_GasPayer:
        this.msg = TxMsgTransferFungibleGasPayer.read(r);
        break;
      case TxTypes.TransferNonFungible_Single:
        this.msg = TxMsgTransferNonFungibleSingle.read(r);
        break;
      case TxTypes.TransferNonFungible_Single_GasPayer:
        this.msg = TxMsgTransferNonFungibleSingleGasPayer.read(r);
        break;
      case TxTypes.TransferNonFungible_Multi:
        this.msg = TxMsgTransferNonFungibleMulti.read(r);
        break;
      case TxTypes.TransferNonFungible_Multi_GasPayer:
        this.msg = TxMsgTransferNonFungibleMultiGasPayer.read(r);
        break;
      case TxTypes.MintFungible:
        this.msg = TxMsgMintFungible.read(r);
        break;
      case TxTypes.BurnFungible:
        this.msg = TxMsgBurnFungible.read(r);
        break;
      case TxTypes.BurnFungible_GasPayer:
        this.msg = TxMsgBurnFungibleGasPayer.read(r);
        break;
      case TxTypes.MintNonFungible:
        this.msg = TxMsgMintNonFungible.read(r);
        break;
      case TxTypes.BurnNonFungible:
        this.msg = TxMsgBurnNonFungible.read(r);
        break;
      case TxTypes.BurnNonFungible_GasPayer:
        this.msg = TxMsgBurnNonFungibleGasPayer.read(r);
        break;
      case TxTypes.Phantasma:
        this.msg = TxMsgPhantasma.read(r);
        break;
      case TxTypes.Phantasma_Raw:
        this.msg = TxMsgPhantasmaRaw.read(r);
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
