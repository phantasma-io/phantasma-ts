import { bytesToHex, hexToBytes } from '../../src/core/utils';

describe('Hex encoding', () => {
  it('roundtrips byte arrays', () => {
    const data = new Uint8Array([0x00, 0x00, 0x01, 0x02, 0x03, 0xff, 0x10, 0x20]);

    const hex = bytesToHex(data);
    expect(hex).toBe('0000010203ff1020');

    const decoded = hexToBytes(hex);
    expect(Array.from(decoded)).toStrictEqual(Array.from(data));
  });
});
