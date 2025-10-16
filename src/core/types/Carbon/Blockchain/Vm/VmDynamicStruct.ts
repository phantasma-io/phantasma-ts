import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { SmallString } from '../../SmallString';
import { VmNamedDynamicVariable } from './VmNamedDynamicVariable';
import { VmDynamicVariable } from './VmDynamicVariable';
import { VmStructSchema } from './VmStructSchema';
import { VmNamedVariableSchema } from './VmNamedVariableSchema';

export class VmDynamicStruct implements ICarbonBlob {
  // NOTE: fields must be sorted by name
  fields: VmNamedDynamicVariable[] = [];

  getValue(key: SmallString): VmDynamicVariable | undefined {
    const found = this.fields.find((x) => x.name.data === key.data);
    return found ? found.value : undefined;
  }

  write(w: CarbonBinaryWriter): void {
    if (this.fields.length > 1) {
      this.fields.sort((a, b) => a.name.compareTo(b.name));
    }
    w.writeArrayBlob(this.fields);
  }
  read(r: CarbonBinaryReader): void {
    this.fields = r.readArrayBlob(VmNamedDynamicVariable);
    this.fields.sort((a, b) => a.name.compareTo(b.name));
  }

  static read(r: CarbonBinaryReader): VmDynamicStruct {
    const v = new VmDynamicStruct();
    v.read(r);
    return v;
  }

  writeWithSchema(schema: VmStructSchema, w: CarbonBinaryWriter): boolean {
    let ok = true;
    let fieldsFound = 0;
    for (const f of schema.fields) {
      const inStruct = this.fields.find((x) => x.name.data === f.name.data);
      if (inStruct) {
        inStruct.value.writeWithSchema(f.schema, w);
        fieldsFound++;
      } else {
        const error = VmDynamicVariable.fromType(f.schema.type);
        error.writeWithSchema(f.schema, w);
        ok = false;
      }
    }
    if ((schema.flags & VmStructSchema.Flags.DynamicExtras) === 0) {
      return ok;
    }
    if (fieldsFound === schema.fields.length && schema.fields.length === this.fields.length) {
      w.write4u(0);
      return ok;
    }
    const extras: VmNamedDynamicVariable[] = [];
    for (const f of this.fields) {
      const inSchema = schema.fields.find((x) => x.name.data === f.name.data);
      if (!inSchema) extras.push(f);
    }
    w.writeArrayBlob(extras);
    return ok;
  }

  readWithSchema(schema: VmStructSchema, r: CarbonBinaryReader): void {
    if (schema.fields.length === 0) {
      this.fields = [];
    } else {
      this.fields = new Array<VmNamedDynamicVariable>(schema.fields.length)
        .fill(null as any)
        .map(() => new VmNamedDynamicVariable());
      for (let i = 0; i < schema.fields.length; i++) {
        this.fields[i].name = schema.fields[i].name;
        this.fields[i].value = new VmDynamicVariable();
        this.fields[i].value.readWithSchema(schema.fields[i].schema, r);
      }
    }
    if ((schema.flags & VmStructSchema.Flags.DynamicExtras) === 0) {
      if ((schema.flags & VmStructSchema.Flags.IsSorted) === 0) {
        this.fields.sort((a, b) => a.name.compareTo(b.name));
      }
      return;
    }
    const extras = r.readArrayBlob(VmNamedDynamicVariable);
    this.fields = this.fields.concat(extras);
    this.fields.sort((a, b) => a.name.compareTo(b.name));
  }
}
