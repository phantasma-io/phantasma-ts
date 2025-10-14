import fs from 'fs';
import path from 'path';

import { CarbonBinaryWriter, CarbonBinaryReader } from '../../src/core/types/CarbonSerialization';
import { CarbonBlob } from '../../src/core/types/Carbon/CarbonBlob';

import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { Bytes64 } from '../../src/core/types/Carbon/Bytes64';
import { SmallString } from '../../src/core/types/Carbon/SmallString';
import { IntX } from '../../src/core/types/Carbon/IntX';
import { TxTypes } from '../../src/core/types/Carbon/TxTypes';

import { SignedTxMsg } from '../../src/core/types/Carbon/Blockchain/SignedTxMsg';
import { TxMsg } from '../../src/core/types/Carbon/Blockchain/TxMsg';
import { TxMsgTransferFungible } from '../../src/core/types/Carbon/Blockchain/TxMsgTransferFungible';

import { PhantasmaKeys } from '../../src/core/types/PhantasmaKeys';
import { Ed25519Signature } from '../../src/core/types/Ed25519Signature';
import { Witness } from '../../src/core/types/Carbon/Witness';
import { byteArrayToHex, hexToByteArray } from '../../src/core/utils';

type Kind =
  | 'U8'
  | 'I16'
  | 'I32'
  | 'U32'
  | 'I64'
  | 'U64'
  | 'FIX16'
  | 'FIX32'
  | 'FIX64'
  | 'SZ'
  | 'ARRSZ'
  | 'ARR8'
  | 'ARR16'
  | 'ARR32'
  | 'ARR64'
  | 'ARRU64'
  | 'ARRBYTES-1D'
  | 'ARRBYTES-2D'
  | 'BI'
  | 'INTX'
  | 'ARRBI'
  | 'TX1'
  | 'TX2';

type Row =
  | { kind: Exclude<Kind, 'BI' | 'INTX'>; value: string; hex: string }
  | { kind: 'BI' | 'INTX'; value: string; hex: string; decOrig: string; decBack: string };

const FIXTURE = path.join(__dirname, '..', 'fixtures', 'carbon_vectors.tsv');

// ---------- helpers ----------

const parseNum = (s: string): number => {
  const t = s.trim();
  return t.startsWith('0x') || t.startsWith('0X') ? parseInt(t, 16) : parseInt(t, 10);
};

const parseBI = (s: string): bigint => {
  const t = s.trim();
  return BigInt(t);
};

const parseIntX = (s: string): IntX => {
  const t = s.trim();

  const num = BigInt(t);
  const MIN_INT64 = -(1n << 63n);
  const MAX_INT64 = (1n << 63n) - 1n;

  let intX: IntX;
  if (num >= MIN_INT64 && num <= MAX_INT64) {
    intX = IntX.fromI64(num);
  } else {
    intX = IntX.fromBigInt(num);
  }

  return intX;
};

const parseCsv = (s: string): string[] => (s.length ? s.split(',') : []);

const parseArrBytes2D = (s: string): Uint8Array[] => {
  // "[[01,02],[03,04,05]]"
  const trimmed = s.trim();
  if (!trimmed.startsWith('[[') || !trimmed.endsWith(']]')) return [];
  const inner = trimmed.slice(2, -2); // "01,02],[03,04,05"
  const parts = inner.split('],['); // ["01,02", "03,04,05"]
  return parts.map((seg) => {
    const hexParts = seg.split(',').map((x) => x.trim());
    const flat = hexParts.join('');
    return hexToByteArray(flat);
  });
};

// ---------- TSV parser ----------

const parseFixture = (tsv: string): Row[] => {
  const lines = tsv
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((x) => x.trim().length > 0);

  const rows: Row[] = lines.map((line, idx): Row => {
    const cols = line.split('\t');
    if (cols.length === 5 && (cols[0] === 'BI' || cols[0] === 'INTX')) {
      const [kind, value, hex, decOrig, decBack] = cols;
      return { kind, value, hex, decOrig, decBack };
    }
    if (cols.length === 3) {
      const [kind, value, hex] = cols;
      return { kind: kind as Exclude<Kind, 'BI' | 'INTX'>, value, hex };
    }
    throw new Error(`Bad TSV at line ${idx + 1}`);
  });

  return rows;
};

// ---------- encode / decode maps ----------

type Enc = (row: Row, w: CarbonBinaryWriter) => void;
type Dec = (row: Row, r: CarbonBinaryReader) => unknown;

const encoders: Partial<Record<Kind, Enc>> = {
  U8: (c, w) => w.write1(parseNum(c.value)),
  I16: (c, w) => w.write2(parseNum(c.value)),
  I32: (c, w) => w.write4(parseNum(c.value)),
  U32: (c, w) => w.write4u(parseNum(c.value) >>> 0),
  I64: (c, w) => w.write8(parseBI(c.value)),
  U64: (c, w) => w.write8u(parseBI(c.value)),

  FIX16: (c, w) => w.write16(hexToByteArray(c.value)),
  FIX32: (c, w) => w.write32(hexToByteArray(c.value)),
  FIX64: (c, w) => w.write64(hexToByteArray(c.value)),

  SZ: (c, w) => w.writeSz(c.value),
  ARRSZ: (c, w) => w.writeArraySz(parseCsv(c.value)),

  ARR8: (c, w) => w.writeArray8(parseCsv(c.value).map((x) => parseNum(x) as unknown as number)),
  ARR16: (c, w) => w.writeArray16(parseCsv(c.value).map((x) => parseNum(x))),
  ARR32: (c, w) => w.writeArray32(parseCsv(c.value).map((x) => parseNum(x))),
  ARR64: (c, w) => w.writeArray64(parseCsv(c.value).map((x) => BigInt(x))),
  ARRU64: (c, w) => w.writeArray64(parseCsv(c.value).map((x) => BigInt(x))),

  'ARRBYTES-1D': (c, w) => w.writeArray(hexToByteArray(c.value)),
  'ARRBYTES-2D': (c, w) => w.writeArrayOfArrays(parseArrBytes2D(c.value)),

  BI: (c, w) => w.writeBigInt(parseBI(c.value)),

  INTX: (c, w) => IntX.fromBigInt(BigInt(c.value)).write(w),

  ARRBI: (c, w) => {
    const items = parseCsv(c.value).map(parseBI);
    w.writeArrayBigInt(items);
  },

  TX1: (_c, w) => {},
  TX2: (_c, w) => {},
};

const decoders: Partial<Record<Kind, Dec>> = {
  U8: (_c, r) => r.read1(),
  I16: (_c, r) => r.read2(),
  I32: (_c, r) => r.read4(),
  U32: (_c, r) => r.read4u(),
  I64: (_c, r) => r.read8(),
  U64: (_c, r) => r.read8u(),

  FIX16: (_c, r) => r.read16(),
  FIX32: (_c, r) => r.read32(),
  FIX64: (_c, r) => r.read64(),

  SZ: (_c, r) => r.readSz(),
  ARRSZ: (_c, r) => r.readArraySz(),

  ARR8: (_c, r) => r.readArray8(),
  ARR16: (_c, r) => r.readArray16(),
  ARR32: (_c, r) => r.readArray32(),
  ARR64: (_c, r) => r.readArray64(),
  ARRU64: (_c, r) => r.readArray64u?.() ?? r.readArray64(), // поддержка обеих реализаций

  'ARRBYTES-1D': (_c, r) => r.readArray(),
  'ARRBYTES-2D': (_c, r) => r.readArrayOfArrays?.(),

  BI: (_c, r) => r.readBigInt(),
  INTX: (_c, r) => IntX.read(r),
  ARRBI: (_c, r) => r.readArrayBigInt(),

  TX1: (_c, r) => TxMsg.read(r),
  TX2: (_c, r) => SignedTxMsg.read(r),
};

// ---------- load fixture ----------

const rows: Row[] = parseFixture(fs.readFileSync(FIXTURE, 'utf8'));

// ---------- tests ----------

describe('CarbonSerialization.ts ↔ C# fixtures (encode)', () => {
  test.each(rows.map((r, i) => [i, r]))('encode line #%d: %s', (_i, c) => {
    if (c.kind === 'TX1' || c.kind === 'TX2') return;
    const enc = encoders[c.kind];
    expect(enc).toBeDefined();
    const w = new CarbonBinaryWriter();
    enc!(c as any, w);
    const got = byteArrayToHex(w.toUint8Array());
    expect(got.toUpperCase()).toBe(c.hex.toUpperCase());
  });
});

describe('CarbonSerialization.ts ↔ C# fixtures (decode)', () => {
  test.each(rows.map((r, i) => [i, r]))('decode line #%d: %s', (_i, c) => {
    const r = new CarbonBinaryReader(hexToByteArray(c.hex));
    const dec = decoders[c.kind];
    expect(dec).toBeDefined();
    const v = dec!(c as any, r);

    switch (c.kind) {
      case 'U8':
      case 'I16':
      case 'I32':
      case 'U32':
        expect(String(v)).toBe(String(parseNum((c as any).value)));
        break;
      case 'I64':
      case 'U64':
      case 'BI':
        if ((c as any).decBack) {
          expect(String(v)).toBe(parseBI((c as any).decBack).toString());
        } else {
          expect(String(v)).toBe(parseBI((c as any).value).toString());
        }
        break;
      case 'INTX':
        if ((c as any).decBack) {
          expect(String(v)).toBe(parseIntX((c as any).decBack).toString());
        } else {
          expect(String(v)).toBe(parseIntX((c as any).value).toString());
        }
        break;
      case 'FIX16':
      case 'FIX32':
      case 'FIX64': {
        const expected = (c as any).value.toUpperCase();
        const actual = byteArrayToHex(v as Uint8Array);
        expect(actual.toUpperCase()).toBe(expected.toUpperCase());
        break;
      }
      case 'SZ':
        expect(v).toBe((c as any).value);
        break;
      case 'ARRSZ': {
        const exp = parseCsv((c as any).value);
        expect(v).toStrictEqual(exp);
        break;
      }
      case 'ARR8': {
        const exp = parseCsv((c as any).value)
          .map(parseNum)
          .map((x) => (x << 24) >> 24); // to sbyte
        expect(Array.from(v as Int8Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR16': {
        const exp = parseCsv((c as any).value).map(parseNum);
        expect(Array.from(v as Int16Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR32': {
        const exp = parseCsv((c as any).value).map(parseNum);
        expect(Array.from(v as Int32Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR64': {
        const exp = parseCsv((c as any).value).map((x) => BigInt(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRU64': {
        const exp = parseCsv((c as any).value).map((x) => BigInt(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRBYTES-1D': {
        const exp = (c as any).value.toUpperCase();
        const got = byteArrayToHex(v as Uint8Array);
        expect(got.toUpperCase()).toBe(exp.toUpperCase());
        break;
      }
      case 'ARRBYTES-2D': {
        const exp = parseArrBytes2D((c as any).value).map(byteArrayToHex);
        const got = (v as Uint8Array[]).map(byteArrayToHex);
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRBI': {
        const exp = parseCsv((c as any).value).map((x) => parseBI(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'TX1': {
        const expected = c.hex.toUpperCase();

        // Data is copied from C#'s TestDataGenerator:
        const gasFrom = new Bytes32();
        const to = new Bytes32();
        const tokenId = 1n;
        const amount = 100000000n;
        const payload = new SmallString('test-payload');

        const msg = new TxMsg(
          TxTypes.TransferFungible,
          1759711416000n, // expiry
          10000000n, // maxGas
          1000n, // maxData
          gasFrom,
          payload,
          new TxMsgTransferFungible(to, tokenId, amount)
        );

        const w = new CarbonBinaryWriter();
        msg.write(w);

        const hex = Array.from(w.toUint8Array())
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();

        expect(String(hex)).toBe(expected);

        break;
      }
      case 'TX2': {
        const expected = c.hex.toUpperCase();

        var txSender = PhantasmaKeys.fromWIF(
          'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d'
        );
        var txReceiver = PhantasmaKeys.fromWIF(
          'KwVG94yjfVg1YKFyRxAGtug93wdRbmLnqqrFV6Yd2CiA9KZDAp4H'
        );

        // Data is copied from C#'s TestDataGenerator:
        const gasFrom = new Bytes32(txSender.PublicKey);
        const to = new Bytes32(txReceiver.PublicKey);
        const tokenId = 1n;
        const amount = 100000000n;
        const payload = new SmallString('test-payload');

        const msg = new TxMsg(
          TxTypes.TransferFungible,
          1759711416000n, // expiry
          10000000n, // maxGas
          1000n, // maxData
          gasFrom,
          payload,
          new TxMsgTransferFungible(to, tokenId, amount)
        );

        const sig = new Bytes64(
          Ed25519Signature.Generate(txSender, CarbonBlob.Serialize(msg)).Bytes
        );

        const signed = new SignedTxMsg(msg, [new Witness(new Bytes32(txSender.PublicKey), sig)]);

        const w = new CarbonBinaryWriter();
        signed.write(w);

        const hex = Array.from(w.toUint8Array())
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();

        expect(String(hex)).toBe(expected);

        break;
      }
      default:
        throw new Error(`Unhandled kind ${(c as any).kind}`);
    }
  });
});
