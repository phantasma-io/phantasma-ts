import fs from 'fs';
import path from 'path';

import { CarbonBinaryWriter, CarbonBinaryReader } from '../../src/core/types/CarbonSerialization';

import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { SmallString } from '../../src/core/types/Carbon/SmallString';
import { IntX } from '../../src/core/types/Carbon/IntX';
import { TxTypes } from '../../src/core/types/Carbon/TxTypes';

import { TxMsgSigner } from '../../src/core/types/Carbon/Blockchain/Extensions/TxMsgSigner';
import { ModuleId } from '../../src/core/types/Carbon/Blockchain/ModuleId';
import { SignedTxMsg } from '../../src/core/types/Carbon/Blockchain/SignedTxMsg';
import { TokenFlags } from '../../src/core/types/Carbon/Blockchain/TokenFlags';
import { TxMsg } from '../../src/core/types/Carbon/Blockchain/TxMsg';
import { TxMsgCall } from '../../src/core/types/Carbon/Blockchain/TxMsgCall';
import { TxMsgTransferFungible } from '../../src/core/types/Carbon/Blockchain/TxMsgTransferFungible';
import { TxMsgMintNonFungible } from '../../src/core/types/Carbon/Blockchain/TxMsgMintNonFungible';
import { StandardMeta } from '../../src/core/types/Carbon/Blockchain/Modules/StandardMeta';
import { SeriesInfo } from '../../src/core/types/Carbon/Blockchain/Modules/SeriesInfo';
import { TokenContract_Methods } from '../../src/core/types/Carbon/Blockchain/Modules/TokenContract_Methods';
import { TokenInfo } from '../../src/core/types/Carbon/Blockchain/Modules/TokenInfo';
import { TokenSchemas } from '../../src/core/types/Carbon/Blockchain/Modules/TokenSchemas';
import { VmDynamicStruct } from '../../src/core/types/Carbon/Blockchain/Vm/VmDynamicStruct';
import { VmDynamicVariable } from '../../src/core/types/Carbon/Blockchain/Vm/VmDynamicVariable';
import { VmNamedDynamicVariable } from '../../src/core/types/Carbon/Blockchain/Vm/VmNamedDynamicVariable';
import { VmNamedVariableSchema } from '../../src/core/types/Carbon/Blockchain/Vm/VmNamedVariableSchema';
import { VmStructSchema } from '../../src/core/types/Carbon/Blockchain/Vm/VmStructSchema';
import { VmType } from '../../src/core/types/Carbon/Blockchain/Vm/VmType';
import { VmVariableSchema } from '../../src/core/types/Carbon/Blockchain/Vm/VmVariableSchema';

import { PhantasmaKeys } from '../../src/core/types/PhantasmaKeys';
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

function prepareTokenSchemas(): TokenSchemas {
  // seriesMetadata schema
  const seriesSchema = new VmStructSchema();
  seriesSchema.fields = [];
  {
    const f1 = new VmNamedVariableSchema();
    f1.name = StandardMeta.id; // SmallString instance from your codebase
    f1.schema = new VmVariableSchema();
    f1.schema.type = VmType.Int256;
    seriesSchema.fields.push(f1);

    const f2 = new VmNamedVariableSchema();
    f2.name = new SmallString('mode');
    f2.schema = new VmVariableSchema();
    f2.schema.type = VmType.Int8;
    seriesSchema.fields.push(f2);

    const f3 = new VmNamedVariableSchema();
    f3.name = new SmallString('rom');
    f3.schema = new VmVariableSchema();
    f3.schema.type = VmType.Bytes;
    seriesSchema.fields.push(f3);
  }
  seriesSchema.flags = VmStructSchema.Flags.None;

  // rom schema
  const romSchema = new VmStructSchema();
  romSchema.fields = [];
  {
    const f1 = new VmNamedVariableSchema();
    f1.name = StandardMeta.id;
    f1.schema = new VmVariableSchema();
    f1.schema.type = VmType.Int256;
    romSchema.fields.push(f1);

    const f2 = new VmNamedVariableSchema();
    f2.name = new SmallString('rom');
    f2.schema = new VmVariableSchema();
    f2.schema.type = VmType.Bytes;
    romSchema.fields.push(f2);
  }
  romSchema.flags = VmStructSchema.Flags.None;

  // ram schema (dynamic extras)
  const ramSchema = new VmStructSchema();
  ramSchema.fields = [];
  ramSchema.flags = VmStructSchema.Flags.DynamicExtras;

  const tokenSchemas = new TokenSchemas();
  tokenSchemas.seriesMetadata = seriesSchema;
  tokenSchemas.rom = romSchema;
  tokenSchemas.ram = ramSchema;

  return tokenSchemas;
}

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

  VMSTRUCT01: (_c, w) => {},
  VMSTRUCT02: (_c, w) => {},
  TX1: (_c, w) => {},
  TX2: (_c, w) => {},
  'TX-CREATE-TOKEN': (_c, w) => {},
  'TX-CREATE-TOKEN-SERIES': (_c, w) => {},
  'TX-MINT-NON-FUNGIBLE': (_c, w) => {},
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
      case 'VMSTRUCT01': {
        const tokenSchemas = prepareTokenSchemas();

        const schemaBuf = new CarbonBinaryWriter();
        tokenSchemas.write(schemaBuf);

        expect(byteArrayToHex(schemaBuf.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());

        break;
      }
      case 'VMSTRUCT02': {
        const fieldsJson = '{"name": "My test token!", "url": "http://example.com"}';

        // --- Build metadata struct from fieldsJson ---
        const fields: Record<string, string> = JSON.parse(fieldsJson);

        const metaStruct = new VmDynamicStruct();
        metaStruct.fields = [];
        for (const [k, v] of Object.entries(fields)) {
          metaStruct.fields.push(VmNamedDynamicVariable.from(k, VmType.String, v));
        }

        const metadataBufW = new CarbonBinaryWriter();
        // No fixed schema for metadata; write as dynamic struct
        metaStruct.write(metadataBufW);

        expect(byteArrayToHex(metadataBufW.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());

        break;
      }
      case 'TX1': {
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

        expect(byteArrayToHex(w.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());

        break;
      }
      case 'TX2': {
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

        const signed = TxMsgSigner.sign(msg, txSender);

        expect(byteArrayToHex(signed).toUpperCase()).toBe(c.hex.toUpperCase());

        break;
      }
      case 'TX-CREATE-TOKEN': {
        // Input copied from TxCreateToken.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const symbol = 'MYNFT';
        const fieldsJson = '{"name": "My test token!", "url": "http://example.com"}';

        const maxData = 100000000n;
        const gasFeeBase = 10000n;
        const gasFeeCreateTokenBase = 10000000000n;
        const gasFeeCreateTokenSymbol = 10000000000n;

        // Sender keys (your project should already have this)
        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        // --- Build tokenSchemas exactly like PrepareTokenSchemas() ---

        const tokenSchemas = prepareTokenSchemas();

        const schemaBuf = new CarbonBinaryWriter();
        tokenSchemas.write(schemaBuf);

        // --- Build metadata struct from fieldsJson ---
        const fields: Record<string, string> = JSON.parse(fieldsJson);

        const metaStruct = new VmDynamicStruct();
        metaStruct.fields = [];
        for (const [k, v] of Object.entries(fields)) {
          const nv = new VmNamedDynamicVariable();
          nv.name = new SmallString(k);

          const dyn = VmDynamicVariable.fromType(VmType.String);
          dyn.data = v;

          nv.value = dyn;
          metaStruct.fields.push(nv);
        }

        const metadataBufW = new CarbonBinaryWriter();
        // No fixed schema for metadata; write as dynamic struct
        metaStruct.write(metadataBufW);

        // --- Build TokenInfo ---
        const info = new TokenInfo();
        info.maxSupply = IntX.fromI64(0n);
        info.flags = TokenFlags.NonFungible;
        info.decimals = 0;
        info.owner = senderPubKey;
        info.symbol = new SmallString(symbol);
        info.metadata = metadataBufW.toUint8Array(); // Uint8Array
        info.tokenSchemas = schemaBuf.toUint8Array(); // Uint8Array

        const argsW = new CarbonBinaryWriter();
        info.write(argsW);

        // --- Gas calculation (copy of C# logic) ---
        const shift = BigInt(symbol.length - 1);
        const maxGas =
          (gasFeeBase + gasFeeCreateTokenBase + (gasFeeCreateTokenSymbol >> shift)) * 10000n;

        // --- Tx message: Call(Token.CreateToken, args) ---
        const msg = new TxMsg();
        msg.type = TxTypes.Call;
        msg.expiry = 1759711416000n;
        msg.maxGas = maxGas;
        msg.maxData = maxData;
        msg.gasFrom = senderPubKey;
        msg.payload = SmallString.empty;

        const call = new TxMsgCall();
        call.moduleId = ModuleId.Token;
        call.methodId = TokenContract_Methods.CreateToken;
        call.args = argsW.toUint8Array();
        msg.msg = call;

        // --- Serialize and compare ---
        const w = new CarbonBinaryWriter();
        msg.write(w);

        expect(byteArrayToHex(w.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());
        break;
      }
      case 'TX-CREATE-TOKEN-SERIES': {
        // Input copied from TxCreateTokenSeries.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const tokenId = (1n << 64n) - 1n;

        const maxData = 100000000n;
        const gasFeeBase = 10000n;
        const gasFeeCreateTokenSeries = 2500000000n;

        // Sender keys
        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        // --- Build tokenSchemas ---
        let sharedRom = new Uint8Array(0);

        const tokenSchemas = prepareTokenSchemas();

        const metadataBufW = new CarbonBinaryWriter();

        const newPhantasmaSeriesId = (1n << 256n) - 1n;

        let vmDynamicStruct = new VmDynamicStruct();
        vmDynamicStruct.fields = [
          VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, newPhantasmaSeriesId),
          VmNamedDynamicVariable.from('mode', VmType.Int8, sharedRom.length == 0 ? 0 : 1),
          VmNamedDynamicVariable.from('rom', VmType.Bytes, sharedRom),
        ];
        vmDynamicStruct.writeWithSchema(tokenSchemas.seriesMetadata, metadataBufW);

        // --- Build SeriesInfo ---
        const info = new SeriesInfo();
        info.maxMint = 0;
        info.maxSupply = 0;
        info.owner = senderPubKey;
        info.metadata = metadataBufW.toUint8Array(); // Uint8Array
        info.rom = new VmStructSchema();
        info.ram = new VmStructSchema();

        const argsW = new CarbonBinaryWriter();
        argsW.write8(tokenId);
        info.write(argsW);

        // --- Gas calculation (copy of C# logic) ---
        const maxGas = (gasFeeBase + gasFeeCreateTokenSeries) * 10000n;

        // --- Tx message: Call(Token.CreateTokenSeries, args) ---
        const msg = new TxMsg();
        msg.type = TxTypes.Call;
        msg.expiry = 1759711416000n;
        msg.maxGas = maxGas;
        msg.maxData = maxData;
        msg.gasFrom = senderPubKey;
        msg.payload = SmallString.empty;

        const call = new TxMsgCall();
        call.moduleId = ModuleId.Token;
        call.methodId = TokenContract_Methods.CreateTokenSeries;
        call.args = argsW.toUint8Array();
        msg.msg = call;

        // --- Serialize and compare ---
        const w = new CarbonBinaryWriter();
        msg.write(w);

        expect(byteArrayToHex(w.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());
        break;
      }
      case 'TX-MINT-NON-FUNGIBLE': {
        // Input copied from TxMintNonFungible.cs
        const wif = 'KwPpBSByydVKqStGHAnZzQofCqhDmD2bfRgc9BmZqM3ZmsdWJw4d';
        const carbonTokenId = (1n << 64n) - 1n;
        const carbonSeriesId = 0xffffffff;

        const maxData = 100000000n;
        const gasFeeBase = 10000n;

        // Sender keys (your project should already have this)
        const txSender = PhantasmaKeys.fromWIF(wif);
        const senderPubKey = new Bytes32(txSender.PublicKey);

        // --- Build tokenSchemas exactly like PrepareTokenSchemas() ---

        let sharedRom = new Uint8Array(0);

        const tokenSchemas = prepareTokenSchemas();

        const wRom = new CarbonBinaryWriter();

        const phantasmaId = (1n << 256n) - 1n;
        const phantasmaRomData = new Uint8Array([0x01, 0x42]);

        let vmDynamicStruct = new VmDynamicStruct();
        vmDynamicStruct.fields = [
          VmNamedDynamicVariable.from(StandardMeta.id, VmType.Int256, phantasmaId),
          VmNamedDynamicVariable.from('rom', VmType.Bytes, phantasmaRomData),
        ];
        vmDynamicStruct.writeWithSchema(tokenSchemas.rom, wRom);

        // --- Gas calculation (copy of C# logic) ---
        const maxGas = gasFeeBase * 1000n;

        // --- Tx message ---
        const msg = new TxMsg();
        msg.type = TxTypes.MintNonFungible;
        msg.expiry = 1759711416000n;
        msg.maxGas = maxGas;
        msg.maxData = maxData;
        msg.gasFrom = senderPubKey;
        msg.payload = SmallString.empty;

        let mint = new TxMsgMintNonFungible();
        mint.tokenId = carbonTokenId;
        mint.seriesId = carbonSeriesId;
        mint.to = new Bytes32(txSender.PublicKey);
        mint.rom = wRom.toUint8Array();
        mint.ram = new Uint8Array(0);

        msg.msg = mint;

        // --- Serialize and compare ---
        const w = new CarbonBinaryWriter();
        msg.write(w);

        expect(byteArrayToHex(w.toUint8Array()).toUpperCase()).toBe(c.hex.toUpperCase());
        break;
      }
    }
  });
});
