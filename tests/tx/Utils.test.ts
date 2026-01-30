import { PhantasmaKeys } from '../../src/core';
import {
  getAddressFromWif,
  getPrivateKeyFromWif,
  getPublicKeyFromPrivateKey,
  getWifFromPrivateKey,
} from '../../src/core/tx/utils.js';
import { bytesToHex } from '../../src/core/utils/index.js';

describe('tx utils', () => {
  const testWif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';

  test('getPrivateKeyFromWif matches PhantasmaKeys private key', () => {
    // Behavior: utils.getPrivateKeyFromWif must match PhantasmaKeys.fromWIF private key.
    const keys = PhantasmaKeys.fromWIF(testWif);
    const privateKeyHex = getPrivateKeyFromWif(testWif);

    expect(privateKeyHex).toBe(bytesToHex(keys.PrivateKey));
  });

  test('getAddressFromWif matches PhantasmaKeys address', () => {
    // Behavior: utils.getAddressFromWif must match PhantasmaKeys.fromWIF address text.
    const keys = PhantasmaKeys.fromWIF(testWif);
    const address = getAddressFromWif(testWif);

    expect(address).toBe(keys.Address.Text);
  });

  test('getWifFromPrivateKey returns original WIF', () => {
    // Behavior: utils.getWifFromPrivateKey should roundtrip a WIF private key.
    const privateKeyHex = getPrivateKeyFromWif(testWif);
    const wif = getWifFromPrivateKey(privateKeyHex);

    expect(wif).toBe(testWif);
  });

  test('getPublicKeyFromPrivateKey matches PhantasmaKeys public key', () => {
    // Behavior: utils.getPublicKeyFromPrivateKey must match the keypair public key.
    const keys = PhantasmaKeys.fromWIF(testWif);
    const privateKeyHex = getPrivateKeyFromWif(testWif);
    const publicKeyHex = getPublicKeyFromPrivateKey(privateKeyHex);

    expect(publicKeyHex).toBe(bytesToHex(keys.PublicKey));
  });
});
