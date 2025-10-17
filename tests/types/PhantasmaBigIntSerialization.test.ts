import fs from 'fs';
import path from 'path';
import { bytesToHex } from '../../src/core/utils';
import {
  bigIntToTwosComplementLE_phantasma,
  bigIntFromTwosComplementLE_phantasma,
  bigIntToCsharpLE,
} from '../../src/core/types/PhantasmaBigIntSerialization';

// Type definition for a single TSV row
type Row = {
  number: string;
  pha: string; // actually decimal bytes space-separated
  csharp: string; // clean c# serialization
};

// Parse "15 39 0" → Uint8Array([15, 39, 0])
function decToBytes(dec: string): Uint8Array {
  const trimmed = dec.trim();
  if (trimmed === '') return new Uint8Array();
  const parts = trimmed.split(/\s+/);
  const out = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) {
    const v = Number.parseInt(parts[i], 10);
    if (!Number.isFinite(v) || v < 0 || v > 255) {
      throw new Error('invalid decimal byte in fixture');
    }
    out[i] = v;
  }
  return out;
}

function parseFixture(file: string): Row[] {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  lines.shift(); // header
  return lines.map((line) => {
    const [number, pha, csharp] = line.split('\t');
    return { number, pha, csharp };
  });
}

describe('Phantasma BigInt serialization', () => {
  const file = path.join(__dirname, '../fixtures/phantasma_bigint_vectors.tsv');
  const rows = parseFixture(file);

  test.each(rows)('roundtrip for %s', ({ number, pha, csharp }) => {
    const n = BigInt(number);
    const expectedPha = decToBytes(pha);
    const expectedCsharp = decToBytes(csharp);

    const encodedPha = bigIntToTwosComplementLE_phantasma(n);
    expect(bytesToHex(encodedPha)).toBe(bytesToHex(expectedPha));

    const decodedFromPha = bigIntFromTwosComplementLE_phantasma(encodedPha);
    expect(decodedFromPha).toBe(n);

    const encodedCsharp = bigIntToCsharpLE(n);
    expect(bytesToHex(encodedCsharp)).toBe(bytesToHex(expectedCsharp));

    // We don't need dedicated C# decoding method, Phantasma's one should work
    const decodedFromCsharp = bigIntFromTwosComplementLE_phantasma(encodedCsharp);
    expect(decodedFromCsharp).toBe(n);
  });
});
