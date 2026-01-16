import { VmStructSchema } from "./VmStructSchema.js"
import { VmDynamicStruct } from "./VmDynamicStruct.js"

export class VmStructArray {
  schema: VmStructSchema = new VmStructSchema()
  structs: VmDynamicStruct[] = []
}
