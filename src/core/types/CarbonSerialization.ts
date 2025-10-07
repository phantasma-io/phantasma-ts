/**
 * Binary serialization helpers matching Carbon's Serialization.cs
 * - Little-endian for all integers
 * - Zero-terminated UTF-8 strings
 * - BigInt compact format:
 *   header: 0 -> zero; otherwise lower 6 bits = length (1..32), bit7 = sign (1 for negative)
 *   payload: little-endian two's complement without extra sign byte
 */

import { ICarbonBlob } from '../interfaces/Carbon/ICarbonBlob';
import { Bytes16 } from './Carbon/Bytes16';
import { Bytes32 } from './Carbon/Bytes32';
import { Bytes64 } from './Carbon/Bytes64';

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

  // BigInt compact format (<= 32 bytes)
  writeBigInt(value: bigint): void {
    if (value === 0n) {
      this.write1(0);
      return;
    }
    // Convert to minimal little-endian two's complement
    let bytes = bigIntToTwosComplementLE(value);
    // If longer than 32 and is only sign extension to 33, trim to 32 and recurse (mimics C#)
    if (bytes.length > 32) {
      Throw.Assert(
        bytes.length === 33 && (bytes[32] === 0x00 || bytes[32] === 0xff),
        'BigInt overflow'
      );
      bytes = bytes.slice(0, 32);
      this.writeBigInt(twosComplementLEToBigInt(bytes));
      return;
    }
    this.writeBigIntRaw(bytes);
  }

  private writeBigIntRaw(bytes: Uint8Array): void {
    const length = bytes.length;
    Throw.Assert(length > 0 && length <= 32, 'BigInt too big');
    // infer sign from inherent top bit
    const signFromBytes = (bytes[length - 1] & 0x80) !== 0 ? -1 : 1;
    const signBit = signFromBytes < 0 ? 0x80 : 0;
    const header = (length & 0x3f) | signBit;
    this.write1(header);
    this.writeExactly(bytes, length);
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

  // BigInt compact format
  readBigInt(): bigint {
    const header = this.read1();
    if (header === 0) {
      return 0n;
    }
    const sign = (header & 0x80) !== 0 ? -1 : 1;
    const length = header & 0x3f;
    Throw.If(length > 32, 'BigInt too big');
    if (length === 0) {
      return 0n;
    }
    let bytes = this.readExactly(length);
    // Ensure inherent sign matches header by adding explicit sign extension byte if needed
    const inherentSign = (bytes[bytes.length - 1] & 0x80) !== 0 ? -1 : 1;
    if (inherentSign !== sign) {
      const ext = sign >= 0 ? 0x00 : 0xff;
      const tmp = new Uint8Array(bytes.length + 1);
      tmp.set(bytes, 0);
      tmp[tmp.length - 1] = ext;
      bytes = tmp;
    }
    const bi = twosComplementLEToBigInt(bytes);
    // Sanity check: signs must match
    Throw.Assert((bi < 0n ? -1 : bi > 0n ? 1 : 0) === sign || bi === 0n, 'BigInt sign mismatch');
    return bi;
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
