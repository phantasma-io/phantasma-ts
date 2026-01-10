import fs from 'fs';
import path from 'path';

import { CarbonBinaryWriter, CarbonBinaryReader } from '../../src/core/types/CarbonSerialization';

import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { IntX } from '../../src/core/types/Carbon/IntX';
import { TxTypes } from '../../src/core/types/Carbon/TxTypes';

import { CarbonTokenFlags } from '../../src/core/types/Carbon/Blockchain/CarbonTokenFlags';
import {
  MsgCallArgSections,
  TxMsgCall,
  SignedTxMsg,
  TxMsg,
  TxMsgMintNonFungible,
  TxMsgTransferFungible,
} from '../../src/core/types/Carbon/Blockchain';
import {
  TokenMetadataBuilder,
  TokenSchemasBuilder,
} from '../../src/core/types/Carbon/Blockchain/Modules/Builders';
import {
  SeriesInfo,
  StandardMeta,
  TokenContract_Methods,
  TokenInfo,
  TokenSchemas,
} from '../../src/core/types/Carbon/Blockchain/Modules';
import {
  CreateSeriesFeeOptions,
  CreateTokenFeeOptions,
  MintNftFeeOptions,
} from '../../src/core/types/Carbon/Blockchain/TxHelpers';
import {
  VmDynamicStruct,
  VmNamedDynamicVariable,
  VmStructSchema,
  VmType,
} from '../../src/core/types/Carbon/Blockchain/Vm';
import { ModuleId } from '../../src/core/types/Carbon/Blockchain/ModuleId';
import { PhantasmaKeys } from '../../src/core/types/PhantasmaKeys';
import { bytesToHex, hexToBytes } from '../../src/core/utils';

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
  | 'VMSTRUCT01'
  | 'VMSTRUCT02'
  | 'TX1'
  | 'TX2'
  | 'TX-CREATE-TOKEN'
  | 'TX-CREATE-TOKEN-SERIES'
  | 'TX-MINT-NON-FUNGIBLE';

type Row =
  | { kind: Exclude<Kind, 'BI' | 'INTX'>; value: string; hex: string }
  | { kind: 'BI' | 'INTX'; value: string; hex: string; decOrig: string; decBack: string };

const FIXTURE = path.join(process.cwd(), 'tests', 'fixtures', 'carbon_vectors.tsv');
const SAMPLE_PNG_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const SAMPLE_WEBP_ICON_DATA_URI = 'data:image/webp;base64,UklGRg==';
const SAMPLE_SVG_ICON_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCc+PHBhdGggZmlsbD0nI0Y0NDMzNicgZD0nTTcgNGg1YTUgNSAwIDAxMCAxMEg5djZIN3pNOSA2djZoM2EzIDMgMCAwMDAtNnonLz48L3N2Zz4=';

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
    return hexToBytes(flat);
  });
};

const encodeBlobHex = (blob: { write: (w: CarbonBinaryWriter) => void }): string => {
  const w = new CarbonBinaryWriter();
  blob.write(w);
  return bytesToHex(w.toUint8Array());
};

const expectReencodedHex = (blob: { write: (w: CarbonBinaryWriter) => void }, expectedHex: string): void => {
  expect(encodeBlobHex(blob).toUpperCase()).toBe(expectedHex.toUpperCase());
};

const readDynamicStruct = (bytes: Uint8Array, schema?: VmStructSchema): VmDynamicStruct => {
  const r = new CarbonBinaryReader(bytes);
  const s = new VmDynamicStruct();
  if (schema) {
    s.readWithSchema(schema, r);
  } else {
    s.read(r);
  }
  return s;
};

const getStructField = (struct: VmDynamicStruct, name: string): VmNamedDynamicVariable => {
  const found = struct.fields.find((f) => f.name.data === name);
  if (!found) {
    throw new Error(`Missing struct field '${name}'`);
  }
  return found;
};

const expectStructString = (struct: VmDynamicStruct, name: string, expected: string): void => {
  const field = getStructField(struct, name);
  expect(field.value.type).toBe(VmType.String);
  expect(field.value.data).toBe(expected);
};

const expectStructBytes = (struct: VmDynamicStruct, name: string, expected: Uint8Array): void => {
  const field = getStructField(struct, name);
  expect(field.value.type).toBe(VmType.Bytes);
  expect(bytesToHex(field.value.data as Uint8Array).toUpperCase()).toBe(bytesToHex(expected).toUpperCase());
};

const expectStructInt256 = (struct: VmDynamicStruct, name: string, expected: bigint): void => {
  const field = getStructField(struct, name);
  expect(field.value.type).toBe(VmType.Int256);
  expect(field.value.data as bigint).toBe(expected);
};

const expectStructInt8 = (struct: VmDynamicStruct, name: string, expected: number): void => {
  const field = getStructField(struct, name);
  expect(field.value.type).toBe(VmType.Int8);
  expect(field.value.data as number).toBe(expected);
};

const expectStructInt32 = (struct: VmDynamicStruct, name: string, expected: number): void => {
  const field = getStructField(struct, name);
  expect(field.value.type).toBe(VmType.Int32);
  expect(field.value.data as number).toBe(expected);
};

const expectSchemaMatches = (actual: VmStructSchema, expected: VmStructSchema): void => {
  expect(actual.fields.map((f) => f.name.data)).toStrictEqual(expected.fields.map((f) => f.name.data));
  expect(actual.fields.map((f) => f.schema.type)).toStrictEqual(expected.fields.map((f) => f.schema.type));
  expect(actual.flags).toBe(expected.flags);
};

const expectStandardTokenSchemas = (schemas: TokenSchemas): void => {
  const expected = TokenSchemasBuilder.prepareStandard(false);
  expectSchemaMatches(schemas.seriesMetadata, expected.seriesMetadata);
  expectSchemaMatches(schemas.rom, expected.rom);
  expectSchemaMatches(schemas.ram, expected.ram);
};

const toSignedInt256 = (value: bigint): bigint => {
  const mask = (1n << 256n) - 1n;
  const signBit = 1n << 255n;
  const v = value & mask;
  return (v & signBit) === 0n ? v : v - (1n << 256n);
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

  FIX16: (c, w) => w.write16(hexToBytes(c.value)),
  FIX32: (c, w) => w.write32(hexToBytes(c.value)),
  FIX64: (c, w) => w.write64(hexToBytes(c.value)),

  SZ: (c, w) => w.writeSz(c.value),
  ARRSZ: (c, w) => w.writeArraySz(parseCsv(c.value)),

  ARR8: (c, w) => w.writeArray8(parseCsv(c.value).map((x) => parseNum(x) as unknown as number)),
  ARR16: (c, w) => w.writeArray16(parseCsv(c.value).map((x) => parseNum(x))),
  ARR32: (c, w) => w.writeArray32(parseCsv(c.value).map((x) => parseNum(x))),
  ARR64: (c, w) => w.writeArray64(parseCsv(c.value).map((x) => BigInt(x))),
  ARRU64: (c, w) => w.writeArray64u(parseCsv(c.value).map((x) => BigInt(x))),

  'ARRBYTES-1D': (c, w) => w.writeArray(hexToBytes(c.value)),
  'ARRBYTES-2D': (c, w) => w.writeArrayOfArrays(parseArrBytes2D(c.value)),

  BI: (c, w) => w.writeBigInt(parseBI(c.value)),

  INTX: (c, w) => IntX.fromBigInt(BigInt(c.value)).write(w),

  ARRBI: (c, w) => {
    const items = parseCsv(c.value).map(parseBI);
    w.writeArrayBigInt(items);
  },

  /* eslint-disable @typescript-eslint/no-unused-vars */
  VMSTRUCT01: (_c, w) => {},
  VMSTRUCT02: (_c, w) => {},
  TX1: (_c, w) => {},
  TX2: (_c, w) => {},
  'TX-CREATE-TOKEN': (_c, w) => {},
  'TX-CREATE-TOKEN-SERIES': (_c, w) => {},
  'TX-MINT-NON-FUNGIBLE': (_c, w) => {},
  /* eslint-enable @typescript-eslint/no-unused-vars */
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
  ARRU64: (_c, r) => r.readArray64u(),

  'ARRBYTES-1D': (_c, r) => r.readArray(),
  'ARRBYTES-2D': (_c, r) => r.readArrayOfArrays(),

  BI: (_c, r) => r.readBigInt(),
  INTX: (_c, r) => IntX.read(r),
  ARRBI: (_c, r) => r.readArrayBigInt(),

  VMSTRUCT01: (_c, r) => TokenSchemas.read(r),
  VMSTRUCT02: (_c, r) => VmDynamicStruct.read(r),
  TX1: (_c, r) => TxMsg.read(r),
  TX2: (_c, r) => SignedTxMsg.read(r),
  'TX-CREATE-TOKEN': (_c, r) => TxMsg.read(r),
  'TX-CREATE-TOKEN-SERIES': (_c, r) => TxMsg.read(r),
  'TX-MINT-NON-FUNGIBLE': (_c, r) => TxMsg.read(r),
};

// ---------- load fixture ----------

const rows: Row[] = parseFixture(fs.readFileSync(FIXTURE, 'utf8'));

// ---------- tests ----------

describe('TokenMetadataBuilder icon validation', () => {
  const baseFields = Object.freeze({
    name: 'My test token!',
    icon: SAMPLE_PNG_ICON_DATA_URI,
    url: 'http://example.com',
    description: 'My test token description',
  });

  const buildFields = (overrides: Partial<Record<string, string>> = {}) => ({
    ...baseFields,
    ...overrides,
  });

  it('accepts data URIs with base64-encoded PNG payloads', () => {
    expect(() => TokenMetadataBuilder.buildAndSerialize(buildFields())).not.toThrow();
  });

  it('accepts JPEG data URIs with base64 payloads', () => {
    const jpegPayload = Buffer.from([0xff, 0xd8, 0xff]).toString('base64');
    const jpegIcon = `data:image/jpeg;base64,${jpegPayload}`;
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: jpegIcon,
        })
      )
    ).not.toThrow();
  });

  it('accepts WebP data URIs with base64 payloads', () => {
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: SAMPLE_WEBP_ICON_DATA_URI,
        })
      )
    ).not.toThrow();
  });

  it('rejects data URIs with base64-encoded SVG payloads', () => {
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: SAMPLE_SVG_ICON_DATA_URI,
        })
      )
    ).toThrow('Token metadata icon must be a base64-encoded data URI (PNG, JPEG, or WebP)');
  });

  it('rejects icons missing the base64 flag', () => {
    const legacySvgUri =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23F44336' d='M7 4h5a5 5 0 010 10H9v6H7zM9 6v6h3a3 3 0 000-6z'/%3E%3C/svg%3E";
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: legacySvgUri,
        })
      )
    ).toThrow('Token metadata icon must be a base64-encoded data URI (PNG, JPEG, or WebP)');
  });

  it('rejects icons with unsupported mime types', () => {
    const gifIcon = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: gifIcon,
        })
      )
    ).toThrow('Token metadata icon must be a base64-encoded data URI (PNG, JPEG, or WebP)');
  });

  it('rejects icons with empty base64 payload', () => {
    const emptyPayload = 'data:image/png;base64,';
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: emptyPayload,
        })
      )
    ).toThrow('Token metadata icon must include a non-empty base64 payload');
  });

  it('rejects icons with invalid base64 payload', () => {
    const invalidPayload = 'data:image/jpeg;base64,@@@';
    expect(() =>
      TokenMetadataBuilder.buildAndSerialize(
        buildFields({
          icon: invalidPayload,
        })
      )
    ).toThrow('Token metadata icon payload is not valid base64');
  });
});

describe('TxMsgCall arg-sections', () => {
  const expectedHex = '0100000002000000FEFFFFFFFFFFFFFF020000000A0B';

  it('encodes arg-sections format', () => {
    const call = new TxMsgCall(1, 2);
    call.sections = new MsgCallArgSections([
      { registerOffset: -1, args: new Uint8Array() },
      { registerOffset: 0, args: hexToBytes('0A0B') },
    ]);

    const w = new CarbonBinaryWriter();
    call.write(w);

    const got = bytesToHex(w.toUint8Array()).toUpperCase();
    expect(got).toBe(expectedHex);
  });

  it('decodes arg-sections format', () => {
    const r = new CarbonBinaryReader(hexToBytes(expectedHex));
    const decoded = TxMsgCall.read(r);

    expect(decoded.moduleId).toBe(1);
    expect(decoded.methodId).toBe(2);
    expect(decoded.sections).not.toBeNull();
    expect(decoded.sections!.argSections.length).toBe(2);
    expect(decoded.sections!.argSections[0].registerOffset).toBe(-1);
    expect(decoded.sections!.argSections[0].args.length).toBe(0);
    expect(decoded.sections!.argSections[1].registerOffset).toBe(0);
    expect(bytesToHex(decoded.sections!.argSections[1].args).toUpperCase()).toBe('0A0B');
  });
});

describe('CarbonSerialization.ts ↔ C# fixtures (encode)', () => {
  test.each(rows.map((r, i) => [i, r]))('encode line #%d: %s', (_i, c) => {
    if (
      c.kind === 'VMSTRUCT01' ||
      c.kind === 'VMSTRUCT02' ||
      c.kind === 'TX1' ||
      c.kind === 'TX2' ||
      c.kind === 'TX-CREATE-TOKEN' ||
      c.kind === 'TX-CREATE-TOKEN-SERIES' ||
      c.kind === 'TX-MINT-NON-FUNGIBLE'
    )
      return;
    const enc = encoders[c.kind];
    expect(enc).toBeDefined();
    const w = new CarbonBinaryWriter();
    enc!(c as Row, w);
    const got = bytesToHex(w.toUint8Array());
    expect(got.toUpperCase()).toBe(c.hex.toUpperCase());
  });
});

describe('CarbonSerialization.ts ↔ C# fixtures (decode)', () => {
  test.each(rows.map((r, i) => [i, r]))('decode line #%d: %s', (_i, c) => {
    const r = new CarbonBinaryReader(hexToBytes(c.hex));
    const dec = decoders[c.kind];
    expect(dec).toBeDefined();
    const v = dec!(c as Row, r);

    switch (c.kind) {
      case 'U8':
      case 'I16':
      case 'I32':
      case 'U32':
        expect(String(v)).toBe(String(parseNum((c as Row).value)));
        break;
      case 'I64':
      case 'U64':
      case 'BI':
        if ('decBack' in c && c.decBack) {
          expect(String(v)).toBe(parseBI(c.decBack).toString());
        } else {
          expect(String(v)).toBe(parseBI((c as Row).value).toString());
        }
        break;
      case 'INTX':
        if ('decBack' in c && c.decBack) {
          expect(String(v)).toBe(parseIntX(c.decBack).toString());
        } else {
          expect(String(v)).toBe(parseIntX((c as Row).value).toString());
        }
        break;
      case 'FIX16':
      case 'FIX32':
      case 'FIX64': {
        const expected = (c as Row).value.toUpperCase();
        const actual = bytesToHex(v as Uint8Array);
        expect(actual.toUpperCase()).toBe(expected.toUpperCase());
        break;
      }
      case 'SZ':
        expect(v).toBe((c as Row).value);
        break;
      case 'ARRSZ': {
        const exp = parseCsv((c as Row).value);
        expect(v).toStrictEqual(exp);
        break;
      }
      case 'ARR8': {
        const exp = parseCsv((c as Row).value)
          .map(parseNum)
          .map((x) => (x << 24) >> 24); // to sbyte
        expect(Array.from(v as Int8Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR16': {
        const exp = parseCsv((c as Row).value).map(parseNum);
        expect(Array.from(v as Int16Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR32': {
        const exp = parseCsv((c as Row).value).map(parseNum);
        expect(Array.from(v as Int32Array | number[])).toStrictEqual(exp);
        break;
      }
      case 'ARR64': {
        const exp = parseCsv((c as Row).value).map((x) => BigInt(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRU64': {
        const exp = parseCsv((c as Row).value).map((x) => BigInt(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRBYTES-1D': {
        const exp = (c as Row).value.toUpperCase();
        const got = bytesToHex(v as Uint8Array);
        expect(got.toUpperCase()).toBe(exp.toUpperCase());
        break;
      }
      case 'ARRBYTES-2D': {
        const exp = parseArrBytes2D((c as Row).value).map(bytesToHex);
        const got = (v as Uint8Array[]).map(bytesToHex);
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'ARRBI': {
        const exp = parseCsv((c as Row).value).map((x) => parseBI(x).toString());
        const got = (v as bigint[]).map((x) => x.toString());
        expect(got).toStrictEqual(exp);
        break;
      }
      case 'VMSTRUCT01': {
        const decoded = v as TokenSchemas;
        expectStandardTokenSchemas(decoded);
        expectReencodedHex(decoded, c.hex);
        break;
      }
      case 'VMSTRUCT02': {
        const decoded = v as VmDynamicStruct;
        expect(decoded.fields.length).toBe(4);
        expectStructString(decoded, 'name', 'My test token!');
        expectStructString(decoded, 'icon', SAMPLE_PNG_ICON_DATA_URI);
        expectStructString(decoded, 'url', 'http://example.com');
        expectStructString(decoded, 'description', 'My test token description');
        expectReencodedHex(decoded, c.hex);

        break;
      }
      case 'TX1': {
        const decoded = v as TxMsg;
        expect(decoded.type).toBe(TxTypes.TransferFungible);
        expect(decoded.expiry).toBe(1759711416000n);
        expect(decoded.maxGas).toBe(10000000n);
        expect(decoded.maxData).toBe(1000n);
        expect(decoded.gasFrom.equals(Bytes32.Empty)).toBe(true);
        expect(decoded.payload.data).toBe('test-payload');

        const msg = decoded.msg as TxMsgTransferFungible;
        expect(msg.tokenId).toBe(1n);
        expect(msg.amount).toBe(100000000n);
        expect(msg.to.equals(Bytes32.Empty)).toBe(true);

        expectReencodedHex(decoded, c.hex);

        break;
      }
      case 'TX2': {
        const txSender = PhantasmaKeys.fromWIF(
          'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d'
        );
        const txReceiver = PhantasmaKeys.fromWIF(
          'KwVG94yjfVg1YKFyRxAGtug93wdRbmLnqqrFV6Yd2CiA9KZDAp4H'
        );
        const senderPub = new Bytes32(txSender.PublicKey);
        const receiverPub = new Bytes32(txReceiver.PublicKey);

        const decoded = v as SignedTxMsg;
        expect(decoded.msg).toBeDefined();
        const msg = decoded.msg!;
        expect(msg.type).toBe(TxTypes.TransferFungible);
        expect(msg.expiry).toBe(1759711416000n);
        expect(msg.maxGas).toBe(10000000n);
        expect(msg.maxData).toBe(1000n);
        expect(msg.gasFrom.equals(senderPub)).toBe(true);
        expect(msg.payload.data).toBe('test-payload');

        const payload = msg.msg as TxMsgTransferFungible;
        expect(payload.tokenId).toBe(1n);
        expect(payload.amount).toBe(100000000n);
        expect(payload.to.equals(receiverPub)).toBe(true);

        expect(decoded.witnesses?.length).toBe(1);
        expect(decoded.witnesses![0].address.equals(senderPub)).toBe(true);
        expect(decoded.witnesses![0].signature?.bytes.length).toBe(64);

        expectReencodedHex(decoded, c.hex);

        break;
      }
      case 'TX-CREATE-TOKEN': {
        // Input copied from TxCreateToken.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const symbol = 'MYNFT';
        const sampleIcon = SAMPLE_PNG_ICON_DATA_URI;

        const maxData = 100000000n;
        const gasFeeBase = 10000n;
        const gasFeeCreateTokenBase = 10000000000n;
        const gasFeeCreateTokenSymbol = 10000000000n;
        const feeMultiplier = 10000n;

        // Sender keys (your project should already have this)
        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        const feeOptions = new CreateTokenFeeOptions(
          gasFeeBase,
          gasFeeCreateTokenBase,
          gasFeeCreateTokenSymbol,
          feeMultiplier
        );

        const decoded = v as TxMsg;
        expect(decoded.type).toBe(TxTypes.Call);
        expect(decoded.expiry).toBe(1759711416000n);
        expect(decoded.maxData).toBe(maxData);
        expect(decoded.gasFrom.equals(senderPubKey)).toBe(true);
        expect(decoded.payload.data).toBe('');

        const call = decoded.msg as TxMsgCall;
        expect(call.moduleId).toBe(ModuleId.Token);
        expect(call.methodId).toBe(TokenContract_Methods.CreateToken);
        expect(call.args.length).toBeGreaterThan(0);

        const argsReader = new CarbonBinaryReader(call.args);
        const tokenInfo = TokenInfo.read(argsReader);
        expect(tokenInfo.symbol.data).toBe(symbol);
        expect(tokenInfo.decimals).toBe(0);
        expect(tokenInfo.flags).toBe(CarbonTokenFlags.NonFungible);
        expect(tokenInfo.owner.equals(senderPubKey)).toBe(true);
        expect(tokenInfo.maxSupply.toString()).toBe('0');

        const metadataStruct = readDynamicStruct(tokenInfo.metadata);
        expect(metadataStruct.fields.length).toBe(4);
        expectStructString(metadataStruct, 'name', 'My test token!');
        expectStructString(metadataStruct, 'icon', sampleIcon);
        expectStructString(metadataStruct, 'url', 'http://example.com');
        expectStructString(metadataStruct, 'description', 'My test token description');

        expect(tokenInfo.tokenSchemas).toBeDefined();
        const schemas = TokenSchemas.read(new CarbonBinaryReader(tokenInfo.tokenSchemas!));
        expectStandardTokenSchemas(schemas);

        const expectedMaxGas = feeOptions.calculateMaxGas(tokenInfo.symbol);
        expect(decoded.maxGas).toBe(expectedMaxGas);

        expectReencodedHex(decoded, c.hex);
        break;
      }
      case 'TX-CREATE-TOKEN-SERIES': {
        // Input copied from TxCreateTokenSeries.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const tokenId = (1n << 64n) - 1n;

        const maxData = 100000000n;
        const gasFeeBase = 10000n;
        const gasFeeCreateTokenSeries = 2500000000n;
        const feeMultiplier = 10000n;

        // Sender keys
        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        const newPhantasmaSeriesId = (1n << 256n) - 1n;

        const feeOptions = new CreateSeriesFeeOptions(
          gasFeeBase,
          gasFeeCreateTokenSeries,
          feeMultiplier
        );

        const decoded = v as TxMsg;
        expect(decoded.type).toBe(TxTypes.Call);
        expect(decoded.expiry).toBe(1759711416000n);
        expect(decoded.maxData).toBe(maxData);
        expect(decoded.gasFrom.equals(senderPubKey)).toBe(true);
        expect(decoded.payload.data).toBe('');

        const call = decoded.msg as TxMsgCall;
        expect(call.moduleId).toBe(ModuleId.Token);
        expect(call.methodId).toBe(TokenContract_Methods.CreateTokenSeries);

        const argsReader = new CarbonBinaryReader(call.args);
        const decodedTokenId = argsReader.read8u();
        expect(decodedTokenId).toBe(tokenId);

        const seriesInfo = SeriesInfo.read(argsReader);
        expect(seriesInfo.maxMint).toBe(0);
        expect(seriesInfo.maxSupply).toBe(0);
        expect(seriesInfo.owner.equals(senderPubKey)).toBe(true);
        expect(seriesInfo.rom.fields.length).toBe(0);
        expect(seriesInfo.ram.fields.length).toBe(0);

        const seriesSchema = TokenSchemasBuilder.prepareStandard(false).seriesMetadata;
        const seriesMeta = readDynamicStruct(seriesInfo.metadata, seriesSchema);
        expect(seriesMeta.fields.length).toBe(3);
        expectStructInt256(seriesMeta, StandardMeta.id.data, toSignedInt256(newPhantasmaSeriesId));
        expectStructInt8(seriesMeta, 'mode', 0);
        expectStructBytes(seriesMeta, 'rom', new Uint8Array());

        const expectedMaxGas = feeOptions.calculateMaxGas();
        expect(decoded.maxGas).toBe(expectedMaxGas);

        expectReencodedHex(decoded, c.hex);
        break;
      }
      case 'TX-MINT-NON-FUNGIBLE': {
        // Input copied from TxMintNonFungible.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const carbonTokenId = (1n << 64n) - 1n;
        const carbonSeriesId = 0xffffffff;

        const maxData = 100000000n;
        const gasFeeBase = 10000n;
        const feeMultiplier = 1000n;

        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        const phantasmaNftId = (1n << 256n) - 1n;
        const phantasmaRomData = new Uint8Array([0x01, 0x42]);

        const feeOptions = new MintNftFeeOptions(gasFeeBase, feeMultiplier);

        const decoded = v as TxMsg;
        expect(decoded.type).toBe(TxTypes.MintNonFungible);
        expect(decoded.expiry).toBe(1759711416000n);
        expect(decoded.maxData).toBe(maxData);
        expect(decoded.gasFrom.equals(senderPubKey)).toBe(true);
        expect(decoded.payload.data).toBe('');

        const mint = decoded.msg as TxMsgMintNonFungible;
        expect(mint.tokenId).toBe(carbonTokenId);
        expect(mint.seriesId).toBe(carbonSeriesId);
        expect(mint.to.equals(senderPubKey)).toBe(true);
        expect(mint.ram.length).toBe(0);

        const nftSchema = TokenSchemasBuilder.prepareStandard(false).rom;
        const romStruct = readDynamicStruct(mint.rom, nftSchema);
        expectStructInt256(romStruct, StandardMeta.id.data, toSignedInt256(phantasmaNftId));
        expectStructBytes(romStruct, 'rom', phantasmaRomData);
        expectStructString(romStruct, 'name', 'My NFT #1');
        expectStructString(romStruct, 'description', 'This is my first NFT!');
        expectStructString(romStruct, 'imageURL', 'images-assets.nasa.gov/image/PIA13227/PIA13227~orig.jpg');
        expectStructString(romStruct, 'infoURL', 'https://images.nasa.gov/details/PIA13227');
        expectStructInt32(romStruct, 'royalties', 10000000);

        const expectedMaxGas = feeOptions.calculateMaxGas();
        expect(decoded.maxGas).toBe(expectedMaxGas);

        expectReencodedHex(decoded, c.hex);
        break;
      }
    }
  });
});
