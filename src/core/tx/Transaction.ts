import pkg from 'elliptic';
const { eddsa } = pkg;
import { Decoder, ScriptBuilder } from '../vm';
import { bytesToHex, hexToBytes, getDifficulty, uint8ArrayToStringDefault } from '../utils';
import hexEncoding from 'crypto-js/enc-hex';
import SHA256 from 'crypto-js/sha256';
import { ISerializable, ISignature, Signature } from '../interfaces';
import { Base16, PBinaryReader, PBinaryWriter, PhantasmaKeys } from '../types';
import { getWifFromPrivateKey } from './utils';
const curve = new eddsa('ed25519');

export class Transaction implements ISerializable {
  script: string; // Should be HexString
  nexusName: string;
  chainName: string;
  payload: string; // Should be HexString
  expiration: Date;
  signatures: Array<Signature>;
  hash: string;

  public static FromBytes(serializedData: string): Transaction {
    let transaction = new Transaction('', '', '', new Date(), '');
    return transaction.unserialize(serializedData);
  }

  constructor(
    nexusName: string,
    chainName: string,
    script: string, // Should be HexString
    expiration: Date,
    payload: string // Should be HexString
  ) {
    this.nexusName = nexusName;
    this.chainName = chainName;
    this.script = script;
    this.expiration = expiration;
    this.payload = payload == null || payload == '' ? '7068616e7461736d612d7473' : payload;
    this.signatures = [];
  }

  public sign(wif: string) {
    let _keys = PhantasmaKeys.fromWIF(wif);
    const msg = this.ToByteAray(false);
    let sig: Signature = _keys.Sign(msg);
    let sigs: Signature[] = [];
    if (this.signatures != null && this.signatures.length > 0) {
      sigs = this.signatures;
    }
    sigs.push(sig);

    this.signatures = sigs;
    //const signature = this.getSign(this.toString(false), privateKey);
    //this.signatures.unshift({ signature, kind: 1 });
  }

  public signWithPrivateKey(privateKey: string) {
    const msg = this.ToByteAray(false);
    let sig: Signature = PhantasmaKeys.fromWIF(getWifFromPrivateKey(privateKey)).Sign(msg);
    let sigs: Signature[] = [];
    if (this.signatures != null && this.signatures.length > 0) {
      sigs = this.signatures;
    }
    sigs.push(sig);

    this.signatures = sigs;
  }

  public signWithKeys(keys: PhantasmaKeys) {
    const msg = this.ToByteAray(false);
    let sig: Signature = keys.Sign(msg);
    let sigs: Signature[] = [];
    if (this.signatures != null && this.signatures.length > 0) {
      sigs = this.signatures;
    }
    sigs.push(sig);

    this.signatures = sigs;
  }

  public ToByteAray(withSignature: boolean): Uint8Array {
    let writer = new PBinaryWriter();
    writer.writeString(this.nexusName);
    writer.writeString(this.chainName);
    writer.AppendHexEncoded(this.script);
    writer.writeDateTime(this.expiration);
    writer.AppendHexEncoded(this.payload);
    if (withSignature) {
      writer.writeVarInt(this.signatures.length);
      this.signatures.forEach((sig) => {
        writer.writeSignature(sig);
        //writer.writeByte(sig.kind);
        //writer.writeByteArray(stringToUint8Array(sig.signature));
      });
    }

    return writer.toUint8Array();
  }

  public UnserializeData(reader: PBinaryReader) {
    this.nexusName = reader.readString();
    this.chainName = reader.readString();
    this.script = uint8ArrayToStringDefault(reader.readByteArray());
    let time = reader.readTimestamp();
    this.expiration = new Date(time.toString());
    this.payload = uint8ArrayToStringDefault(reader.readByteArray());
    let sigCount = reader.readVarInt();
    for (let i = 0; i < sigCount; i++) {
      let sig = reader.readSignatureV2();
      this.signatures.push(sig);
    }
  }

  public SerializeData(writer: PBinaryWriter) {
    writer.writeString(this.nexusName);
    writer.writeString(this.chainName);
    writer.writeByteArray(Base16.decodeUint8Array(this.script));
    writer.writeDateTime(this.expiration);
    writer.writeByteArray(Base16.decodeUint8Array(this.payload));
    writer.writeVarInt(this.signatures.length);
    this.signatures.forEach((sig) => {
      writer.writeSignature(sig);
    });
  }

  public toString(withSignature: boolean): string {
    /*const utc = Date.UTC(
      this.expiration.getUTCFullYear(),
      this.expiration.getUTCMonth(),
      this.expiration.getUTCDate(),
      this.expiration.getUTCHours(),
      this.expiration.getUTCMinutes(),
      this.expiration.getUTCSeconds()
    );
    let num = utc / 1000;

    let a = (num & 0xff000000) >> 24;
    let b = (num & 0x00ff0000) >> 16;
    let c = (num & 0x0000ff00) >> 8;
    let d = num & 0x000000ff;

    let expirationBytes = [d, c, b, a];*/

    let sb = new ScriptBuilder()
      .EmitVarString(this.nexusName)
      .EmitVarString(this.chainName)
      .EmitVarInt(this.script.length / 2)
      .AppendHexEncoded(this.script)
      .EmitTimestamp(this.expiration)
      .EmitVarInt(this.payload.length / 2)
      .AppendHexEncoded(this.payload);

    if (withSignature) {
      sb.EmitVarInt(this.signatures.length);
      this.signatures.forEach((sig) => {
        console.log('adding signature ', sig);
        if (sig.Kind == 1) {
          sb.AppendByte(1); // Signature Type
          sb.EmitVarInt(sig.Bytes.length / 2);
          sb.AppendHexEncoded(bytesToHex(sig.Bytes));
        } else if (sig.Kind == 2) {
          sb.AppendByte(2); // ECDSA Signature
          sb.AppendByte(1); // Curve type secp256k1
          sb.EmitVarInt(sig.Bytes.length / 2);
          sb.AppendHexEncoded(bytesToHex(sig.Bytes));
        }
      });
    }
    return sb.str;
  }

  public ToStringEncoded(withSignature: boolean): string {
    return Base16.encodeUint8Array(this.ToByteAray(withSignature));
  }

  public getHash() {
    let generatedHash = SHA256(hexEncoding.parse(this.toString(false)));
    this.hash = bytesToHex(hexToBytes(generatedHash.toString(hexEncoding)).reverse());
    return this.hash;
  }

  public mineTransaction(difficulty: number) {
    if (difficulty < 0 || difficulty > 256) {
      console.log('Error adding difficulty');
      return;
    }

    let nonce = 0;
    let deepCopy = new Transaction(
      JSON.parse(JSON.stringify(this.nexusName)),
      JSON.parse(JSON.stringify(this.chainName)),
      JSON.parse(JSON.stringify(this.script)),
      this.expiration,
      JSON.parse(JSON.stringify(this.payload))
    );
    let payload = Buffer.alloc(4);

    while (true) {
      if (getDifficulty(deepCopy.getHash()) >= difficulty) {
        this.payload = deepCopy.payload;
        console.log('It took ' + nonce + ' iterations to get a difficulty of >' + difficulty);
        return;
      }

      nonce++;

      payload[0] = (nonce >> 0) & 0xff;
      payload[1] = (nonce >> 8) & 0xff;
      payload[2] = (nonce >> 16) & 0xff;
      payload[3] = (nonce >> 24) & 0xff;

      deepCopy.payload = bytesToHex(payload);
    }
  }

  private getSign(msgHex: string, privateKey: string): string {
    const msgHashHex = Buffer.from(msgHex, 'hex');
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    const sig = curve.sign(msgHashHex, privateKeyBuffer);

    return sig.toHex();
  }

  public unserialize(serializedData: string): Transaction {
    let dec = new Decoder(serializedData);
    let nexusName = dec.readString();
    let chainName = dec.readString();
    let scriptLength = dec.readVarInt();
    let script = dec.read(scriptLength);
    let date = new Date(dec.readTimestamp() * 1000);
    let payloadLength = dec.readVarInt();
    let payload = dec.read(payloadLength);

    let nTransaction = new Transaction(nexusName, chainName, script, date, payload);
    let signatureCount = dec.readVarInt();
    /*for (let i = 0; i < signatureCount; i++) {
      nTransaction.signatures.push(dec.readSignature());
    }*/
    return nTransaction;
  }

  public static Unserialize(serialized: Uint8Array) {
    let reader = new PBinaryReader(serialized);
    let tx = new Transaction('', '', '', new Date(), '');
    tx.UnserializeData(reader);
    return tx;
  }
}
