import { VmStructSchema } from "./VmStructSchema"
import { VmDynamicStruct } from "./VmDynamicStruct"

export class VmStructArray {
  schema: VmStructSchema = new VmStructSchema()
  structs: VmDynamicStruct[] = []
}
