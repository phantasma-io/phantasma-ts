import bigInt from "big-integer";
import { ISignature, SignatureKind } from "../interfaces/index.js";
import { VMType } from "./VMType.js";

export class Decoder {
  str: string;

  constructor(str: string) {
    this.str = str;
  }

  isEnd() {
    return this.str.length == 0;
  }

  readCharPair() {
    var res = this.str.substr(0, 2);
    this.str = this.str.slice(2);
    return res;
  }

  readByte() {
    return parseInt(this.readCharPair(), 16);
  }

  read(numBytes: number): string {
    var res = this.str.substr(0, numBytes * 2);
    this.str = this.str.slice(numBytes * 2);
    return res;
  }

  readString(): string {
    var len = this.readVarInt();
    return this.readStringBytes(len);
  }

  readStringBytes(numBytes: number) {
    var res = "";
    for (var i = 0; i < numBytes; ++i) {
      res += String.fromCharCode(this.readByte());
    }
    return res;
  }

  readByteArray() {
    var res;
    var length = this.readVarInt();
    if (length == 0) return [];

    res = this.read(length);
    return res;
  }

  readSignature() {
    let kind = this.readByte() as SignatureKind;
    let signature: ISignature = new ISignature();
    let curve;
    signature.kind = kind;
    switch (kind) {
      case SignatureKind.None:
        return null;

      case SignatureKind.Ed25519:
        let len = this.readVarInt();
        signature.signature = this.read(len);
        break;
      case SignatureKind.ECDSA:
        curve = this.readByte();
        signature.signature = this.readString();
        break;
      default:
        throw "read signature: " + kind;
    }

    return signature;
  }

  readTimestamp() {
    //var len = this.readByte();
    let result = 0;
    let bytes: any = this.read(4);
    bytes
      .match(/.{1,2}/g)
      .reverse()
      .forEach((c: any) => (result = result * 256 + parseInt(c, 16)));
    return result;
  }

  readVarInt() {
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

  readBigInt() {
    // TO DO: implement negative numbers
    var len = this.readVarInt();
    var res = 0;
    var stringBytes = this.read(len);
    [...(stringBytes.match(/.{1,2}/g) as any)]
      .reverse()
      .forEach((c) => (res = res * 256 + parseInt(c, 16)));
    return res;
  }

  readBigIntAccurate() {
    var len = this.readVarInt();
    var res = bigInt();
    var stringBytes = this.read(len);
    [...(stringBytes.match(/.{1,2}/g) as any)].reverse().forEach((c) => {
      res = res.times(256).plus(parseInt(c, 16));
    });
    return res.toString();
  }

  readVmObject() {
    const type = this.readByte();
    console.log("type", type);
    switch (type) {
      case VMType.String:
        return this.readString();
      case VMType.Number:
        return this.readBigIntAccurate();
      case VMType.Bool:
        return this.readByte() != 0;
      case VMType.Struct:
        const numFields = this.readVarInt();
        let res: any = {};
        for (let i = 0; i < numFields; ++i) {
          const key: any = this.readVmObject();
          console.log("  key", key);
          const value = this.readVmObject();
          console.log("  value", value);
          res[key] = value;
        }
        return res;
      case VMType.Enum:
        return this.readVarInt();
      case VMType.Object:
        const numBytes = this.readVarInt();
        return this.read(numBytes);
      default:
        return "unsupported type " + type;
    }
  }
}
