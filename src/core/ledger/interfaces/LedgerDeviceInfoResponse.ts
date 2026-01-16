import { VersionResponse } from './VersionResponse.js';
import { ApplicationNameResponse } from './ApplicationNameResponse.js';

export interface LedgerDeviceInfoResponse {
  version: VersionResponse;
  applicationName: ApplicationNameResponse;
}
