import { CarbonBinaryWriter } from '../../../CarbonSerialization';
import { Ed25519Signature } from '../../../Ed25519Signature';
import { PhantasmaKeys } from '../../../PhantasmaKeys';
import { Bytes32 } from '../../Bytes32';
import { Bytes64 } from '../../Bytes64';
import { CarbonBlob } from '../../CarbonBlob';
import { Witness } from '../../Witness';
import { SignedTxMsg } from '../SignedTxMsg';
import { TxMsg } from '../TxMsg';

export class TxMsgSigner {
  static sign(msg: TxMsg, key: PhantasmaKeys): SignedTxMsg {
    const sig = new Bytes64(Ed25519Signature.Generate(key, CarbonBlob.Serialize(msg)).Bytes);

    return new SignedTxMsg(msg, [new Witness(new Bytes32(key.PublicKey), sig)]);
  }

  static signAndSerialize(msg: TxMsg, key: PhantasmaKeys): Uint8Array {
    const signed = this.sign(msg, key);

    const w = new CarbonBinaryWriter();
    signed.write(w);

    return w.toUint8Array();
  }
}
