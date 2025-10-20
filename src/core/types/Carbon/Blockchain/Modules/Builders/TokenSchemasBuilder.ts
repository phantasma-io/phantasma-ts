import { bytesToHex } from '../../../../../utils';
import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmNamedVariableSchema } from '../../Vm/VmNamedVariableSchema';
import { VmStructSchema } from '../../Vm/VmStructSchema';
import { VmType } from '../../Vm/VmType';
import { StandardMeta } from '../StandardMeta';
import { TokenSchemas } from '../TokenSchemas';

export class TokenSchemasBuilder {
  static prepareStandardTokenSchemas(): TokenSchemas {
    // Serie metadata schema
    const seriesSchema = new VmStructSchema();
    seriesSchema.fields = [];
    {
      seriesSchema.fields.push(new VmNamedVariableSchema(StandardMeta.id, VmType.Int256));
      seriesSchema.fields.push(new VmNamedVariableSchema('mode', VmType.Int8));
      seriesSchema.fields.push(new VmNamedVariableSchema('rom', VmType.Bytes));
    }

    // NFT's ROM schema
    const romSchema = new VmStructSchema();
    romSchema.fields = [];
    {
      romSchema.fields.push(new VmNamedVariableSchema(StandardMeta.id, VmType.Int256));
      romSchema.fields.push(new VmNamedVariableSchema('rom', VmType.Bytes));
      romSchema.fields.push(new VmNamedVariableSchema('name', VmType.String));
      romSchema.fields.push(new VmNamedVariableSchema('description', VmType.String));
      romSchema.fields.push(new VmNamedVariableSchema('imageURL', VmType.String));
      romSchema.fields.push(new VmNamedVariableSchema('infoURL', VmType.String));
      romSchema.fields.push(new VmNamedVariableSchema('royalties', VmType.Int32));
    }

    // NFT's RAM schema
    const ramSchema = new VmStructSchema([], VmStructSchema.Flags.DynamicExtras);

    const tokenSchemas = new TokenSchemas();
    tokenSchemas.seriesMetadata = seriesSchema;
    tokenSchemas.rom = romSchema;
    tokenSchemas.ram = ramSchema;

    return tokenSchemas;
  }

  static buildAndSerialize(tokenSchemas?: TokenSchemas): Uint8Array {
    tokenSchemas = tokenSchemas || this.prepareStandardTokenSchemas();

    const schemaBuf = new CarbonBinaryWriter();
    tokenSchemas.write(schemaBuf);

    return schemaBuf.toUint8Array();
  }

  static buildAndSerializeHex(tokenSchemas?: TokenSchemas): string {
    tokenSchemas = tokenSchemas || this.prepareStandardTokenSchemas();

    return bytesToHex(this.buildAndSerialize(tokenSchemas));
  }
}
