import WIF from 'wif';
import pkg from 'elliptic';
import base58 from 'bs58';
import * as bip39 from 'bip39';
import crypto from 'crypto';
const { eddsa } = pkg;
const curve = new eddsa('ed25519');

function ab2hexstring(arr: ArrayBuffer | ArrayLike<number>): string {
  if (typeof arr !== 'object') {
    throw new Error(`ab2hexstring expects an array.Input was ${arr}`);
  }
  let result = '';
  const intArray = new Uint8Array(arr);
  for (const i of intArray) {
    let str = i.toString(16);
    str = str.length === 0 ? '00' : str.length === 1 ? '0' + str : str;
    result += str;
  }
  return result;
}

export function getPrivateKeyFromWif(wif: string): string {
  return ab2hexstring(WIF.decode(wif, 128).privateKey);
}

export function getAddressFromWif(wif: string): string {
  const curve = new eddsa('ed25519');

  const privateKey = getPrivateKeyFromWif(wif);
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  const publicKey = curve.keyFromSecret(privateKeyBuffer).getPublic('hex');
  var addressHex = Buffer.from('0100' + publicKey, 'hex');

  return 'P' + base58.encode(addressHex);
}

export function getPublicKeyFromPrivateKey(privateKey: string): string {
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  const publicKey = curve.keyFromSecret(privateKeyBuffer).getPublic('hex');
  return publicKey;
}

export function generateNewSeed(): string {
  let buffer = new Uint8Array(32);
  let privateKey = Buffer.alloc(32);
  crypto.getRandomValues(buffer);
  for (let i = 0; i < 32; ++i) {
    privateKey.writeUInt8(buffer[i], i);
  }

  const wif = WIF.encode(128, privateKey, true);
  const mnemonic = bip39.generateMnemonic();
  return mnemonic;
}

export function generateNewSeedWords(): string[] {
  let buffer = new Uint8Array(32);
  let privateKey = Buffer.alloc(32);
  crypto.getRandomValues(buffer);
  for (let i = 0; i < 32; ++i) {
    privateKey.writeUInt8(buffer[i], i);
  }

  const wif = WIF.encode(128, privateKey, true);
  const mnemonic = bip39.generateMnemonic();
  const seedWords = mnemonic.split(' ');
  return seedWords;
}

export function generateNewWif(): string {
  let buffer = new Uint8Array(32);
  let privateKey = Buffer.alloc(32);
  crypto.getRandomValues(buffer);
  for (let i = 0; i < 32; ++i) {
    privateKey.writeUInt8(buffer[i], i);
  }

  const wif = WIF.encode(128, privateKey, true);
  return wif;
}

export function getWifFromPrivateKey(privateKey: string): string {
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
  const wif = WIF.encode(128, privateKeyBuffer, true);
  return wif;
}

export function signData(msgHex: string, privateKey: string): string {
  const msgHashHex = Buffer.from(msgHex, 'hex');
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');

  const sig = curve.sign(msgHashHex, privateKeyBuffer);
  const numBytes = sig.toBytes().length;

  return '01' + (numBytes < 16 ? '0' : '') + numBytes.toString(16) + sig.toHex();
}

export function verifyData(msgHex: string, phaSig: string, address: string): boolean {
  const msgBytes = Buffer.from(msgHex, 'hex');
  const realSig = phaSig.substring(4);
  const pubKey = base58.decode(address.substring(1)).slice(2);

  return curve.verify(msgBytes, realSig, ab2hexstring(pubKey));
}
