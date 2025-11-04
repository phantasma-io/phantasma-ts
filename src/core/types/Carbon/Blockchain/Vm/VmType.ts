export const enum VmType {
  Dynamic = 0,
  Array = 1,
  Bytes = 1 << 1,
  Struct = 2 << 1,
  Int8 = 3 << 1,
  Int16 = 4 << 1,
  Int32 = 5 << 1,
  Int64 = 6 << 1,
  Int256 = 7 << 1,
  Bytes16 = 8 << 1,
  Bytes32 = 9 << 1,
  Bytes64 = 10 << 1,
  String = 11 << 1,

  Array_Dynamic = Array | Dynamic,
  Array_Bytes = Array | Bytes,
  Array_Struct = Array | Struct,
  Array_Int8 = Array | Int8,
  Array_Int16 = Array | Int16,
  Array_Int32 = Array | Int32,
  Array_Int64 = Array | Int64,
  Array_Int256 = Array | Int256,
  Array_Bytes16 = Array | Bytes16,
  Array_Bytes32 = Array | Bytes32,
  Array_Bytes64 = Array | Bytes64,
  Array_String = Array | String,
}

export function vmTypeFromString(type: string): VmType {
  const map: Record<string, VmType> = {
    Dynamic: VmType.Dynamic,
    Array: VmType.Array,
    Bytes: VmType.Bytes,
    Struct: VmType.Struct,
    Int8: VmType.Int8,
    Int16: VmType.Int16,
    Int32: VmType.Int32,
    Int64: VmType.Int64,
    Int256: VmType.Int256,
    Bytes16: VmType.Bytes16,
    Bytes32: VmType.Bytes32,
    Bytes64: VmType.Bytes64,
    String: VmType.String,

    Array_Dynamic: VmType.Array_Dynamic,
    Array_Bytes: VmType.Array_Bytes,
    Array_Struct: VmType.Array_Struct,
    Array_Int8: VmType.Array_Int8,
    Array_Int16: VmType.Array_Int16,
    Array_Int32: VmType.Array_Int32,
    Array_Int64: VmType.Array_Int64,
    Array_Int256: VmType.Array_Int256,
    Array_Bytes16: VmType.Array_Bytes16,
    Array_Bytes32: VmType.Array_Bytes32,
    Array_Bytes64: VmType.Array_Bytes64,
    Array_String: VmType.Array_String,
  }

  const value = map[type.trim()]
  if (value === undefined) {
    throw new Error(`Unknown VmType: ${type}`)
  }

  return value
}
