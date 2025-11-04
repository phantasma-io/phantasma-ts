import { CarbonBinaryWriter } from '../../../../CarbonSerialization';
import { VmDynamicStruct, VmNamedDynamicVariable, VmType } from '../../Vm';

export class TokenMetadataBuilder {
  private static readonly iconDataUriPrefixPattern =
    /^data:image\/(png|jpeg|svg\+xml);base64,/i;
  private static readonly base64PayloadPattern = /^[A-Za-z0-9+/]+={0,2}$/;

  static buildAndSerialize(fields?: Record<string, unknown>): Uint8Array {
    const requiredFields = ['name', 'icon', 'url', 'description'] as const;

    if (!fields || Object.keys(fields).length < requiredFields.length) {
      throw new Error('Token metadata is mandatory');
    }

    if (Object.values(fields).some(v => typeof v !== 'string')) {
      throw new Error('All metadata fields must be strings')
    }

    const missing = requiredFields.filter(
      field => typeof fields[field] !== 'string' || (fields[field] as string).trim() === '',
    );

    if (missing.length > 0) {
      throw new Error(`Token metadata is missing required fields: ${missing.join(', ')}`);
    }

    this.validateIcon(fields['icon'] as string);

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

  private static validateIcon(icon: string): void {
    const candidate = icon?.trim();
    if (!candidate || candidate.length === 0) {
      throw new Error('Token metadata icon must be a base64-encoded data URI (PNG, JPEG, or SVG)');
    }

    if (!this.iconDataUriPrefixPattern.test(candidate)) {
      throw new Error('Token metadata icon must be a base64-encoded data URI (PNG, JPEG, or SVG)');
    }

    const payload = candidate.slice(candidate.indexOf(',') + 1).trim();
    if (!payload) {
      throw new Error('Token metadata icon must include a non-empty base64 payload');
    }

    if (!this.base64PayloadPattern.test(payload) || payload.length % 4 !== 0) {
      throw new Error('Token metadata icon payload is not valid base64');
    }

    try {
      const decoded = Buffer.from(payload, 'base64');
      if (decoded.length === 0) {
        throw new Error('Token metadata icon must include a non-empty base64 payload');
      }
      const normalizedPayload = decoded.toString('base64').replace(/=+$/, '');
      const normalizedInput = payload.replace(/=+$/, '');
      if (normalizedPayload !== normalizedInput) {
        throw new Error('Token metadata icon payload is not valid base64');
      }
    } catch (err) {
      throw new Error('Token metadata icon payload is not valid base64');
    }
  }
}
