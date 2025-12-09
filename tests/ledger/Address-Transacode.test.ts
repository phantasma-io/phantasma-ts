import {} from '../../src';
import crypto from 'crypto';
import wif from 'wif';

describe('Address Transcode', () => {
  test('Get a new address', () => {
    const privateKey = crypto.randomBytes(32).toString('hex').toUpperCase();
    /*const walletWif = */ wif.encode(128, Buffer.from(privateKey, 'hex'), true);
    //const expectedAddress = phantasmaJS.getAddressFromWif(walletWif);
    //const actualAddress = addressTranscodeUtil.getAddressFromPrivateKey(privateKey);
  });
});
