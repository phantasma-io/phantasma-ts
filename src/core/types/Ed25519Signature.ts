import { IKeyPair } from '../interfaces/IKeyPair';
import { Signature, SignatureKind } from '../interfaces/Signature';
import { Address } from './Address';
import pkg from 'elliptic';

import { stringToUint8Array, bytesToHex, uint8ArrayToString } from '../utils';
import { BinaryReader, BinaryWriter, Encoding } from 'csharp-binary-stream';
import { PBinaryWriter, PBinaryReader } from './Extensions';
const { eddsa } = pkg;
const ed25519 = new eddsa('ed25519');

export class Ed25519Signature implements Signature {
  public Bytes: Uint8Array;
  public Kind: SignatureKind = SignatureKind.Ed25519;

  constructor(bytes?: Uint8Array) {
    this.Bytes = bytes;
  }

  Verify(message: Uint8Array, address: Address): boolean {
    return this.VerifyMultiple(message, [address]);
  }

  public VerifyMultiple(message: Uint8Array, addresses: Address[]): boolean {
    for (const address of addresses) {
      if (!address.IsUser) {
        continue;
      }
      const pubKey = address.ToByteArray().slice(2);
      const msgBytes = Buffer.from(message);
      const sigHex = bytesToHex(this.Bytes);
      const pubKeyHex = bytesToHex(pubKey);
      if (ed25519.verify(msgBytes, sigHex, pubKeyHex)) {
        return true;
      }
    }
    return false;
  }

  public SerializeData(writer: PBinaryWriter) {
    //writer.writeString(uint8ArrayToString(this.Bytes));
    writer.writeByteArray(this.Bytes);
  }

  public UnserializeData(reader: PBinaryReader) {
    this.Bytes = stringToUint8Array(reader.readString());
  }

  ToByteArray(): Uint8Array {
    const stream = new Uint8Array(64);
    const writer = new PBinaryWriter(stream);
    this.SerializeData(writer);
    return new Uint8Array(stream);
  }

  public static Generate(keypair: IKeyPair, message: Uint8Array): Ed25519Signature {
    const msgHashHex = Buffer.from(bytesToHex(message), 'hex');
    //const msgHashHex = uint8ArrayToString(message);
    const privateKeyBuffer = Buffer.from(bytesToHex(keypair.PrivateKey), 'hex');
    //const privateKeyBuffer = uint8ArrayToString(keypair.PrivateKey);

    const sign = ed25519.sign(msgHashHex, privateKeyBuffer);
    return new Ed25519Signature(sign.toBytes());
  }
}
