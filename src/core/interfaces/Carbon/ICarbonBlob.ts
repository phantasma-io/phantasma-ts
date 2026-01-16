import { CarbonBinaryReader, CarbonBinaryWriter } from '../../types/CarbonSerialization.js';

export interface ICarbonBlob {
  write(w: CarbonBinaryWriter): void;
  read(r: CarbonBinaryReader): void;
}
