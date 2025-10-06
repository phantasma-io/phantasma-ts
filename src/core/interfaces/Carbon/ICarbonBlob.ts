import { CarbonBinaryReader, CarbonBinaryWriter } from '../../types/CarbonSerialization';

export interface ICarbonBlob {
  write(w: CarbonBinaryWriter): void;
  read(r: CarbonBinaryReader): void;
}
