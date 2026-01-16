import * as bs58 from 'bs58';
import { Address, Base16, PhantasmaKeys } from '../types/index.js';

/**
 * Gets the address from a private key.
 * @param privateKey The private key as a string.
 * @returns The address as a string.
 */
export const GetAddressFromPrivateKey = (privateKey: string): string => {
  const keys = PhantasmaKeys.fromWIF(privateKey);
  const publicKey = keys.Address.Text;
  return publicKey;
};

/**
 * Gets the address from a public key.
 * @param publicKey The public key as a string.
 * @returns The address as a string.
 */
export const GetAddressFromPublicKey = (publicKey: string): string => {
  // Assuming Base16.decodeUint8Array is a function that decodes a base16 string to Uint8Array
  let pubKeyBytes = Base16.decodeUint8Array(publicKey);
  // Create a new array and set the first two elements
  let addrArray = new Uint8Array(34);
  addrArray[0] = 1;
  // Copy 32 bytes from the 2nd position of pubKeyBytes to addrArray, starting from the 3rd position of addrArray
  addrArray.set(pubKeyBytes.slice(0, 32), 2);
  return 'P' + bs58.encode(addrArray);
};

/**
 * Gets the address from a public key.
 * @param publicKey Public key as a string.
 * @returns Address
 */
export const GetAddressPublicKeyFromPublicKey = (publicKey: string): Address => {
  let pubKeyBytes = Base16.decodeUint8Array(publicKey);
  // Create a new array and set the first two elements
  let addrArray = new Uint8Array(34);
  addrArray[0] = 1;
  // Copy 32 bytes from the 2nd position of pubKeyBytes to addrArray, starting from the 3rd position of addrArray
  addrArray.set(pubKeyBytes.slice(0, 32), 2);
  return Address.FromPublickKey(addrArray);
};
