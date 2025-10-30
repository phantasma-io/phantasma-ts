import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmType } from '../../Vm';

export class TokenMetadataBuilder {
  static buildAndSerialize(fields?: Record<string, string>): Uint8Array {
    const requiredFields = ['name', 'icon', 'url', 'description'] as const;
    
    if (!fields || Object.keys(fields).length < requiredFields.length) {
      throw new Error('Token metadata is mandatory');
    }

    const missing = requiredFields.filter(
      field => typeof fields[field] !== 'string' || fields[field].trim() === '',
    );

    if (missing.length > 0) {
      throw new Error(`Token metadata is missing required fields: ${missing.join(', ')}`);
    }

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
