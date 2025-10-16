import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { SmallString } from '../../SmallString';
import { VmVariableSchema } from './VmVariableSchema';

export class VmNamedVariableSchema implements ICarbonBlob {
  name!: SmallString;
  schema!: VmVariableSchema;

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
