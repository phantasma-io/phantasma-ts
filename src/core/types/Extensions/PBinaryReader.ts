import BigInteger from 'big-integer';
import { BinaryWriter, BinaryReader, Encoding } from 'csharp-binary-stream';
import { ISignature, SignatureKind, Signature } from '../../interfaces/index.js';
import { bytesToHex, stringToUint8Array } from '../../utils/index.js';
import { VMType } from '../../vm/index.js';
import { Ed25519Signature } from '../Ed25519Signature.js';
import { Timestamp } from '../Timestamp.js';

export class PBinaryReader {
  reader: BinaryReader;
  get length(): number {
    return this.reader.length;
  }
  get position(): number {
    return this.reader.position;
  }
  set position(value: number) {
    this.reader.position = value;
  }
  get isEndOfStream(): boolean {
    return this.reader.isEndOfStream;
  }
  readBoolean(): boolean {
    return this.reader.readBoolean();
  }
  readByte(): number {
    return this.reader.readByte();
  }
  readBytes(bytesToRead: number): number[] {
    return this.reader.readBytes(bytesToRead);
  }
  readSignedByte(): number {
    return this.reader.readSignedByte();
  }
  readShort(): number {
    return this.reader.readShort();
  }
  readUnsignedShort(): number {
    return this.reader.readUnsignedShort();
  }
  readInt(): number {
    return this.reader.readInt();
  }
  readUnsignedInt(): number {
    return this.reader.readUnsignedInt();
  }
  readLongString(): string {
    return this.reader.readLongString();
  }
  readLong(): number {
    return this.reader.readLong();
  }
  readUnsignedLongString(): string {
    return this.reader.readUnsignedLongString();
  }
  readUnsignedLong(): number {
    return this.reader.readUnsignedLong();
  }
  readFloat(): number {
    return this.reader.readFloat();
  }
  readDouble(): number {
    return this.reader.readDouble();
  }
  readChar(encoding: Encoding): string {
    return this.reader.readChar(encoding);
  }
  readChars(charactersToRead: number, encoding: Encoding): string {
    return this.reader.readChars(charactersToRead, encoding);
  }
  readCharBytes(bytesToRead: number, encoding: Encoding): string {
    return this.reader.readCharBytes(bytesToRead, encoding);
  }

  constructor(arg1: Buffer | Uint8Array) {
    this.reader = new BinaryReader(arg1);
  }

  public read(numBytes: number): string {
    var res = bytesToHex(this.readBytes(numBytes)).substr(0, numBytes * 2);
    //this.position += numBytes;
    return res;
  }

  public readString(): string {
    var len = this.readVarInt();
    return this.readStringBytes(len);
  }

  public readStringBytes(numBytes: number) {
    var res = '';
    for (var i = 0; i < numBytes; ++i) {
      res += String.fromCharCode(this.readByte());
    }
    return res;
  }

  public readBigInteger(): BigInt {
    // TO DO: implement negative numbers
    var len = this.readVarInt();
    var res = 0;
    var stringBytes = this.read(len);
    [...(stringBytes.match(/.{1,2}/g) as any)]
      .reverse()
      .forEach((c) => (res = res * 256 + parseInt(c, 16)));

    let bigInt = BigInt(res);
    return bigInt;
  }

  public readBigIntAccurate() {
    var len = this.readVarInt();
    var res = BigInteger();
    var stringBytes = this.read(len);
    [...(stringBytes.match(/.{1,2}/g) as any)].reverse().forEach((c) => {
      res = res.times(256).plus(parseInt(c, 16));
    });
    return res.toString();
  }

  public readSignatureV2(): Signature {
    let kind = this.readByte() as SignatureKind;
    let curve;
    let signature: Signature = new Ed25519Signature();

    switch (kind) {
      case SignatureKind.None:
        return null;

      case SignatureKind.Ed25519:
        let len = this.readVarInt();
        signature.Bytes = stringToUint8Array(this.read(len));
        break;
      case SignatureKind.ECDSA:
        curve = this.readByte();
        signature.Bytes = stringToUint8Array(this.readString());
        break;
      default:
        throw 'read signature: ' + kind;
    }

    return signature;
  }

  public readSignature(): Signature {
    let kind = this.readByte() as SignatureKind;
    let signature: Signature = new Ed25519Signature();
    let curve;
    signature.Kind = kind;
    switch (kind) {
      case SignatureKind.None:
        return null;

      case SignatureKind.Ed25519:
        let len = this.readVarInt();
        signature.Bytes = stringToUint8Array(this.read(len));
        break;
      case SignatureKind.ECDSA:
        curve = this.readByte();
        signature.Bytes = stringToUint8Array(this.readString());
        break;
      default:
        throw 'read signature: ' + kind;
    }

    return signature;
  }

  public readByteArray() {
    var res;
    var length = this.readVarInt();
    if (length == 0) return [];

    res = this.read(length);
    return res;
  }

  public readTimestamp(): Timestamp {
    //var len = this.readByte();
    let result = 0;
    let bytes = this.read(4);
    //[...(bytes.match(/.{1,2}/g) as any)];
    bytes
      .match(/.{1,2}/g)
      .reverse()
      .forEach((c) => (result = result * 256 + parseInt(c, 16)));

    let timestamp = new Timestamp(result);
    return timestamp;
  }

  public readVarInt(): number {
    var len = this.readByte();
    var res = 0;
    if (len === 0xfd) {
      [...(this.read(2).match(/.{1,2}/g) as any)]
        .reverse()
        .forEach((c) => (res = res * 256 + parseInt(c, 16)));
      return res;
    } else if (len === 0xfe) {
      [...(this.read(4).match(/.{1,2}/g) as any)]
        .reverse()
        .forEach((c) => (res = res * 256 + parseInt(c, 16)));
      return res;
    } else if (len === 0xff) {
      [...(this.read(8).match(/.{1,2}/g) as any)]
        .reverse()
        .forEach((c) => (res = res * 256 + parseInt(c, 16)));
      return res;
    }
    return len;
  }

  public readVarString(): string {
    var len = this.readVarInt();
    if (len == 0) return '';
    return this.readStringBytes(len);
  }

  public readVmObject() {
    const type = this.readByte();
    switch (type) {
      case VMType.String:
        return this.readString();
      case VMType.Number:
        return this.readBigIntAccurate();
      case VMType.Bool:
        return this.readByte() != 0;
      case VMType.Struct:
        const numFields = this.readVarInt();
        let res = {};
        for (let i = 0; i < numFields; ++i) {
          const key: any = this.readVmObject();
          const value = this.readVmObject();
          res[key] = value;
        }
        return res;
      case VMType.Enum:
        return this.readVarInt();
      case VMType.Object:
        const numBytes = this.readVarInt();
        return this.read(numBytes);
      default:
        return 'unsupported type ' + type;
    }
  }
}
