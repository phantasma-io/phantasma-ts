import { PBinaryReader, PBinaryWriter } from "../types/Extensions/index.js";

export abstract class ISerializable {
  abstract SerializeData(writer: PBinaryWriter);
  abstract UnserializeData(reader: PBinaryReader);
}
