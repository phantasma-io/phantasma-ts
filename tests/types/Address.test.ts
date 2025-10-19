import { Address, PhantasmaKeys } from '../../src/core';

describe('test Addresses', function () {
  test('test address', function (done) {
    const wif = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
    const keys = PhantasmaKeys.fromWIF(wif);
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
});
