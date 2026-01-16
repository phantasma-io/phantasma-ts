import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';
import { Bytes64 } from '../Bytes64.js';
import { TxTypes } from '../TxTypes.js';
import { Witness } from '../Witness.js';
import { TxMsg } from './TxMsg.js';

export class SignedTxMsg implements ICarbonBlob {
  constructor(
    public msg?: TxMsg,
    public witnesses?: Witness[]
  ) {}

  write(w: CarbonBinaryWriter): void {
    this.msg.write(w);
    switch (this.msg.type) {
      case TxTypes.TransferFungible:
      case TxTypes.TransferNonFungible_Single:
      case TxTypes.TransferNonFungible_Multi:
      case TxTypes.MintFungible:
      case TxTypes.BurnFungible:
      case TxTypes.MintNonFungible:
      case TxTypes.BurnNonFungible: {
        if (this.witnesses.length !== 1) throw new Error('Expected 1 witness');
        const w0 = this.witnesses[0];
        // assert witness address equals msg.gasFrom
        if (!w0.address.equals(this.msg.gasFrom)) throw new Error('Witness address mismatch');
        w.write64(w0.signature.bytes);
        break;
      }

      case TxTypes.TransferFungible_GasPayer:
      case TxTypes.TransferNonFungible_Single_GasPayer:
      case TxTypes.TransferNonFungible_Multi_GasPayer:
      case TxTypes.BurnFungible_GasPayer:
      case TxTypes.BurnNonFungible_GasPayer: {
        if (this.witnesses.length !== 2) throw new Error('Expected 2 witnesses');
        const w0 = this.witnesses[0];
        const w1 = this.witnesses[1];
        if (!w0.address.equals(this.msg.gasFrom)) throw new Error('Gas witness address mismatch');
        // selecting "from" depends on concrete message type
        w.write64(w0.signature.bytes);
        w.write64(w1.signature.bytes);
        throw new Error('Unsupported transaction type');
        break;
      }

      case TxTypes.Call:
      case TxTypes.Call_Multi:
      case TxTypes.Trade:
      case TxTypes.Phantasma: {
        w.writeArrayBlob(this.witnesses);
        break;
      }

      case TxTypes.Phantasma_Raw: {
        if (this.witnesses.length !== 0) throw new Error('No witnesses expected');
        break;
      }

      default:
        throw new Error('Unsupported transaction type');
    }
  }

  read(r: CarbonBinaryReader) {
    this.msg = TxMsg.read(r);
    this.witnesses = [];
    switch (this.msg.type) {
      case TxTypes.TransferFungible:
      case TxTypes.TransferNonFungible_Single:
      case TxTypes.TransferNonFungible_Multi:
      case TxTypes.MintFungible:
      case TxTypes.BurnFungible:
      case TxTypes.MintNonFungible:
      case TxTypes.BurnNonFungible: {
        const sig = Bytes64.read(r);
        this.witnesses = [new Witness(this.msg.gasFrom, sig)];
        break;
      }

      case TxTypes.TransferFungible_GasPayer:
      case TxTypes.TransferNonFungible_Single_GasPayer:
      case TxTypes.TransferNonFungible_Multi_GasPayer:
      case TxTypes.BurnFungible_GasPayer:
      case TxTypes.BurnNonFungible_GasPayer: {
        const sig0 = Bytes64.read(r);
        const sig1 = Bytes64.read(r);
        // "from" resolution depends on concrete message type; omitted here
        this.witnesses = [new Witness(this.msg.gasFrom, sig0), new Witness(Bytes32.Empty, sig1)];
        throw new Error('Unsupported transaction type');
        break;
      }

      case TxTypes.Call:
      case TxTypes.Call_Multi:
      case TxTypes.Trade:
      case TxTypes.Phantasma: {
        this.witnesses = r.readArrayBlob(Witness);
        break;
      }

      case TxTypes.Phantasma_Raw:
        this.witnesses = [];
        break;

      default:
        throw new Error('Unsupported transaction type');
    }
  }

  static read(r: CarbonBinaryReader): SignedTxMsg {
    const v = new SignedTxMsg();
    v.read(r);
    return v;
  }
}
