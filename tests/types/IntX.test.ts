import { IntX } from '../../src/core/types/Carbon/IntX';

describe('IntX.is8ByteSafe', () => {
  const MIN_I64 = -(1n << 63n);
  const MAX_I64 = (1n << 63n) - 1n;

  it('detects safe 64-bit values when stored as small', () => {
    expect(IntX.fromI64(0n).is8ByteSafe()).toBe(true);
    expect(IntX.fromI64(MIN_I64).is8ByteSafe()).toBe(true);
    expect(IntX.fromI64(MAX_I64).is8ByteSafe()).toBe(true);
  });

  it('detects unsafe values above int64 max', () => {
    const tooLarge = IntX.fromBigInt(MAX_I64 + 1n);
    expect(tooLarge.is8ByteSafe()).toBe(false);
  });

  it('detects unsafe values below int64 min', () => {
    const tooSmall = IntX.fromBigInt(MIN_I64 - 1n);
    expect(tooSmall.is8ByteSafe()).toBe(false);
  });

  it('handles bigint-backed values within range', () => {
    const bigBacked = IntX.fromBigInt(42n);
    expect(bigBacked.is8ByteSafe()).toBe(true);
  });
});
