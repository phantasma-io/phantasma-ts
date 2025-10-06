import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization';
import { Bytes32 } from '../Bytes32';
import { Bytes64 } from '../Bytes64';
import { TxTypes } from '../TxTypes';
import { Witness } from '../Witness';
import { TxMsg } from './TxMsg';

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
        w.writeArrayOfArrays(
          this.witnesses.map((x) => {
            const buf = new CarbonBinaryWriter();
            x.write(buf);
            return buf.toUint8Array();
          })
        );
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

  read(r: CarbonBinaryReader): SignedTxMsg {
    const msg = TxMsg.read(r);
    let witnesses: Witness[] = [];
    switch (msg.type) {
      case TxTypes.TransferFungible:
      case TxTypes.TransferNonFungible_Single:
      case TxTypes.TransferNonFungible_Multi:
      case TxTypes.MintFungible:
      case TxTypes.BurnFungible:
      case TxTypes.MintNonFungible:
      case TxTypes.BurnNonFungible: {
        const sig = Bytes64.read(r);
        witnesses = [new Witness(msg.gasFrom, sig)];
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
        witnesses = [new Witness(msg.gasFrom, sig0), new Witness(Bytes32.Empty, sig1)];
        throw new Error('Unsupported transaction type');
        break;
      }

      case TxTypes.Call:
      case TxTypes.Call_Multi:
      case TxTypes.Trade:
      case TxTypes.Phantasma: {
        const arr = r.readArrayOfArrays();
        witnesses = arr.map((bytes) => {
          const rd = new CarbonBinaryReader(bytes);
          return Witness.read(rd);
        });
        break;
      }

      case TxTypes.Phantasma_Raw:
        witnesses = [];
        break;

      default:
        throw new Error('Unsupported transaction type');
    }
    return new SignedTxMsg(msg, witnesses);
  }

  static read(r: CarbonBinaryReader): SignedTxMsg {
    const v = new SignedTxMsg();
    v.read(r);
    return v;
  }
}
