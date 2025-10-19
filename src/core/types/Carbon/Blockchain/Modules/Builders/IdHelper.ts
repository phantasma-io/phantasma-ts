/**
 * Generates a random 256-bit unsigned bigint (like C# BigInteger with isUnsigned=true, isBigEndian=true)
 */
export async function getRandomPhantasmaId(): Promise<bigint> {
  const bytes = new Uint8Array(32);

  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    // Browser or Node >=19 with webcrypto
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node without webcrypto (import dynamically)
    const { randomFillSync } = await import('crypto');
    randomFillSync(bytes);
  }

  let out = 0n;
  for (const b of bytes) {
    out = (out << 8n) | BigInt(b);
  }

  return out;
}
