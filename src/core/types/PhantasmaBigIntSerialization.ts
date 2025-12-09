/**
 * Phantasma BigInt serialization (VarBytes-style)
 *
 * This module implements Phantasma serialization for signed big integers (bigint):
 * - Representation is two's complement, little-endian (LE)
 * - On the wire it follows the historical Phantasma/C# behavior:
 *   1) Build a C#-compatible LE byte array for the integer (two's complement)
 *      * Positive numbers get a leading 0x00 guard byte at the most significant side if needed
 *      * Negative numbers get a two's complement form with MSB sign bit set (0x80) at the most significant byte
 *   2) Apply Phantasma-specific trailing rule (aka tail guard):
 *      * For positives: append 0x00 if the last byte is not already 0x00
 *      * For negatives: append 0xFF to preserve sign extension (for -1 expects [FF,FF,FF])
 *
 * Reading (deserialization) reverses the process:
 * - Decode two's complement from LE payload
 * - For positives: treat the payload as a plain LE magnitude
 * - For negatives: invert and add 1, then negate the resulting magnitude
 *
 * Notes
 * - Little-endian (LE) means the least-significant byte comes first
 * - Two's complement guarantees a unique representation for zero and correct ordering for negatives
 * - This file intentionally mirrors Go/C# reference behavior for byte-for-byte compatibility
 */

/**
 * Build a C#-compatible two's complement (LE) byte array for a signed bigint
 * Steps:
 * 1) Handle zero early as [0x00]
 * 2) For positives:
 *    - Extract magnitude bytes in LE order
 *    - If the most significant byte (MSB) would imply a negative (bit 7 set), append 0x00 guard
 * 3) For negatives:
 *    - Start from magnitude of |n|, invert all bytes and add 1 (two's complement in LE)
 *    - Ensure MSB has sign bit set (append 0xFF if needed)
 * Result: a minimal LE two's complement array compatible with C# BigInteger byte layout
 */

export function bigIntToCsharpLE(n: bigint): Uint8Array {
  // Zero has a single-byte canonical representation in C# BigInteger: [0x00]
  if (n === 0n) {
    return new Uint8Array([0x00]);
  }

  // Determine the sign once; all subsequent steps depend on it
  const negative = n < 0n;
  // Work with magnitude |n|; two’s complement for negative values will be applied later
  let x = negative ? -n : n;
  const bytes: number[] = [];
  // Extract magnitude in little-endian order: push least-significant byte first
  while (x > 0n) {
    bytes.push(Number(x & 0xffn));
    x >>= 8n;
  }

  // Positive value path
  if (!negative) {
    // Ensure non-negative sign
    // If MSB would set the sign bit, append 0x00 so the value stays non-negative in two’s complement
    if ((bytes[bytes.length - 1] & 0x80) !== 0) {
      bytes.push(0x00);
    }
    return Uint8Array.from(bytes);
  }

  // Negative value path: build two’s complement directly in little-endian representation
  // Two's complement in LE
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = ~bytes[i] & 0xff;
  }
  // Step 2: add 1 to complete two’s complement (propagate carry across bytes)
  // Step 2: add 1 to obtain the magnitude in LE (two’s complement reversal)
  let carry = 1;
  for (let i = 0; i < bytes.length; i++) {
    const s = bytes[i] + carry;
    bytes[i] = s & 0xff;
    carry = s >> 8;
    if (!carry) break;
  }
  // If an extra carry remains, append it as a new most-significant byte
  if (carry) {
    bytes.push(carry);
  }
  // Ensure negative sign bit at MSB
  // Ensure the resulting most-significant byte has the sign bit set to mark the value as negative
  if ((bytes[bytes.length - 1] & 0x80) === 0) {
    bytes.push(0xff);
  }
  return Uint8Array.from(bytes);
}

/**
 * Serialize bigint to Phantasma byte array (LE two's complement with trailing tail guard)
 * Process:
 * - First, build the C#-style two's complement bytes (LE) via toCsharpLE
 * - Then apply Phantasma tail rule:
 *   * Positive: ensure the last byte is 0x00 by appending one if necessary
 *   * Negative: append 0xFF to keep sign-extension stable; for -1 specifically
 *     expectation is [FF, FF, FF] (single-byte 0xFF followed by two 0xFF guard bytes)
 * The resulting array matches historical Go/C# Phantasma serialization byte-for-byte
 */

// Serialize to Phantasma wire format: start from C# bytes then apply trailing-byte rule
export function bigIntToTwosComplementLE_phantasma(n: bigint): Uint8Array {
  // 1) Build C#-compatible bytes (LE + sign-guard)
  // Build C#-style LE two’s complement bytes first (minimal, sign-correct)
  const cs = Array.from(bigIntToCsharpLE(n));

  // 2) Apply Phantasma tail rules
  // Phantasma trailing rule for negative values
  if (n < 0n) {
    // Historical special-case: single-byte negative values (like -1) must be extended to [FF, FF, FF] on the wire
    if (cs.length === 1) {
      cs.push(0xff, 0xff); // -1 → [FF,FF,FF]
    } else if (cs[cs.length - 1] === 0xff) {
      cs.push(0xff);
    }

    // Phantasma trailing rule for non-negative values
  } else {
    // Ensure a terminating 0x00 guard exists at the most-significant side for positives
    if (cs[cs.length - 1] !== 0x00) {
      cs.push(0x00);
    }
  }
  return Uint8Array.from(cs);
}
/**
 * Deserialize Phantasma two's complement (LE) byte array back to bigint
 * Logic:
 * - Determine sign from the most significant byte's sign bit (bit 7)
 * - For non-negative payloads:
 *   * Interpret as a plain LE magnitude (ignore trailing 0x00 guard if present)
 * - For negative payloads:
 *   * Compute two's complement back in LE (invert bytes, add 1) and negate the magnitude
 * This matches Go/C# reader behavior and roundtrips values produced by the serializer
 */

// Deserialize from Phantasma wire format: interpret two’s complement in LE
export function bigIntFromTwosComplementLE_phantasma(data: Uint8Array): bigint {
  if (data.length === 0) return 0n;
  // Sign is determined by the most significant byte’s bit 7 (1 → negative)
  const neg = (data[data.length - 1] & 0x80) !== 0;
  // Positive path: interpret as plain little-endian magnitude; trailing 0x00 is benign
  if (!neg) {
    // positive: plain LE magnitude (leading zero bytes are fine)
    let x = 0n;
    // Reconstruct BigInt by shifting left 8 and OR-ing each byte from MSB to LSB
    for (let i = data.length - 1; i >= 0; i--) {
      x = (x << 8n) | BigInt(data[i]);
    }
    return x;
  }
  // Negative path: compute two’s complement back (invert and add 1), then negate the magnitude
  // negative: two's complement back (LE)
  const a = new Uint8Array(data);
  for (let i = 0; i < a.length; i++) a[i] = ~a[i] & 0xff;
  let carry = 1;
  for (let i = 0; i < a.length; i++) {
    const s = a[i] + carry;
    a[i] = s & 0xff;
    carry = s >> 8;
    if (!carry) break;
  }
  let x = 0n;
  // Fold bytes back into a positive magnitude and then apply the negative sign
  for (let i = a.length - 1; i >= 0; i--) {
    x = (x << 8n) | BigInt(a[i]);
  }
  return -x;
}
