import fs from 'fs';
import path from 'path';

import { CarbonBinaryReader, CarbonBinaryWriter } from '../../src/core/types/CarbonSerialization';
import { IntX } from '../../src/core/types/Carbon/IntX';
import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { SmallString } from '../../src/core/types/Carbon/SmallString';
import { bytesToHex, hexToBytes } from '../../src/core/utils';
import { TokenInfo } from '../../src/core/types/Carbon/Blockchain/Modules/TokenInfo';
import { SeriesInfo } from '../../src/core/types/Carbon/Blockchain/Modules/SeriesInfo';
import { CarbonTokenFlags } from '../../src/core/types/Carbon/Blockchain/CarbonTokenFlags';
import { VmDynamicStruct } from '../../src/core/types/Carbon/Blockchain/Vm/VmDynamicStruct';
import { VmDynamicVariable } from '../../src/core/types/Carbon/Blockchain/Vm/VmDynamicVariable';
import { VmNamedDynamicVariable } from '../../src/core/types/Carbon/Blockchain/Vm/VmNamedDynamicVariable';
import { VmStructSchema } from '../../src/core/types/Carbon/Blockchain/Vm/VmStructSchema';
import { VmType } from '../../src/core/types/Carbon/Blockchain/Vm/VmType';

type ValidatorFixtureBundle = {
  int256: Int256Fixture[];
  intx: IntXFixture[];
  vmDynamicInt256: VmDynamicInt256Fixture[];
  vmDynamicInt256Array: VmDynamicInt256ArrayFixture[];
  metadataStructs: MetadataStructFixture[];
  tokenInfo: TokenInfoFixture[];
  seriesInfo: SeriesInfoFixture[];
};

type Int256Fixture = {
  id: string;
  sourceDec: string;
  readBackSignedDec: string;
  wireHex: string;
};

type IntXFixture = {
  id: string;
  sourceDec: string;
  readBackDec: string;
  wireHex: string;
};

type VmDynamicInt256Fixture = {
  id: string;
  sourceDec: string;
  wireHex: string;
};

type VmDynamicInt256ArrayFixture = {
  id: string;
  values: string[];
  wireHex: string;
};

type MetadataStructFixture = {
  id: string;
  shape: 'nft-default' | 'series-default';
  _iDec: string;
  mode?: number;
  romHex: string;
  wireHex: string;
};

type TokenInfoFixture = {
  id: string;
  maxSupplyDec: string;
  flags: number;
  decimals: number;
  symbol: string;
  metadataHex: string;
  wireHex: string;
};

type SeriesInfoFixture = {
  id: string;
  maxMint: number;
  maxSupply: number;
  metadataHex: string;
  wireHex: string;
};

const FIXTURE_PATH = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'validator_int256_fixtures.json'
);
const FIXTURES = loadFixtures();
const INT256_READBACK = new Map(
  FIXTURES.int256.map((fixture) => [fixture.sourceDec, fixture.readBackSignedDec])
);

// These tests are the validator/runtime authority for Carbon Int256 semantics.
// They intentionally do not accept SDK-self-consistency as proof of correctness.
describe('Validator Int256 parity', () => {
  // Raw Int256 fixtures pin the primitive wire contract every higher-level Carbon serializer depends on.
  describe('raw Int256', () => {
    it.each(FIXTURES.int256)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeBigInt(fixture.sourceDec)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.int256)('decodes %s exactly like the validator', (fixture) => {
      expect(deserializeBigInt(fixture.wireHex)).toBe(fixture.readBackSignedDec);
    });
  });

  // IntX keeps its own 8-byte fast path, so the boundary between int64 and wider values must be locked down.
  describe('IntX', () => {
    it.each(FIXTURES.intx)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeIntX(fixture.sourceDec)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.intx)('decodes %s exactly like the validator', (fixture) => {
      expect(deserializeIntX(fixture.wireHex)).toBe(fixture.readBackDec);
    });
  });

  // VmDynamicVariable(Int256) is the direct storage/RPC-facing wrapper that originally exposed the mismatch.
  describe('VmDynamicVariable(Int256)', () => {
    it.each(FIXTURES.vmDynamicInt256)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeVmInt256(fixture.sourceDec)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.vmDynamicInt256)('decodes %s exactly like the validator', (fixture) => {
      expect(deserializeVmInt256(fixture.wireHex)).toBe(expectedInt256ReadBack(fixture.sourceDec));
    });
  });

  // Array coverage ensures scalar fixes do not silently diverge once Int256 values are framed in collections.
  describe('VmDynamicVariable(Array<Int256>)', () => {
    it.each(FIXTURES.vmDynamicInt256Array)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeVmInt256Array(fixture.values)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.vmDynamicInt256Array)('decodes %s exactly like the validator', (fixture) => {
      expect(deserializeVmInt256Array(fixture.wireHex)).toStrictEqual(
        fixture.values.map((value) => expectedInt256ReadBack(value))
      );
    });
  });

  // Metadata structs protect the nested `_i` shape that legacy/current NFT and series metadata depend on.
  describe('metadata structs', () => {
    it.each(FIXTURES.metadataStructs)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeMetadataStruct(fixture)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.metadataStructs)(
      'decodes %s with the expected deterministic field layout',
      (fixture) => {
        const decoded = deserializeMetadataStruct(fixture.wireHex);
        const fieldNames = decoded.fields.map((field) => field.name.data);

        if (fixture.shape === 'nft-default') {
          expect(fieldNames).toStrictEqual(['_i', 'rom']);
        } else {
          expect(fieldNames).toStrictEqual(['_i', 'mode', 'rom']);
        }

        const idField = getStructField(decoded, '_i');
        expect(idField.value.type).toBe(VmType.Int256);
        expect(String(idField.value.data)).toBe(fixture._iDec);

        const romField = getStructField(decoded, 'rom');
        expect(romField.value.type).toBe(VmType.Bytes);
        expect(bytesToHex(romField.value.data as Uint8Array).toUpperCase()).toBe(
          fixture.romHex.toUpperCase()
        );

        if (fixture.mode !== undefined) {
          const modeField = getStructField(decoded, 'mode');
          expect(modeField.value.type).toBe(VmType.Int8);
          expect(modeField.value.data).toBe(fixture.mode);
        }
      }
    );
  });

  // TokenInfo proves that IntX and metadata bytes still compose correctly inside real protocol objects.
  describe('TokenInfo', () => {
    it.each(FIXTURES.tokenInfo)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeTokenInfo(fixture)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.tokenInfo)(
      'decodes %s with the expected deterministic field values',
      (fixture) => {
        const decoded = deserializeTokenInfo(fixture.wireHex);

        expect(decoded.maxSupply.toString()).toBe(fixture.maxSupplyDec);
        expect(decoded.flags).toBe(fixture.flags);
        expect(decoded.decimals).toBe(fixture.decimals);
        expect(decoded.owner.equals(expectedTokenOwner(fixture.id))).toBe(true);
        expect(decoded.symbol.data).toBe(fixture.symbol);
        expect(bytesToHex(decoded.metadata).toUpperCase()).toBe(fixture.metadataHex.toUpperCase());
      }
    );
  });

  // SeriesInfo covers the last higher-level protocol object that still transports canonical `_i` metadata bytes.
  describe('SeriesInfo', () => {
    it.each(FIXTURES.seriesInfo)('encodes %s exactly like the validator', (fixture) => {
      expect(serializeSeriesInfo(fixture)).toBe(fixture.wireHex);
    });

    it.each(FIXTURES.seriesInfo)(
      'decodes %s with the expected deterministic field values',
      (fixture) => {
        const decoded = deserializeSeriesInfo(fixture.wireHex);

        expect(decoded.maxMint).toBe(fixture.maxMint);
        expect(decoded.maxSupply).toBe(fixture.maxSupply);
        expect(decoded.owner.equals(expectedSeriesOwner(fixture.id))).toBe(true);
        expect(bytesToHex(decoded.metadata).toUpperCase()).toBe(fixture.metadataHex.toUpperCase());
        expect(decoded.rom.fields).toHaveLength(0);
        expect(decoded.ram.fields).toHaveLength(0);

        const metadata = deserializeMetadataStruct(bytesToHex(decoded.metadata));
        const idField = getStructField(metadata, '_i');
        expect(String(idField.value.data)).toBe(expectedSeriesMetadataId(fixture.id));
      }
    );
  });
});

function loadFixtures(): ValidatorFixtureBundle {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as ValidatorFixtureBundle;
}

function parseBigInt(value: string): bigint {
  return BigInt(value);
}

function serializeBigInt(value: string): string {
  const writer = new CarbonBinaryWriter();
  writer.writeBigInt(parseBigInt(value));
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeBigInt(hex: string): string {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  return reader.readBigInt().toString();
}

function serializeIntX(value: string): string {
  const writer = new CarbonBinaryWriter();
  const parsed = parseBigInt(value);
  const minI64 = -(1n << 63n);
  const maxI64 = (1n << 63n) - 1n;
  const intX =
    parsed >= minI64 && parsed <= maxI64 ? IntX.fromI64(parsed) : IntX.fromBigInt(parsed);
  intX.write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeIntX(hex: string): string {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  return IntX.read(reader).toString();
}

function serializeVmInt256(value: string): string {
  const writer = new CarbonBinaryWriter();
  const variable = new VmDynamicVariable();
  variable.type = VmType.Int256;
  variable.data = parseBigInt(value);
  variable.write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeVmInt256(hex: string): string {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  const variable = new VmDynamicVariable();
  variable.read(reader);
  return String(variable.data);
}

function serializeVmInt256Array(values: string[]): string {
  const writer = new CarbonBinaryWriter();
  const variable = new VmDynamicVariable();
  variable.type = VmType.Array | VmType.Int256;
  variable.data = values.map((value) => parseBigInt(value));
  variable.write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeVmInt256Array(hex: string): string[] {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  const variable = new VmDynamicVariable();
  variable.read(reader);
  return (variable.data as bigint[]).map((value) => value.toString());
}

function serializeMetadataStruct(fixture: MetadataStructFixture): string {
  const writer = new CarbonBinaryWriter();
  buildMetadataStruct(fixture).write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeMetadataStruct(hex: string): VmDynamicStruct {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  return VmDynamicStruct.read(reader);
}

function buildMetadataStruct(fixture: MetadataStructFixture): VmDynamicStruct {
  const fields: VmNamedDynamicVariable[] = [
    VmNamedDynamicVariable.from('_i', VmType.Int256, parseBigInt(fixture._iDec)),
    VmNamedDynamicVariable.from('rom', VmType.Bytes, hexToBytes(fixture.romHex)),
  ];

  if (fixture.mode !== undefined) {
    fields.push(VmNamedDynamicVariable.from('mode', VmType.Int8, fixture.mode));
  }

  const struct = new VmDynamicStruct();
  struct.fields = fields;
  return struct;
}

function serializeTokenInfo(fixture: TokenInfoFixture): string {
  const writer = new CarbonBinaryWriter();
  buildTokenInfo(fixture).write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeTokenInfo(hex: string): TokenInfo {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  return TokenInfo.read(reader);
}

function buildTokenInfo(fixture: TokenInfoFixture): TokenInfo {
  return new TokenInfo({
    maxSupply: IntX.fromBigInt(parseBigInt(fixture.maxSupplyDec)),
    flags: fixture.flags as CarbonTokenFlags,
    decimals: fixture.decimals,
    owner: expectedTokenOwner(fixture.id),
    symbol: new SmallString(fixture.symbol),
    metadata: hexToBytes(fixture.metadataHex),
    tokenSchemas: new Uint8Array(),
  });
}

function serializeSeriesInfo(fixture: SeriesInfoFixture): string {
  const writer = new CarbonBinaryWriter();
  buildSeriesInfo(fixture).write(writer);
  return bytesToHex(writer.toUint8Array()).toUpperCase();
}

function deserializeSeriesInfo(hex: string): SeriesInfo {
  const reader = new CarbonBinaryReader(hexToBytes(hex));
  return SeriesInfo.read(reader);
}

function buildSeriesInfo(fixture: SeriesInfoFixture): SeriesInfo {
  return new SeriesInfo({
    maxMint: fixture.maxMint,
    maxSupply: fixture.maxSupply,
    owner: expectedSeriesOwner(fixture.id),
    metadata: hexToBytes(fixture.metadataHex),
    rom: new VmStructSchema(),
    ram: new VmStructSchema(),
  });
}

function getStructField(struct: VmDynamicStruct, name: string): VmNamedDynamicVariable {
  const field = struct.fields.find((entry) => entry.name.data === name);
  if (!field) {
    throw new Error(`Missing struct field '${name}'`);
  }
  return field;
}

function expectedInt256ReadBack(sourceDec: string): string {
  const readBack = INT256_READBACK.get(sourceDec);
  if (!readBack) {
    throw new Error(`Missing Int256 readback for ${sourceDec}`);
  }
  return readBack;
}

function expectedTokenOwner(id: string): Bytes32 {
  switch (id) {
    case 'fungible_zero_supply':
      return patternBytes32(0x10);
    case 'big_fungible_u64max_supply':
      return patternBytes32(0x20);
    default:
      throw new Error(`Unknown token fixture id: ${id}`);
  }
}

function expectedSeriesOwner(id: string): Bytes32 {
  switch (id) {
    case 'series_zero_metaid':
      return patternBytes32(0x30);
    case 'series_problematic_metaid':
      return patternBytes32(0x40);
    default:
      throw new Error(`Unknown series fixture id: ${id}`);
  }
}

function expectedSeriesMetadataId(id: string): string {
  switch (id) {
    case 'series_zero_metaid':
      return '0';
    case 'series_problematic_metaid':
      return '342701406799689386264365071881606655601301200422094937311139938246178500459';
    default:
      throw new Error(`Unknown series fixture id: ${id}`);
  }
}

function patternBytes32(seed: number): Bytes32 {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (seed + i) & 0xff;
  }
  return new Bytes32(bytes);
}
