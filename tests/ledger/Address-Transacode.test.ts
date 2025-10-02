import {} from '../../src';
import crypto from 'crypto';
import wif from 'wif';
import {
  Address,
  ConsensusMode,
  encodeBase16,
  generateNewWif,
  getAddressFromWif,
  getPrivateKeyFromWif,
  getWifFromPrivateKey,
  PhantasmaKeys,
  PollChoice,
  Serialization,
  Timestamp,
  VMObject,
} from '../../core';

describe('Address Transcode', () => {
  test('Get a new address', () => {
    const privateKey = crypto.randomBytes(32).toString('hex').toUpperCase();
    const walletWif = wif.encode(128, Buffer.from(privateKey, 'hex'), true);
    //const expectedAddress = phantasmaJS.getAddressFromWif(walletWif);
    //const actualAddress = addressTranscodeUtil.getAddressFromPrivateKey(privateKey);
  });
});
