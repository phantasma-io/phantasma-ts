import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmType } from '../../Vm';

export class TokenMetadataBuilder {
  static buildAndSerialize(fields?: Record<string, string> | undefined | null): Uint8Array {
    if (fields === undefined && fields === null) {
      return new Uint8Array();
    }

    fields = fields ?? {};

    const metadataFields: VmNamedDynamicVariable[] = [];
    for (const [key, value] of Object.entries(fields)) {
      metadataFields.push(VmNamedDynamicVariable.from(key, VmType.String, value));
    }

    const struct = new VmDynamicStruct();
    struct.fields = metadataFields;

    const wMetadata = new CarbonBinaryWriter();
    struct.write(wMetadata);
    return wMetadata.toUint8Array();
  }
}
