/**
 * Binary serialization helpers matching Carbon's Serialization.cs
 * - Little-endian for all integers
 * - Zero-terminated UTF-8 strings
 * - BigInt compact format:
 *   header: 0 -> zero; otherwise lower 6 bits = payload length (0..32), bit7 = sign fill
 *   payload: the low-order bytes of the validator/runtime 256-bit word after trailing fill trimming
 */

import { ICarbonBlob } from '../interfaces/Carbon/ICarbonBlob.js';
import { Bytes16 } from './Carbon/Bytes16.js';
import { Bytes32 } from './Carbon/Bytes32.js';
import { Bytes64 } from './Carbon/Bytes64.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class Throw {
  static If(cond: boolean, msg: string): void {
    if (cond) {
      throw new Error(msg);
    }
  }
  static Assert(cond: boolean, msg = 'assertion failed'): void {
    if (!cond) {
      throw new Error(msg);
    }
  }
}

export class CarbonBinaryWriter {
  private chunks: Uint8Array[] = [];
  private size = 0;

  private push(data: Uint8Array): void {
    this.chunks.push(data);
    this.size += data.length;
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this.size);
    let offset = 0;
    for (const c of this.chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }

  // Raw write helpers
  write(data: Uint8Array): void {
    this.push(data);
  }
  write1(v: number): void {
    const b = new Uint8Array(1);
    b[0] = v & 0xff;
    this.push(b);
  }
  write2(v: number): void {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setInt16(0, v, true);
    this.push(b);
  }
  write4(v: number): void {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setInt32(0, v | 0, true);
    this.push(b);
  }
  write4u(v: number): void {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v >>> 0, true);
    this.push(b);
  }
  write8(v: bigint): void {
    const b = new Uint8Array(8);
    const dv = new DataView(b.buffer);
    dv.setBigInt64(0, v, true);
    this.push(b);
  }
  write8u(v: bigint): void {
    const b = new Uint8Array(8);
    const dv = new DataView(b.buffer);
    dv.setBigUint64(0, v, true);
    this.push(b);
  }

  // Fixed-size blobs
  writeExactly(data: Uint8Array, count: number): void {
    Throw.If(data.length !== count, 'incorrect input size');
    this.push(data);
  }
  write16(data: Uint8Array | Bytes16): void {
    const bytes = data instanceof Uint8Array ? data : data.bytes;
    this.writeExactly(bytes, 16);
  }
  write32(data: Uint8Array | Bytes32): void {
    const bytes = data instanceof Uint8Array ? data : data.bytes;
    this.writeExactly(bytes, 32);
  }
  write64(data: Uint8Array | Bytes64): void {
    const bytes = data instanceof Uint8Array ? data : data.bytes;
    this.writeExactly(bytes, 64);
  }

  // Blobs (ICarbonBlob)
  writeBlob<T extends ICarbonBlob>(data: T): void {
    data.write(this);
  }
  writeArrayBlob<T extends ICarbonBlob>(arr: T[]): void {
    this.write4(arr.length);
    for (const t of arr) {
      t.write(this);
    }
  }

  // BigInt compact format (<= 32 payload bytes after validator trimming)
  writeBigInt(value: bigint): void {
    if (value === 0n) {
      this.write1(0);
      return;
    }
    // Carbon wire bytes follow the validator/runtime contract, not JS BigInt's sign-safe minimal form.
    // We therefore rebuild the full 256-bit two's-complement word first and only then trim high fill bytes.
    const word = normalizeBigIntWord(bigIntToTwosComplementLE(value));
    // The sign bit in the reconstructed 256-bit word determines which fill byte the validator would omit.
    const fill = (word[31] & 0x80) !== 0 ? 0xff : 0x00;
    // Validator trimming is intentionally simple: drop every trailing fill byte from the 256-bit word.
    const length = computeBigIntSerializedLength(word, fill);
    // The header stores the sign of the reconstructed 256-bit word, even when the payload is empty.
    const header = (length & 0x3f) | (fill & 0x80);
    this.write1(header);
    if (length > 0) {
      this.write(word.subarray(0, length));
    }
  }

  public writeArrayBigInt(items: bigint[]): void {
    this.write4(items.length);
    for (const x of items) {
      this.writeBigInt(x);
    }
  }

  // Strings (zero-terminated UTF-8)
  writeSz(s: string): void {
    const bytes = textEncoder.encode(s);
    for (const b of bytes) {
      Throw.Assert(b !== 0, 'string contains zero byte');
    }
    this.write(bytes);
    this.write1(0);
  }

  writeArraySz(arr: string[]): void {
    this.write4(arr.length);
    for (const s of arr) {
      this.writeSz(s);
    }
  }

  // Variable-length byte arrays
  writeArray(bytes: Uint8Array): void {
    this.write4(bytes.length);
    this.write(bytes);
  }

  writeArray64u(arr: bigint[]): void {
    this.write4(arr.length);
    for (const v of arr) {
      this.write8u(v);
    }
  }

  writeArray64(arr: bigint[]): void {
    this.write4(arr.length);
    for (const v of arr) {
      this.write8(v);
    }
  }

  writeArray32(arr: number[]): void {
    this.write4(arr.length);
    for (const v of arr) {
      this.write4(v);
    }
  }

  writeArray16(arr: number[]): void {
    this.write4(arr.length);
    for (const v of arr) {
      this.write2(v);
    }
  }

  writeArray8(arr: number[]): void {
    this.write4(arr.length);
    for (const v of arr) {
      this.write1(v);
    }
  }

  writeArrayOfArrays(arr: Uint8Array[]): void {
    this.write4(arr.length);
    for (const a of arr) {
      this.writeArray(a);
    }
  }
}

export class CarbonBinaryReader {
  private offset = 0;
  private readonly view: DataView;
  private readonly bytes: Uint8Array;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    this.bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  private take(count: number): Uint8Array {
    Throw.If(this.offset + count > this.bytes.length, 'end of stream reached');
    const out = this.bytes.subarray(this.offset, this.offset + count);
    this.offset += count;
    return out;
  }

  readRemaining(): Uint8Array {
    return this.take(this.bytes.length - this.offset);
  }

  // Raw reads
  read1(): number {
    const b = this.bytes[this.offset];
    this.offset += 1;
    return b;
  }
  read2(): number {
    const v = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return v;
  }
  read4(): number {
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }
  read4u(): number {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }
  read8(): bigint {
    const v = this.view.getBigInt64(this.offset, true);
    this.offset += 8;
    return v;
  }
  read8u(): bigint {
    const v = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return v;
  }

  // Fixed-size blobs
  readExactly(count: number): Uint8Array {
    return this.take(count);
  }
  read16(): Uint8Array {
    return this.take(16);
  }
  read32(): Uint8Array {
    return this.take(32);
  }
  read64(): Uint8Array {
    return this.take(64);
  }

  readInto16(out: Bytes16): void {
    out.bytes = this.read16();
  }
  readInto32(out: Bytes32): void {
    out.bytes = this.read32();
  }
  readInto64(out: Bytes64): void {
    out.bytes = this.read64();
  }

  // Blobs (ICarbonBlob)
  readBlob<T extends ICarbonBlob>(ctor: new () => T): T {
    const t = new ctor();
    t.read(this);
    return t;
  }
  readArrayBlob<T extends ICarbonBlob>(ctor: new () => T): T[] {
    const len = this.read4();
    const arr: T[] = new Array(len);
    for (let i = 0; i < len; i++) {
      const t = new ctor();
      t.read(this);
      arr[i] = t;
    }
    return arr;
  }

  // BigInt compact format.
  // `preReadHeader` lets IntX reuse the exact same validator reader after consuming its own framing byte.
  readBigInt(preReadHeader = -1): bigint {
    const header = preReadHeader < 0 ? this.read1() : preReadHeader & 0xff;
    if (header === 0) {
      return 0n;
    }
    const length = header & 0x3f;
    Throw.If((header & 0x40) !== 0 || length > 32, 'BigInt too big');
    // The header sign bit defines the bytes that were omitted from the high side of the 256-bit word.
    const fill = (header & 0x80) !== 0 ? 0xff : 0x00;
    // Rebuild the full validator/runtime 256-bit word before decoding two's complement.
    // This is what makes shortest negative forms like `0x80` decode to `-1` instead of `0`.
    const word = new Uint8Array(32);
    if (length > 0) {
      word.set(this.readExactly(length), 0);
    }
    word.fill(fill, length);
    // If the reconstructed sign bit disagrees with the header, the payload is not a valid validator word.
    Throw.Assert((word[31] & 0x80) === (header & 0x80), 'non-standard BigInt header');
    return twosComplementLEToBigInt(word);
  }

  readArrayBigInt(): bigint[] {
    const len = this.read4();
    const arr: bigint[] = new Array(len);
    for (let i = 0; i < len; i++) arr[i] = this.readBigInt();
    return arr;
  }

  // Strings (zero-terminated UTF-8)
  readSz(): string {
    const start = this.offset;
    while (true) {
      Throw.If(this.offset >= this.bytes.length, 'end of stream reached');
      if (this.bytes[this.offset] === 0) break;
      this.offset++;
    }
    const slice = this.bytes.subarray(start, this.offset);
    this.offset++; // skip zero
    return textDecoder.decode(slice);
  }

  readArraySz(): string[] {
    const len = this.read4();
    const out: string[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.readSz();
    return out;
  }

  // Variable-length byte arrays
  readArray(): Uint8Array {
    const len = this.read4();
    return this.readExactly(len);
  }
  readArrayOfArrays(): Uint8Array[] {
    const len = this.read4();
    const arr: Uint8Array[] = new Array(len);
    for (let i = 0; i < len; i++) arr[i] = this.readArray();
    return arr;
  }

  readArray64u(): bigint[] {
    const len = this.read4();
    const out: bigint[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.read8u();
    return out;
  }
  readArray64(): bigint[] {
    const len = this.read4();
    const out: bigint[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.read8();
    return out;
  }
  readArray32(): number[] {
    const len = this.read4();
    const out: number[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.read4();
    return out;
  }
  readArray16(): number[] {
    const len = this.read4();
    const out: number[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.read2();
    return out;
  }
  readArray8(): number[] {
    const len = this.read4();
    const out: number[] = new Array(len);
    for (let i = 0; i < len; i++) out[i] = this.read1();
    return out;
  }
}

/**
 * Convert bigint to minimal little-endian two's complement bytes
 * Behavior mirrors .NET BigInteger.ToByteArray() but never returns 0-length
 */
export function bigIntToTwosComplementLE(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array([0]);

  const negative = value < 0n;
  let v = value;

  // Extract bytes little-endian
  const out: number[] = [];
  if (!negative) {
    while (v > 0n) {
      out.push(Number(v & 0xffn));
      v >>= 8n;
    }
    // If the highest byte would imply negative (bit7 set), append a 0x00 sign byte
    if ((out[out.length - 1] & 0x80) !== 0) out.push(0x00);
  } else {
    // For negative numbers, two's complement infinite ones; emulate via loop
    // We repeatedly take (v & 0xFF) then arithmetic shift
    while (v !== -1n && v !== 0n) {
      out.push(Number(v & 0xffn));
      v >>= 8n;
    }
    // Ensure top byte has MSB set to keep negative sign
    if (out.length === 0 || (out[out.length - 1] & 0x80) === 0) out.push(0xff);
  }
  return Uint8Array.from(out);
}

/**
 * Rebuild the validator/runtime 256-bit word from a sign-safe minimal two's-complement payload.
 *
 * The Carbon protocol does not serialize JS/.NET style sign-guard bytes directly.
 * Instead it reconstructs the full 256-bit two's-complement word first, then trims all high fill bytes.
 * This helper performs the "reconstruct the word" half of that contract.
 */
function normalizeBigIntWord(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0) {
    return new Uint8Array(32);
  }

  const sourceFill = (bytes[bytes.length - 1] & 0x80) !== 0 ? 0xff : 0x00;
  let normalized = bytes;

  if (normalized.length > 32) {
    // Any bytes above 256 bits must be pure sign extension. If not, the value does not fit Carbon Int256.
    for (let i = 32; i < normalized.length; i++) {
      Throw.Assert(normalized[i] === sourceFill, 'BigInt overflow');
    }
    normalized = normalized.slice(0, 32);
  }

  const word = new Uint8Array(32);
  word.set(normalized, 0);
  // Shorter sign-safe encodings are expanded back to the full 256-bit two's-complement word.
  word.fill(sourceFill, normalized.length);
  return word;
}

/**
 * Compute the validator/runtime payload length for a reconstructed 256-bit word.
 *
 * The validator does not keep an extra guard byte once the word is expanded.
 * It simply removes every contiguous high fill byte from the full word.
 */
function computeBigIntSerializedLength(word: Uint8Array, fill: number): number {
  let length = word.length;
  while (length > 0 && word[length - 1] === fill) {
    length--;
  }
  return length;
}

/** Convert little-endian two's complement bytes to bigint */
export function twosComplementLEToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length === 0) return 0n;
  const negative = (bytes[bytes.length - 1] & 0x80) !== 0;

  let result = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i]);
  }

  if (negative) {
    const bitLen = BigInt(bytes.length * 8);
    const mod = 1n << bitLen;
    result = result - mod;
  }
  return result;
}

// Convenience helpers to mirror C# generic methods
export function writeBlob<T extends ICarbonBlob>(w: CarbonBinaryWriter, data: T): void {
  data.write(w);
}
export function readBlob<T extends ICarbonBlob>(r: CarbonBinaryReader, ctor: new () => T): T {
  const t = new ctor();
  t.read(r);
  return t;
}
