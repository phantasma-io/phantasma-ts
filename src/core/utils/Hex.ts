const HEX_LUT: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(bytes: Uint8Array): string;
export function bytesToHex(bytes: readonly number[]): string;
export function bytesToHex(bytes: ArrayLike<number>): string;
export function bytesToHex(bytes: ArrayLike<number>): string {
  const len = bytes.length >>> 0;
  let out = '';
  for (let i = 0; i < len; i++) {
    const v = Number((bytes as any)[i]);
    if (!Number.isInteger(v) || v < 0 || v > 255) {
      throw new Error(`Invalid byte at index ${i}: ${v}`);
    }
    out += HEX_LUT[v];
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string length ${hex.length} hex: ${hex}`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
