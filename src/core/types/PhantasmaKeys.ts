import { IKeyPair } from '../interfaces/IKeyPair';
import { Address } from './Address';
import base58 from 'bs58';
import WIF from 'wif';
import { Signature } from '../interfaces/Signature';
import { bytesToHex } from '../utils';
import { Ed25519Signature } from './Ed25519Signature';
import pkg from 'elliptic';
import { Entropy } from './Entropy';
import {
  generateNewWif,
  getAddressFromWif,
  getPublicKeyFromPrivateKey,
  getWifFromPrivateKey,
} from '../tx';
const { eddsa } = pkg;
const ed25519 = new eddsa('ed25519');

export class PhantasmaKeys implements IKeyPair {
  private _privateKey: Uint8Array;
  public get PrivateKey() {
    return this._privateKey;
  }
  private _publicKey: Uint8Array;
  public get PublicKey() {
    return this._publicKey;
  }
  public readonly Address: Address;

  public static readonly PrivateKeyLength = 32;

  constructor(privateKey: Uint8Array) {
    if (privateKey.length == 64) {
      privateKey = privateKey.slice(0, 32);
    }

    if (privateKey.length != PhantasmaKeys.PrivateKeyLength) {
      throw new Error(
        `privateKey should have length ${PhantasmaKeys.PrivateKeyLength} but has ${privateKey.length}`
      );
    }

    this._privateKey = new Uint8Array(PhantasmaKeys.PrivateKeyLength);
    this._privateKey.set(privateKey);
    let wif = getWifFromPrivateKey(bytesToHex(privateKey));

    const privateKeyString = bytesToHex(this._privateKey);
    const privateKeyBuffer = Buffer.from(privateKeyString, 'hex');
    const publicKey = ed25519.keyFromSecret(privateKeyBuffer).getPublic();
    this._publicKey = publicKey;

    this.Address = Address.FromKey(this);
  }

  public toString() {
    return this.Address.Text;
  }

  public static generate(): PhantasmaKeys {
    const privateKey = Entropy.GetRandomBytes(PhantasmaKeys.PrivateKeyLength);

    const pair = new PhantasmaKeys(privateKey);
    return pair;
  }

  public static fromWIF(wif: string): PhantasmaKeys {
    if (!wif) {
      throw new Error('WIF required');
    }

    let data = base58.decode(wif); // checkdecode
    if (data.length == 38) {
      data = data.slice(0, 34);
    }

    if (data.length != 34 || data[0] != 0x80 || data[33] != 0x01) {
      throw new Error('Invalid WIF format');
    }

    const privateKey = data.slice(1, 33);
    return new PhantasmaKeys(privateKey);
  }

  public toWIF(): string {
    const privateKeyString = bytesToHex(this._privateKey);
    const privatekeyBuffer = Buffer.from(privateKeyString, 'hex');
    const wif = WIF.encode(128, privatekeyBuffer, true); //uint8ArrayToHex(data); // .base58CheckEncode();
    return wif;
  }

  public static xor(x: Uint8Array, y: Uint8Array): Uint8Array {
    if (x.length != y.length) {
      throw new Error('x and y should have the same length');
    }
    const result = new Uint8Array(x.length);
    for (let i = 0; i < x.length; i++) {
      result[i] = x[i] ^ y[i];
    }
    return result;
  }

  public Sign(
    msg: Uint8Array,
    customSignFunction?: (
      msg: Uint8Array,
      privateKey: Uint8Array,
      publicKey: Uint8Array
    ) => Uint8Array
  ): Signature {
    return Ed25519Signature.Generate(this, msg);
  }
}
