import { VmNamedVariableSchema, VmStructSchema, VmType, vmTypeFromString, VmVariableSchema } from '../../types';
import { VmStructSchemaResult, VmVariableSchemaResult } from '../interfaces';

export function vmStructSchemaFromRpcResult(r: VmStructSchemaResult): VmStructSchema {
  const schema = new VmStructSchema();
  schema.fields = [];
  const fields = r?.fields ?? [];
  for (const f of fields) {
    const name = String(f?.name ?? '');
    if (!name) continue;
    const t = f.schema?.type;
    let vmType: VmType;
    if (typeof t === 'number') vmType = t as VmType;
    else if (typeof t === 'string') vmType = vmTypeFromString(t);
    else continue;
    schema.fields.push(new VmNamedVariableSchema(name, vmType));
  }
  return schema;
}

export function vmVariableSchemaFromRpcResult(v: VmVariableSchemaResult): VmVariableSchema {
  const typeVal = v?.type;
  let vmType: VmType;
  if (typeof typeVal === 'number') vmType = typeVal as VmType;
  else if (typeof typeVal === 'string') vmType = vmTypeFromString(typeVal);
  else throw new Error('Invalid VmVariableSchemaResult.type');

  const vs = new VmVariableSchema(vmType);
  // If nested struct schema is present, convert recursively
  if (v.schema) {
    vs.structure = vmStructSchemaFromRpcResult(v.schema);
  }
  return vs;
}
