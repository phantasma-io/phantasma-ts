import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { VmType } from './VmType';
import { VmStructSchema } from './VmStructSchema';
import { VmDynamicStruct } from './VmDynamicStruct';
import { VmStructArray } from './VmStructArray';
import { Bytes16 } from '../../Bytes16';
import { Bytes32 } from '../../Bytes32';
import { Bytes64 } from '../../Bytes64';
import { VmVariableSchema } from './VmVariableSchema';

export class VmDynamicVariable implements ICarbonBlob {
  type: VmType = VmType.Dynamic;
  data: any = null;

  static fromType(t: VmType): VmDynamicVariable {
    const v = new VmDynamicVariable();
    v.type = t;
    switch (t) {
      case VmType.Dynamic:
        v.data = null;
        break;
      case VmType.Bytes:
        v.data = new Uint8Array();
        break;
      case VmType.Struct:
        v.data = new VmDynamicStruct();
        break;
      case VmType.Int8:
        v.data = 0;
        break;
      case VmType.Int16:
        v.data = 0;
        break;
      case VmType.Int32:
        v.data = 0;
        break;
      case VmType.Int64:
        v.data = 0n;
        break;
      case VmType.Int256:
        v.data = 0n;
        break;
      case VmType.Bytes16:
        v.data = new Bytes16();
        break;
      case VmType.Bytes32:
        v.data = new Bytes32();
        break;
      case VmType.Bytes64:
        v.data = new Bytes64();
        break;
      case VmType.String:
        v.data = '';
        break;
      case VmType.Array | VmType.Dynamic:
        v.data = [] as VmDynamicVariable[];
        break;
      case VmType.Array | VmType.Bytes:
        v.data = [] as Uint8Array[];
        break;
      case VmType.Array | VmType.Struct:
        v.data = new VmStructArray();
        break;
      case VmType.Array | VmType.Int8:
        v.data = new Uint8Array();
        break;
      case VmType.Array | VmType.Int16:
        v.data = [] as number[];
        break;
      case VmType.Array | VmType.Int32:
        v.data = [] as number[];
        break;
      case VmType.Array | VmType.Int64:
        v.data = [] as bigint[];
        break;
      case VmType.Array | VmType.Int256:
        v.data = [] as bigint[];
        break;
      case VmType.Array | VmType.Bytes16:
        v.data = [] as Bytes16[];
        break;
      case VmType.Array | VmType.Bytes32:
        v.data = [] as Bytes32[];
        break;
      case VmType.Array | VmType.Bytes64:
        v.data = [] as Bytes64[];
        break;
      case VmType.Array | VmType.String:
        v.data = [] as string[];
        break;
      default:
        throw new Error('Unknown VmDynamicVariable type');
    }
    return v;
  }

  write(w: CarbonBinaryWriter): void {
    w.write1(this.type & 0xff);
    VmDynamicVariable.writeStatic(this.type, this, null, w);
  }
  writeWithSchema(schema: VmVariableSchema, w: CarbonBinaryWriter): boolean {
    return VmDynamicVariable.writeStatic(schema.type, this, schema.structure, w);
  }

  read(r: CarbonBinaryReader): void {
    this.type = r.read1() as VmType;
    VmDynamicVariable.readStatic(this.type, this, null, r);
  }
  readWithSchema(schema: VmVariableSchema, r: CarbonBinaryReader): void {
    this.type = schema.type;
    VmDynamicVariable.readStatic(schema.type, this, null, r);
  }

  static readStatic(
    type: VmType,
    outVar: VmDynamicVariable,
    schema: VmStructSchema | null,
    r: CarbonBinaryReader
  ): void {
    switch (type) {
      case VmType.Dynamic: {
        const inner = new VmDynamicVariable();
        inner.read(r);
        outVar.type = VmType.Dynamic;
        outVar.data = inner;
        break;
      }
      case VmType.Bytes:
        outVar.type = type;
        outVar.data = r.readArray();
        break;
      case VmType.Struct: {
        const s = new VmDynamicStruct();
        if (schema) s.readWithSchema(schema, r);
        else s.read(r);
        outVar.type = type;
        outVar.data = s;
        break;
      }
      case VmType.Int8:
        outVar.type = type;
        outVar.data = r.read1();
        break;
      case VmType.Int16:
        outVar.type = type;
        outVar.data = r.read2();
        break;
      case VmType.Int32:
        outVar.type = type;
        outVar.data = r.read4();
        break;
      case VmType.Int64:
        outVar.type = type;
        outVar.data = r.read8u();
        break;
      case VmType.Int256:
        outVar.type = type;
        outVar.data = r.readBigInt();
        break;
      case VmType.Bytes16:
        outVar.type = type;
        outVar.data = Bytes16.read(r);
        break;
      case VmType.Bytes32:
        outVar.type = type;
        outVar.data = Bytes32.read(r);
        break;
      case VmType.Bytes64:
        outVar.type = type;
        outVar.data = Bytes64.read(r);
        break;
      case VmType.String:
        outVar.type = type;
        outVar.data = r.readSz();
        break;
      case VmType.Array | VmType.Dynamic:
        outVar.type = type;
        outVar.data = r.readArrayBlob(VmDynamicVariable);

        break;
      case VmType.Array | VmType.Bytes:
        outVar.type = type;
        outVar.data = r.readArrayOfArrays();
        break;
      case VmType.Array | VmType.Struct: {
        const length = r.read4();
        let usedSchema = schema ?? null;

        const sa = new VmStructArray();

        if (!usedSchema) {
          const readSchema = r.readBlob(VmStructSchema);
          sa.schema = readSchema;
          if (readSchema.fields.length > 0) usedSchema = readSchema;
        } else {
          sa.schema = usedSchema;
        }

        const arr: VmDynamicStruct[] = new Array(length);
        for (let i = 0; i < length; i++) {
          const s = new VmDynamicStruct();
          if (usedSchema) {
            s.readWithSchema(usedSchema, r);
          } else {
            s.read(r);
          }
          arr[i] = s;
        }

        sa.structs = arr;
        outVar.type = type;
        outVar.data = sa;
        break;
      }
      case VmType.Array | VmType.Int8:
        outVar.type = type;
        outVar.data = r.readArray8();
        break;
      case VmType.Array | VmType.Int16:
        outVar.type = type;
        outVar.data = r.readArray16();
        break;
      case VmType.Array | VmType.Int32:
        outVar.type = type;
        outVar.data = r.readArray32();
        break;
      case VmType.Array | VmType.Int64:
        outVar.type = type;
        outVar.data = r.readArray64();
        break;
      case VmType.Array | VmType.Int256:
        outVar.type = type;
        outVar.data = r.readArrayBigInt();
        break;
      case VmType.Array | VmType.Bytes16:
        outVar.type = type;
        outVar.data = r.readArrayBlob(Bytes16);
        break;
      case VmType.Array | VmType.Bytes32:
        outVar.type = type;
        outVar.data = r.readArrayBlob(Bytes32);
        break;
      case VmType.Array | VmType.Bytes64:
        outVar.type = type;
        outVar.data = r.readArrayBlob(Bytes64);
        break;
      case VmType.Array | VmType.String:
        outVar.type = type;
        outVar.data = r.readArraySz();
        break;
      default:
        throw new Error('Unknown VmDynamicVariable type');
    }
  }

  static writeStatic(
    type: VmType,
    v: VmDynamicVariable,
    schema: VmStructSchema | null,
    w: CarbonBinaryWriter
  ): boolean {
    if (v.type !== type) {
      const err = VmDynamicVariable.fromType(type);
      return VmDynamicVariable.writeStatic(type, err, schema, w);
    }
    if (type === VmType.Dynamic) {
      if (v.data == null) {
        w.write1((VmType.Array | VmType.Dynamic) & 0xff);
        w.write4u(0);
        return true;
      }

      (v.data as VmDynamicVariable).write(w);
      return true;
    }
    if (v.data == null) throw new Error('invalid object');

    switch (type) {
      case VmType.Bytes:
        w.writeArray(v.data as Uint8Array);
        return true;
      case VmType.Struct: {
        const s = v.data as VmDynamicStruct;
        if (schema) return s.writeWithSchema(schema, w);
        else {
          s.write(w);
          return true;
        }
      }
      case VmType.Int8:
        w.write1(v.data as number);
        return true;
      case VmType.Int16:
        w.write2(v.data as number);
        return true;
      case VmType.Int32:
        w.write4(v.data as number);
        return true;
      case VmType.Int64:
        w.write8u(v.data as bigint);
        return true;
      case VmType.Int256:
        w.writeBigInt(v.data as bigint);
        return true;
      case VmType.Bytes16:
        (v.data as Bytes16).write(w);
        return true;
      case VmType.Bytes32:
        (v.data as Bytes32).write(w);
        return true;
      case VmType.Bytes64:
        (v.data as Bytes64).write(w);
        return true;
      case VmType.String:
        w.writeSz(v.data as string);
        return true;
      case VmType.Array | VmType.Dynamic:
        w.writeArrayBlob(v.data as VmDynamicVariable[]);
        return true;
      case VmType.Array | VmType.Bytes:
        w.writeArrayOfArrays(v.data as Uint8Array[]);
        return true;
      case VmType.Array | VmType.Struct: {
        const sa = v.data as VmStructArray;
        w.write4u(sa.structs.length);
        let used = schema;
        if (!used) {
          sa.schema.write(w);
          if (sa.schema.fields.length > 0) used = sa.schema;
        }
        let ok = true;
        for (const s of sa.structs) {
          if (used) ok = ok && s.writeWithSchema(used, w);
          else s.write(w);
        }
        return ok;
      }
      case VmType.Array | VmType.Int8:
        w.writeArray(v.data as Uint8Array);
        return true;
      case VmType.Array | VmType.Int16:
        w.writeArray16(v.data as number[]);
        return true;
      case VmType.Array | VmType.Int32:
        w.writeArray32(v.data as number[]);
        return true;
      case VmType.Array | VmType.Int64:
        w.writeArray64(v.data as bigint[]);
        return true;
      case VmType.Array | VmType.Int256:
        w.writeArrayBigInt(v.data as bigint[]);
        return true;
      case VmType.Array | VmType.Bytes16:
        (v.data as Bytes16).write(w);
        return true;
      case VmType.Array | VmType.Bytes32:
        (v.data as Bytes32).write(w);
        return true;
      case VmType.Array | VmType.Bytes64:
        (v.data as Bytes64).write(w);
        return true;
      case VmType.Array | VmType.String:
        w.writeArraySz(v.data as string[]);
        return true;
      default:
        throw new Error('invalid VmDynamicVariable');
    }
  }
}
