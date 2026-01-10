import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { IntX } from '../../src/core/types/Carbon/IntX';
import { TokenSchemas } from '../../src/core/types/Carbon/Blockchain/Modules';
import {
  TokenInfoBuilder,
  TokenMetadataBuilder,
  TokenSchemasBuilder,
} from '../../src/core/types/Carbon/Blockchain/Modules/Builders';
import {
  FieldType,
  nftDefaultMetadataFields,
  seriesDefaultMetadataFields,
} from '../../src/core/types/Carbon/Blockchain/Modules/Builders/MetadataHelper';
import {
  VmNamedVariableSchema,
  VmStructSchema,
  VmType,
} from '../../src/core/types/Carbon/Blockchain/Vm';

const SAMPLE_PNG_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

const buildTokenMetadata = (): Uint8Array =>
  TokenMetadataBuilder.buildAndSerialize({
    name: 'My test token!',
    icon: SAMPLE_PNG_ICON_DATA_URI,
    url: 'http://example.com',
    description: 'My test token description',
  });

describe('TokenInfoBuilder', () => {
  const creator = Bytes32.Empty;
  const maxSupply = IntX.fromI64(0);

  it('rejects invalid symbols', () => {
    const metadata = buildTokenMetadata();

    expect(() => TokenInfoBuilder.build('', maxSupply, false, 0, creator, metadata)).toThrow(
      /Empty string is invalid/
    );

    expect(() =>
      TokenInfoBuilder.build('A'.repeat(256), maxSupply, false, 0, creator, metadata)
    ).toThrow(/Too long/);

    expect(() => TokenInfoBuilder.build('AB1', maxSupply, false, 0, creator, metadata)).toThrow(
      /Anything outside A/
    );
  });

  it('requires metadata for all tokens', () => {
    expect(() =>
      TokenInfoBuilder.build('TEST', maxSupply, false, 0, creator, undefined)
    ).toThrow(/metadata is required/);
  });

  it('enforces NFT constraints', () => {
    const metadata = buildTokenMetadata();
    const bigSupply = IntX.fromBigInt(9223372036854775808n);

    expect(() =>
      TokenInfoBuilder.build('NFT', bigSupply, true, 0, creator, metadata, TokenSchemasBuilder.prepareStandard(false))
    ).toThrow(/NFT maximum supply must fit into Int64/);

    expect(() =>
      TokenInfoBuilder.build('NFT', maxSupply, true, 0, creator, metadata, undefined)
    ).toThrow(/tokenSchemas is required/);
  });

  it('accepts valid fungible tokens', () => {
    const metadata = buildTokenMetadata();

    expect(() => TokenInfoBuilder.build('FUNGIBLE', maxSupply, false, 8, creator, metadata)).not.toThrow();
  });
});

describe('TokenSchemasBuilder', () => {
  const buildSchema = (fields: ReadonlyArray<FieldType>): VmStructSchema => {
    const schema = new VmStructSchema();
    schema.fields = fields.map((field) => new VmNamedVariableSchema(field.name, field.type));
    schema.flags = VmStructSchema.Flags.None;
    return schema;
  };

  it('accepts standard schemas', () => {
    const schemas = TokenSchemasBuilder.prepareStandard(false);
    const result = TokenSchemasBuilder.verify(schemas);

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
  });

  it('reports missing standard metadata fields', () => {
    const schemas = new TokenSchemas({
      seriesMetadata: buildSchema(seriesDefaultMetadataFields),
      rom: buildSchema(nftDefaultMetadataFields),
      ram: new VmStructSchema(),
    });

    const result = TokenSchemasBuilder.verify(schemas);
    expect(result.ok).toBe(false);
    expect(result.error ?? '').toContain('Mandatory metadata field not found: name');
  });

  it('reports type mismatch for standard metadata', () => {
    const schemas = new TokenSchemas({
      seriesMetadata: buildSchema([{ name: 'name', type: VmType.Int32 }]),
      rom: new VmStructSchema(),
      ram: new VmStructSchema(),
    });

    const result = TokenSchemasBuilder.verify(schemas);
    expect(result.ok).toBe(false);
    expect(result.error ?? '').toContain('Type mismatch for name field');
  });

  it('reports case mismatch for standard metadata', () => {
    const schemas = new TokenSchemas({
      seriesMetadata: buildSchema([{ name: 'Name', type: VmType.String }]),
      rom: new VmStructSchema(),
      ram: new VmStructSchema(),
    });

    const result = TokenSchemasBuilder.verify(schemas);
    expect(result.ok).toBe(false);
    expect(result.error ?? '').toContain('Case mismatch for name field');
  });
});
