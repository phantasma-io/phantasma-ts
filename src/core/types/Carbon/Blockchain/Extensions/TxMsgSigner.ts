import { CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { Ed25519Signature } from '../../../Ed25519Signature.js';
import { PhantasmaKeys } from '../../../PhantasmaKeys.js';
import { Bytes32 } from '../../Bytes32.js';
import { Bytes64 } from '../../Bytes64.js';
import { CarbonBlob } from '../../CarbonBlob.js';
import { Witness } from '../../Witness.js';
import { SignedTxMsg } from '../SignedTxMsg.js';
import { TxMsg } from '../TxMsg.js';

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
