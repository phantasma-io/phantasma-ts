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
  static sign(msg: TxMsg, key: PhantasmaKeys): Uint8Array {
    const sig = new Bytes64(Ed25519Signature.Generate(key, CarbonBlob.Serialize(msg)).Bytes);

    const signed = new SignedTxMsg(msg, [new Witness(new Bytes32(key.PublicKey), sig)]);

    const w = new CarbonBinaryWriter();
    signed.write(w);

    return w.toUint8Array();
  }
}
