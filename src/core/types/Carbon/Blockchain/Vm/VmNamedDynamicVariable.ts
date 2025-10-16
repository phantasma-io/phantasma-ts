import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { SmallString } from '../../SmallString';
import { VmDynamicVariable } from './VmDynamicVariable';
import { VmType } from './VmType';

export class VmNamedDynamicVariable implements ICarbonBlob {
  name!: SmallString;
  value!: VmDynamicVariable;

  static from(name: string | SmallString, type: VmType, value: any): VmNamedDynamicVariable {
    const nv = new VmNamedDynamicVariable();
    nv.name = name instanceof SmallString ? name : new SmallString(name);

    const dyn = VmDynamicVariable.fromType(type);
    dyn.data = value;

    nv.value = dyn;

    return nv;
  }

  write(w: CarbonBinaryWriter): void {
    this.name.write(w);
    this.value.write(w);
  }
  read(r: CarbonBinaryReader): void {
    this.name = r.readBlob(SmallString);
    this.value = r.readBlob(VmDynamicVariable);
  }

  static read(r: CarbonBinaryReader): VmNamedDynamicVariable {
    const v = new VmNamedDynamicVariable();
    v.read(r);
    return v;
  }
}
