import { CarbonBinaryReader, CarbonBinaryWriter } from '../../src/core/types/CarbonSerialization';
import { Bytes16 } from '../../src/core/types/Carbon/Bytes16';
import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { Bytes64 } from '../../src/core/types/Carbon/Bytes64';
import { VmDynamicVariable } from '../../src/core/types/Carbon/Blockchain/Vm/VmDynamicVariable';
import { VmType } from '../../src/core/types/Carbon/Blockchain/Vm/VmType';

const roundtrip = (type: VmType, data: unknown): VmDynamicVariable => {
  const input = new VmDynamicVariable();
  input.type = type;
  input.data = data;

  const w = new CarbonBinaryWriter();
  VmDynamicVariable.writeStatic(type, input, null, w);

  const r = new CarbonBinaryReader(w.toUint8Array());
  const output = new VmDynamicVariable();
  VmDynamicVariable.readStatic(type, output, null, r);
  return output;
};

describe('VmDynamicVariable roundtrip', () => {
  it('roundtrips Int8 values', () => {
    for (const value of [0, 1, 255]) {
      const round = roundtrip(VmType.Int8, value);
      expect(round.type).toBe(VmType.Int8);
      expect(round.data).toBe(value);
    }
  });

  it('roundtrips Int16 values', () => {
    for (const value of [0, 1, -32768, 32767]) {
      const round = roundtrip(VmType.Int16, value);
      expect(round.type).toBe(VmType.Int16);
      expect(round.data).toBe(value);
    }
  });

  it('roundtrips Int32 values', () => {
    for (const value of [0, 1, -2147483648, 2147483647]) {
      const round = roundtrip(VmType.Int32, value);
      expect(round.type).toBe(VmType.Int32);
      expect(round.data).toBe(value);
    }
  });

  it('roundtrips Int64 values', () => {
    for (const value of [0n, 1n, (1n << 64n) - 1n]) {
      const round = roundtrip(VmType.Int64, value);
      expect(round.type).toBe(VmType.Int64);
      expect(round.data).toBe(value);
    }
  });

  it('roundtrips Int256 values', () => {
    const value = BigInt('1234567890123456789012345678901234567890');
    const round = roundtrip(VmType.Int256, value);
    expect(round.type).toBe(VmType.Int256);
    expect(round.data).toBe(value);
  });

  it('roundtrips Bytes', () => {
    const value = new Uint8Array(Array.from({ length: 32 }, (_v, i) => i));
    const round = roundtrip(VmType.Bytes, value);
    expect(round.type).toBe(VmType.Bytes);
    expect(round.data).toEqual(value);
  });

  it('roundtrips String', () => {
    const value = 'hello world';
    const round = roundtrip(VmType.String, value);
    expect(round.type).toBe(VmType.String);
    expect(round.data).toBe(value);
  });

  it('roundtrips Bytes16', () => {
    const value = new Bytes16(new Uint8Array(Array.from({ length: 16 }, (_v, i) => i)));
    const round = roundtrip(VmType.Bytes16, value);
    expect(round.type).toBe(VmType.Bytes16);
    expect((round.data as Bytes16).equals(value)).toBe(true);
  });

  it('roundtrips Bytes32', () => {
    const value = new Bytes32(new Uint8Array(Array.from({ length: 32 }, (_v, i) => i)));
    const round = roundtrip(VmType.Bytes32, value);
    expect(round.type).toBe(VmType.Bytes32);
    expect((round.data as Bytes32).equals(value)).toBe(true);
  });

  it('roundtrips Bytes64', () => {
    const value = new Bytes64(new Uint8Array(Array.from({ length: 64 }, (_v, i) => i)));
    const round = roundtrip(VmType.Bytes64, value);
    expect(round.type).toBe(VmType.Bytes64);
    expect((round.data as Bytes64).equals(value)).toBe(true);
  });
});
