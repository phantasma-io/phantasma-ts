import base58 from 'bs58';
import { encodeBase16, stringToUint8Array, uint8ArrayToString } from '../utils';
import SHA256 from 'crypto-js/sha256';
import hexEncoding from 'crypto-js/enc-hex';
import { IKeyPair, ISerializable } from '../interfaces';
import { getPrivateKeyFromWif, getPublicKeyFromPrivateKey, getWifFromPrivateKey } from '../tx';
import pkg from 'elliptic';
import { PBinaryWriter, PBinaryReader } from './Extensions';
const { eddsa } = pkg;
const curve = new eddsa('ed25519');

export enum AddressKind {
  Invalid = 0,
  User = 1,
  System = 2,
  Interop = 3,
}

export class Address implements ISerializable {
  public static readonly NullText: string = 'NULL';
  public static readonly LengthInBytes: number = 34;
  public static readonly MaxPlatformNameLength: number = 10;

  private static NullPublicKey = new Uint8Array(Address.LengthInBytes);
  public static readonly Null: Address = new Address(Address.NullPublicKey);

  private _bytes: Uint8Array;

  /*public get Kind(): AddressKind {
        return this.IsNull ? AddressKind.System : (this._bytes[0] >= 3) ? AddressKind.Interop 
            : (AddressKind)this._bytes[0];
    }*/

  public get Kind(): AddressKind {
    if (this.IsNull) {
      return AddressKind.System;
    } else if (this._bytes[0] >= 3) {
      return AddressKind.Interop;
    } else {
      return this._bytes[0] as AddressKind;
    }
  }

  public get IsSystem(): boolean {
    return this.Kind == AddressKind.System;
  }

  public get IsInterop(): boolean {
    return this.Kind == AddressKind.Interop;
  }

  public get IsUser(): boolean {
    return this.Kind == AddressKind.User;
  }

  /*public get TendermintAddress(): string {
        return encodeBase16(this._bytes.slice(2).SHA256().slice(0, 20));
    }
    public get TendermintAddress() {
        return SHA256(this._bytes.slice(2)).slice(0, 20).toString('hex');
    }   
    */

  public get IsNull(): boolean {
    if (this._bytes == null || this._bytes.length == 0) {
      return true;
    }

    for (let i = 1; i < this._bytes.length; i++) {
      if (this._bytes[i] != 0) {
        return false;
      }
    }

    return true;
  }

  private _text: string;

  private static _keyToTextCache = new Map<Uint8Array, string>();

  public get Text(): string {
    if (this.IsNull) {
      return Address.NullText;
    }

    if (!this._text) {
      if (Address._keyToTextCache.has(this._bytes)) {
        this._text = Address._keyToTextCache.get(this._bytes);
      }

      if (!this._text) {
        let prefix: string;

        switch (this.Kind) {
          case AddressKind.User:
            prefix = 'P';
            break;
          case AddressKind.Interop:
            prefix = 'X';
            break;
          default:
            prefix = 'S';
            break;
        }
        this._text = prefix + base58.encode(this._bytes);
        Address._keyToTextCache.set(this._bytes, this._text);
      }
    }

    return this._text;
  }

  private constructor(publicKey: Uint8Array) {
    let pkFromArray = Array.from(publicKey);
    if (publicKey.length != Address.LengthInBytes) {
      throw new Error(
        `publicKey length must be ${Address.LengthInBytes}, it was ${publicKey.length}}`
      );
    }
    this._bytes = new Uint8Array(Address.LengthInBytes);
    this._bytes.set(publicKey);
    this._text = null;
  }

  public static FromPublickKey(publicKey: Uint8Array): Address {
    publicKey = publicKey.slice(0, 34);
    return new Address(publicKey);
  }

  public static FromText(text: string): Address {
    return Address.Parse(text);
  }

  public static Parse(text: string): Address {
    if (text == null) {
      return Address.Null;
    }

    if (text == Address.NullText) {
      return Address.Null;
    }

    let addr: Address;

    let originalText = text;
    let prefix = text[0];

    text = text.slice(1);
    var bytes = base58.decode(text);

    addr = new Address(bytes);

    switch (prefix) {
      case 'P':
        if (addr.Kind != AddressKind.User) {
          throw new Error(`Invalid address prefix. Expected 'P', got '${prefix}'`);
        }
        break;
      case 'S':
        if (addr.Kind != AddressKind.System) {
          throw new Error(`Invalid address prefix. Expected 'S', got '${prefix}'`);
        }
        break;
      case 'X':
        if (addr.Kind < AddressKind.Interop) {
          throw new Error(`Invalid address prefix. Expected 'X', got '${prefix}'`);
        }
        break;
      default:
        throw new Error(`Invalid address prefix. Expected 'P', 'S' or 'X', got '${prefix}'`);
    }

    /*this._keyToTextCache.values().forEach((value) => {
      if (value == text) {
        return Address.FromHash(this._keyToTextCache(value));
      }*/

    return addr;
  }

  public static IsValidAddress(text: string): boolean {
    try {
      Address.FromText(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  public static FromBytes(bytes: Uint8Array): Address {
    return new Address(bytes);
  }

  public static FromKey(key: IKeyPair): Address {
    const bytes = new Uint8Array(Address.LengthInBytes);
    bytes[0] = AddressKind.User;

    if (key.PublicKey.length == 32) {
      bytes.set(key.PublicKey, 2);
    } else if (key.PublicKey.length == 33) {
      bytes.set(key.PublicKey, 1);
    } else if (key.PublicKey.length == 64) {
      bytes.set(key.PublicKey.slice(0, 32), 1);
    } else {
      throw new Error('Invalid public key length: ' + key.PublicKey.length);
    }

    return new Address(bytes);
  }

  public static FromHash(str: string): Address;
  public static FromHash(input: Uint8Array): Address;
  public static FromHash(input: any): Address {
    let bytes: Uint8Array;
    if (typeof input === 'string') {
      bytes = new TextEncoder().encode(input);
    } else {
      bytes = input;
    }

    const hash = SHA256(hexEncoding.parse(uint8ArrayToString(bytes)));
    bytes = new Uint8Array(Address.LengthInBytes);
    bytes[0] = AddressKind.User;
    bytes.set(hash.words.slice(0, 32), 2);
    return new Address(bytes);
  }

  public static FromWif(wif: string): Address {
    const privateKey = getPrivateKeyFromWif(wif);
    const publicKey = getPublicKeyFromPrivateKey(privateKey);
    var addressHex = Buffer.from('0100' + publicKey, 'hex');
    return this.FromBytes(addressHex);
  }

  public compareTo(other: Address): number {
    for (let i = 0; i < Address.LengthInBytes; i++) {
      if (this._bytes[i] < other._bytes[i]) {
        return -1;
      } else if (this._bytes[i] > other._bytes[i]) {
        return 1;
      }
    }
    return 0;
  }

  public equals(other: any): boolean {
    if (!(other instanceof Address)) {
      return false;
    }
    const address = other as Address;
    return this._bytes.toString() === address._bytes.toString();
  }

  public toString(): string {
    if (this.IsNull) {
      return Address.NullText;
    }

    if (!this._text) {
      let prefix: string;
      switch (this.Kind) {
        case AddressKind.User:
          prefix = 'P';
          break;
        case AddressKind.Interop:
          prefix = 'X';
          break;
        default:
          prefix = 'S';
          break;
      }
      this._text = prefix + base58.encode(this._bytes);
    }
    return this._text;
  }

  public GetPublicKey(): Uint8Array {
    if (!this._bytes || this._bytes.length !== Address.LengthInBytes) {
      throw new Error('invalid address byte length');
    }

    return this._bytes.slice(2, 34);
  }

  public ToByteArray(): Uint8Array {
    return this._bytes;
  }

  SerializeData(writer: PBinaryWriter) {
    writer.writeByteArray(this._bytes);
  }

  UnserializeData(reader: PBinaryReader) {
    this._bytes = reader.readByteArray();
    this._text = null;
  }
}
