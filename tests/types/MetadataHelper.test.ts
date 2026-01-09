import { Bytes16 } from '../../src/core/types/Carbon/Bytes16';
import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { VmDynamicStruct, VmNamedVariableSchema, VmStructSchema, VmType, VmVariableSchema } from '../../src/core/types/Carbon/Blockchain/Vm';
import { MetadataField, pushMetadataField } from '../../src/core/types/Carbon/Blockchain/Modules/Builders/MetadataHelper';

describe('MetadataHelper.pushMetadataField', () => {
  it('accepts matching Int32 values', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('royalties', VmType.Int32);
    const metadata: MetadataField[] = [{ name: 'royalties', value: 42 }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields).toHaveLength(1);
    expect(struct.fields[0].value.data).toBe(42);
  });

  it('rejects non-integer values for Int32 fields', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('royalties', VmType.Int32);
    const metadata: MetadataField[] = [{ name: 'royalties', value: 'forty-two' }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'royalties' must be an integer between -2147483648 and 2147483647"
    );
  });

  it('rejects values outside of the allowed Int32/UInt32 range', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('royalties', VmType.Int32);
    const metadata: MetadataField[] = [{ name: 'royalties', value: 0xffffffff + 1 }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'royalties' must be between -2147483648 and 2147483647 or between 0 and 4294967295"
    );
  });

  it('accepts hex strings for byte fields', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('payload', VmType.Bytes);
    const metadata: MetadataField[] = [{ name: 'payload', value: '0a0b' }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields).toHaveLength(1);
    expect(struct.fields[0].value.data).toEqual(new Uint8Array([0x0a, 0x0b]));
  });

  it('accepts 0x-prefixed hex strings for byte fields', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('payload', VmType.Bytes);
    const metadata: MetadataField[] = [{ name: 'payload', value: '0x0a0b' }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields).toHaveLength(1);
    expect(struct.fields[0].value.data).toEqual(new Uint8Array([0x0a, 0x0b]));
  });

  it('accepts unsigned range values for Int8', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('level', VmType.Int8);
    const metadata: MetadataField[] = [{ name: 'level', value: 200 }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBe(200);
  });

  it('accepts unsigned range values for Int16', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('checksum', VmType.Int16);
    const metadata: MetadataField[] = [{ name: 'checksum', value: 65535 }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBe(65535);
  });

  it('rejects invalid hex strings for byte fields', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('payload', VmType.Bytes);
    const metadata: MetadataField[] = [{ name: 'payload', value: 'xyz' }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'payload' must be a byte array or hex string"
    );
  });

  it('requires bigint for unsafe Int64 values', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('supply', VmType.Int64);
    const unsafeNumber = Number.MAX_SAFE_INTEGER + 1;
    const metadata: MetadataField[] = [{ name: 'supply', value: unsafeNumber }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'supply' must be provided as a bigint when it exceeds safe integer range"
    );
  });

  it('accepts bigint input for Int64 values', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('supply', VmType.Int64);
    const metadata: MetadataField[] = [{ name: 'supply', value: 123n }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBe(123n);
  });

  it('rejects values outside Int64/UInt64 bounds', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('supply', VmType.Int64);
    const metadata: MetadataField[] = [{ name: 'supply', value: (1n << 64n) }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'supply' must be between -9223372036854775808 and 9223372036854775807 or between 0 and 18446744073709551615 (Int64)"
    );
  });

  it('rejects values outside Int256/UInt256 bounds', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('value', VmType.Int256);
    const metadata: MetadataField[] = [{ name: 'value', value: (1n << 256n) }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'value' must be between -57896044618658097711785492504343953926634992332820282019728792003956564819968 and 57896044618658097711785492504343953926634992332820282019728792003956564819967 or between 0 and 115792089237316195423570985008687907853269984665640564039457584007913129639935 (Int256)"
    );
  });

  it('accepts unsigned range values for Int64 via BigInt', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('supply', VmType.Int64);
    const metadata: MetadataField[] = [{ name: 'supply', value: (1n << 64n) - 1n }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBe((1n << 64n) - 1n);
  });

  it('accepts unsigned range values for Int256 via BigInt', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('value', VmType.Int256);
    const metadata: MetadataField[] = [{ name: 'value', value: (1n << 256n) - 1n }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBe((1n << 256n) - 1n);
  });

  it('builds nested struct metadata from plain object', () => {
    const struct = new VmDynamicStruct();
    const nestedSchema = new VmStructSchema([
      new VmNamedVariableSchema('innerName', VmType.String),
      new VmNamedVariableSchema('innerValue', VmType.Int32),
    ]);
    const schema = new VmNamedVariableSchema('details', new VmVariableSchema(VmType.Struct, nestedSchema));
    const metadata: MetadataField[] = [{
      name: 'details',
      value: { innerName: 'demo', innerValue: 5 },
    }];

    pushMetadataField(schema, struct, metadata);

    const nested = struct.fields[0].value.data as VmDynamicStruct;
    expect(nested.fields).toHaveLength(2);
    expect(nested.fields[0].name.data).toBe('innerName');
    expect(nested.fields[1].value.data).toBe(5);
  });

  it('rejects struct metadata with unknown properties', () => {
    const struct = new VmDynamicStruct();
    const nestedSchema = new VmStructSchema([
      new VmNamedVariableSchema('innerName', VmType.String),
    ]);
    const schema = new VmNamedVariableSchema('details', new VmVariableSchema(VmType.Struct, nestedSchema));
    const metadata: MetadataField[] = [{
      name: 'details',
      value: { innerName: 'demo', extra: 'oops' },
    }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'details' received unknown property 'extra'"
    );
  });

  it('rejects struct metadata missing required fields', () => {
    const struct = new VmDynamicStruct();
    const nestedSchema = new VmStructSchema([
      new VmNamedVariableSchema('innerName', VmType.String),
    ]);
    const schema = new VmNamedVariableSchema('details', new VmVariableSchema(VmType.Struct, nestedSchema));
    const metadata: MetadataField[] = [{
      name: 'details',
      value: {},
    }];

    expect(() => pushMetadataField(schema, struct, metadata)).toThrow(
      "Metadata field 'details.innerName' is mandatory"
    );
  });

  it('accepts arrays for matching array schema', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('tags', new VmVariableSchema(VmType.Array | VmType.String));
    const metadata: MetadataField[] = [{ name: 'tags', value: ['alpha', 'beta'] }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toEqual(['alpha', 'beta']);
  });

  it('converts Int8 arrays into Uint8Array', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('deltas', new VmVariableSchema(VmType.Array | VmType.Int8));
    const metadata: MetadataField[] = [{ name: 'deltas', value: [1, -1, 5] }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBeInstanceOf(Uint8Array);
    expect(Array.from(struct.fields[0].value.data as Uint8Array)).toEqual([1, 255, 5]);
  });

  it('builds VmStructArray for arrays of structs', () => {
    const struct = new VmDynamicStruct();
    const elementSchema = new VmStructSchema([
      new VmNamedVariableSchema('name', VmType.String),
    ]);
    const schema = new VmNamedVariableSchema('items', new VmVariableSchema(VmType.Array | VmType.Struct, elementSchema));
    const metadata: MetadataField[] = [{
      name: 'items',
      value: [{ name: 'one' }, { name: 'two' }],
    }];

    pushMetadataField(schema, struct, metadata);

    const arrayValue = struct.fields[0].value.data;
    expect(arrayValue.schema).toBe(elementSchema);
    expect(arrayValue.structs).toHaveLength(2);
  });

  it('converts hex input into Bytes16 instance', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('hash', VmType.Bytes16);
    const metadata: MetadataField[] = [{ name: 'hash', value: '00112233445566778899aabbccddeeff' }];

    pushMetadataField(schema, struct, metadata);

    expect(struct.fields[0].value.data).toBeInstanceOf(Bytes16);
    expect((struct.fields[0].value.data as Bytes16).bytes).toHaveLength(16);
  });

  it('builds arrays of Bytes32 instances', () => {
    const struct = new VmDynamicStruct();
    const schema = new VmNamedVariableSchema('roots', new VmVariableSchema(VmType.Array | VmType.Bytes32));
    const metadata: MetadataField[] = [{
      name: 'roots',
      value: [
        '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      ],
    }];

    pushMetadataField(schema, struct, metadata);

    const values = struct.fields[0].value.data as Bytes32[];
    expect(values).toHaveLength(2);
    expect(values[0]).toBeInstanceOf(Bytes32);
  });
});
