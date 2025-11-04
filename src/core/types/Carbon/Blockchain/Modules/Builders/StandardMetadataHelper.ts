import { VmDynamicStruct, VmNamedDynamicVariable, VmStructSchema, VmType } from "../../Vm";

export function pushStandardMetadataField(metadata: VmDynamicStruct, schema: VmStructSchema, name: string, type: VmType, value: string | number | null | undefined) {
  if (typeof value === "undefined" || value === null) {
    if (schema.fields.some(f => f.name.data === name)) {
      throw Error(`Metadata field '${name}' is mandatory`);
    }
  } else if (type === VmType.String && typeof value === "string") {
    if (value && value.trim().length != 0) {
      metadata.fields.push(VmNamedDynamicVariable.from(name, type, value));
    } else {
      if (schema.fields.some(f => f.name.data === name)) {
        throw Error(`Metadata field '${name}' is mandatory`);
      }
    }
  } else if (type === VmType.Int32 && typeof value === "number") {
    metadata.fields.push(VmNamedDynamicVariable.from(name, type, value));
  } else {
    throw Error(`Unsupported standard metadata field type '${type}'/'${typeof value}' `);
  }
}
