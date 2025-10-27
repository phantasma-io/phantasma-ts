import { Address, PhantasmaKeys } from '../../src/core';

describe('test Addresses', function () {
  const testWif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';

  test('test address', function (done) {
    const keys = PhantasmaKeys.fromWIF(testWif);
    const address = keys.Address;

    expect(address.Text).toBe('P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL');

    done();
  });

  test('test address from text', function (done) {
    const addr = Address.FromText('P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL');
    const address = addr.Text;

    expect(address).toBe('P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL');

    done();
  });

  test('GetPublicKey returns the 32-byte public key slice', () => {
    const keys = PhantasmaKeys.fromWIF(testWif);

    const publicKey = keys.Address.GetPublicKey();

    expect(publicKey).toHaveLength(32);
    expect(Array.from(publicKey)).toEqual(Array.from(keys.PublicKey));
  });

  test('GetPublicKey for Address.Null returns 32 zeroed bytes', () => {
    const publicKey = Address.Null.GetPublicKey();

    expect(publicKey).toHaveLength(32);
    expect(Array.from(publicKey).every((value) => value === 0)).toBe(true);
  });
});
