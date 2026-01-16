import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { SmallString } from '../../SmallString.js';
import { VmType } from './VmType.js';
import { VmVariableSchema } from './VmVariableSchema.js';

export class VmNamedVariableSchema implements ICarbonBlob {
  name!: SmallString;
  schema!: VmVariableSchema;

  constructor(name?: SmallString | string, schema?: VmVariableSchema | VmType) {
    if (name) {
      if (name instanceof SmallString) {
        this.name = name;
      } else {
        this.name = new SmallString(name);
      }
    }
    if (schema) {
      if (schema instanceof VmVariableSchema) {
        this.schema = schema;
      } else {
        this.schema = new VmVariableSchema(schema);
      }
    }
  }

  write(w: CarbonBinaryWriter): void {
    this.name.write(w);
    this.schema.write(w);
  }
  read(r: CarbonBinaryReader): void {
    this.name = r.readBlob(SmallString);
    this.schema = r.readBlob(VmVariableSchema);
  }

  static read(r: CarbonBinaryReader): VmNamedVariableSchema {
    const v = new VmNamedVariableSchema();
    v.read(r);
    return v;
  }
}
