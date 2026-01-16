import { bytesToHex } from '../../../../../utils/index.js';
import { CarbonBinaryWriter } from '../../../../CarbonSerialization.js';
import { VmNamedVariableSchema } from '../../Vm/VmNamedVariableSchema.js';
import { VmStructSchema } from '../../Vm/VmStructSchema.js';
import { vmTypeFromString, VmType } from '../../Vm/VmType.js';
import { TokenSchemas } from '../TokenSchemas.js';
import { FieldType, nftDefaultMetadataFields, seriesDefaultMetadataFields, standardMetadataFields } from './MetadataHelper.js';

export class TokenSchemasJson {
  seriesMetadata: FieldType[];
  rom: FieldType[];
  ram: FieldType[];
}

export function parseTokenSchemasJson(json: string): TokenSchemasJson {
  const raw = JSON.parse(json) as Record<string, unknown>

  const pickArray = (k: 'seriesMetadata' | 'rom' | 'ram') => {
    const arr = raw[k]
    if (!Array.isArray(arr)) throw new Error(`${k} must be an array`)
    return arr.map((it: any): FieldType => {
      if (typeof it?.name !== 'string') throw new Error(`${k} field name must be string`)
      if (typeof it?.type !== 'string') throw new Error(`${k} field type must be string`)
      return { name: it.name, type: vmTypeFromString(it.type) }
    })
  }

  return {
    seriesMetadata: pickArray('seriesMetadata'),
    rom: pickArray('rom'),
    ram: pickArray('ram'),
  }
}

export class TokenSchemasBuilder {
  private static assertMetadataField(schemas: VmStructSchema[], fieldTypes: readonly FieldType[]): Readonly<{ ok: boolean, error: string | null }> {
    for (const fieldType of fieldTypes) {
      let fieldIsFound = false;
      let caseMismatch: VmNamedVariableSchema | null = null;

      for (const schema of schemas) {
        const found = schema.fields.find(x => x.name.data === fieldType.name);
        if (found != undefined) {
          if (found.schema.type != fieldType.type) {
            const actualType = VmType[found.schema.type] ?? found.schema.type;
            const expectedType = VmType[fieldType.type] ?? fieldType.type;
            return {
              ok: false,
              error: `Type mismatch for ${fieldType.name} field, must be ${actualType} instead of ${expectedType}`
            };
          }
          fieldIsFound = true;
          break;
        }

        if (!caseMismatch) {
          const found2 = schema.fields.find(x => x.name.data.toLowerCase() === fieldType.name.toLowerCase())
          if (found2 != undefined) {
            caseMismatch = found2;
          }
        }
      }

      if (!fieldIsFound) {
        if (caseMismatch) {
          return {
            ok: false,
            error: `Case mismatch for ${fieldType.name} field, must be ${caseMismatch.name.data}`
          };
        }
        return { ok: false, error: `Mandatory metadata field not found: ${fieldType.name}` };
      }
    }

    return { ok: true, error: null };
  }

  private static defaultSeriesSchema(sharedMetadata: boolean): VmStructSchema {
    // Series metadata schema
    const schema = new VmStructSchema();
    schema.fields = [];
    {
      // Default fields
      seriesDefaultMetadataFields.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });

      if (sharedMetadata) {
        standardMetadataFields.forEach(f => {
          schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
        });
      }
    }

    return schema;
  }

  private static defaultNftRomSchema(sharedMetadata: boolean): VmStructSchema {
    // NFT ROM schema
    const schema = new VmStructSchema();
    schema.fields = [];
    {
      // Default fields
      nftDefaultMetadataFields.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });

      if (!sharedMetadata) {
        // They are default for all NFTs
        standardMetadataFields.forEach(f => {
          schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
        });
      }
    }

    return schema;
  }

  private static seriesSchemaFromFieldTypes(fieldTypes: FieldType[]): VmStructSchema {
    // Series metadata schema
    const schema = new VmStructSchema();
    schema.fields = [];
    {
      // Default fields. Adding them always
      seriesDefaultMetadataFields.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });

      fieldTypes.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });
    }

    return schema;
  }

  private static nftRomSchemaFromFieldTypes(fieldTypes: FieldType[]): VmStructSchema {
    // NFT ROM schema
    const schema = new VmStructSchema();
    schema.fields = [];
    {
      // Default fields. Adding them always
      nftDefaultMetadataFields.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });

      fieldTypes.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });
    }

    return schema;
  }

  private static nftRamSchemaFromFieldTypes(fieldTypes: FieldType[]): VmStructSchema {
    if (fieldTypes.length == 0) {
      return new VmStructSchema([], VmStructSchema.Flags.DynamicExtras);
    }

    // RAM schema
    const schema = new VmStructSchema();
    schema.fields = [];
    {
      fieldTypes.forEach(f => {
        schema.fields.push(new VmNamedVariableSchema(f.name, f.type));
      });
    }

    return schema;
  }

  static prepareStandard(sharedMetadata: boolean): TokenSchemas {
    const tokenSchemas = new TokenSchemas();

    // Token's series metadata schema
    tokenSchemas.seriesMetadata = this.defaultSeriesSchema(sharedMetadata);

    // NFT's ROM schema
    tokenSchemas.rom = this.defaultNftRomSchema(sharedMetadata);

    // NFT's RAM schema
    tokenSchemas.ram = new VmStructSchema([], VmStructSchema.Flags.DynamicExtras);

    return tokenSchemas;
  }

  static fromJson(json: string): TokenSchemas {
    const tokenSchemasJson = parseTokenSchemasJson(json);

    const tokenSchemas = new TokenSchemas();
    tokenSchemas.seriesMetadata = this.seriesSchemaFromFieldTypes(tokenSchemasJson.seriesMetadata);
    tokenSchemas.rom = this.nftRomSchemaFromFieldTypes(tokenSchemasJson.rom);
    tokenSchemas.ram = this.nftRamSchemaFromFieldTypes(tokenSchemasJson.ram);

    const { ok, error } = this.verify(tokenSchemas);
    if (!ok) {
      throw Error(error ?? "Unknown error");
    }

    return tokenSchemas;
  }

  static verify(schemas: TokenSchemas): Readonly<{ ok: boolean, error: string | null }> {
    let result = this.assertMetadataField([schemas.seriesMetadata, schemas.rom], standardMetadataFields);
    if (!result.ok) {
      return result;
    }

    result = this.assertMetadataField([schemas.seriesMetadata], seriesDefaultMetadataFields);
    if (!result.ok) {
      return result;
    }

    result = this.assertMetadataField([schemas.rom], nftDefaultMetadataFields);
    if (!result.ok) {
      return result;
    }

    return { ok: true, error: null };
  }

  static serialize(tokenSchemas: TokenSchemas): Readonly<Uint8Array> {
    const schemaBuf = new CarbonBinaryWriter();
    tokenSchemas.write(schemaBuf);

    return schemaBuf.toUint8Array();
  }

  static serializeHex(tokenSchemas: TokenSchemas): Readonly<string> {
    return bytesToHex(this.serialize(tokenSchemas));
  }

  static logSchema(schema: VmStructSchema) {
    schema.fields.forEach(f => console.log("Schema field: ", f.name.data));
  }
}
