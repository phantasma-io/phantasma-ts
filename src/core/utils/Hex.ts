const HEX_LUT: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
const HEX_RE = /^[0-9a-fA-F]+$/;

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
  const trimmed = hex.trim();
  const normalized = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  if (normalized.length === 0) {
    return new Uint8Array();
  }
  if (normalized.length % 2 !== 0) {
    throw new Error(`Invalid hex string length ${normalized.length} hex: ${normalized}`);
  }
  if (!HEX_RE.test(normalized)) {
    throw new Error(`Invalid hex string: ${normalized}`);
  }
  // Validate input first so parsing never silently accepts non-hex characters.
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
