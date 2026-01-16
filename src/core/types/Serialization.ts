import { Type } from "typescript";
import { Base16, PBinaryReader, PBinaryWriter } from "./Extensions/index.js";
import { Timestamp } from "./Timestamp.js";
import { ISerializable } from "../interfaces/index.js";
import { stringToUint8Array, uint8ArrayToBytes } from "../utils/index.js";

export interface CustomReader {
  (reader: PBinaryReader): any;
}
export interface CustomWriter {
  (writer: PBinaryWriter, obj: any): void;
}
//function CustomWriter(writer: PBinaryWriter, obj: any): void;
//function CustomReader(reader: PBinaryReader): any;

export class CustomSerializer {
  readonly Read: CustomReader;
  readonly Write: CustomWriter;
  constructor(reader: CustomReader, writer: CustomWriter) {
    this.Read = reader;
    this.Write = writer;
  }
}

export class Serialization<T> {
  private static _customSerializers: Map<string, CustomSerializer> = new Map<
    string,
    CustomSerializer
  >(); //: { [key: string]: CustomSerializer };

  static RegisterType<T>(type: T, reader: CustomReader, writer: CustomWriter) {
    Serialization._customSerializers[typeof type] = new CustomSerializer(
      reader,
      writer
    );
  }

  static SerializeEnum(obj: any): Uint8Array {
    if (!obj) {
      return new Uint8Array();
    }

    if (obj instanceof Uint8Array) {
      return obj;
    }

    let writer = new PBinaryWriter();
    writer.writeEnum(obj);
    return writer.toUint8Array();
  }

  static Serialize(obj: any): Uint8Array {
    if (!obj) {
      return new Uint8Array();
    }

    if (obj instanceof Uint8Array) {
      return obj;
    }

    //let jsonString = JSON.stringify(obj);
    let writer = new PBinaryWriter();
    this.SerializeObject(writer, obj, typeof obj);
    //let jsonAsUint8 = new TextEncoder().encode(jsonString);
    return writer.toUint8Array();
  }

  static SerializeObject(writer: PBinaryWriter, obj: any, type: any | null) {
    if (type == null || type == undefined) {
      type = typeof obj;
      this.SerializeObject(writer, obj, type);
      return;
    }

    if (Serialization._customSerializers.has(typeof type)) {
      var serializer = Serialization._customSerializers[typeof type];
      serializer.Write(writer, obj);
      return;
    }

    /*if (typeof obj == "void") {
      return;
    }*/
    const structType: any = Object.getPrototypeOf(obj).constructor.name;
    const result = Object.apply(structType);
    let localType = Object.apply(typeof type);
    //console.log(localType);

    if (obj instanceof Boolean || typeof obj == "boolean") {
      writer.writeByte(obj ? 1 : 0);
      return;
    } else if (obj instanceof Number || typeof obj == "number") {
      writer.writeByte(stringToUint8Array(obj.toString()).length);
      writer.writeVarInt(obj as number);
      return;
    } else if (obj instanceof BigInt || typeof obj == "bigint") {
      writer.writeBigInteger(obj);
    } else if (obj instanceof String || typeof obj == "string") {
      writer.writeString(obj as string);
      return;
    } else if (obj instanceof Timestamp) {
      writer.writeTimestamp(obj);
      return;
    } else if (obj instanceof Date) {
      writer.writeDateTime(obj);
      return;
    } else if (
      typeof obj.UnserializeData === "function" &&
      typeof obj.SerializeData === "function"
    ) {
      (obj as ISerializable).SerializeData(writer);
      return;
    } else if (Array.isArray(obj)) {
      writer.writeVarInt(obj.length);
      obj.forEach((entry) => {
        this.SerializeObject(writer, entry, typeof entry);
      });
      return;
    } else if (Object.getPrototypeOf(type) == "enum") {
      writer.writeByte(obj as unknown as number);
      return;
    } else if (obj instanceof Uint8Array) {
      writer.writeByteArray(Array.from(obj));
    } else {
      // TODO: Add support for other types
      // Get the keys of the object
      const fields = Object.keys(obj);
      fields.forEach((field) => {
        let value = obj[field];
        this.SerializeObject(writer, value, typeof value);
      });
    }
  }

  static Unserialize<T>(
    bytesOrBytes: Uint8Array | PBinaryReader,
    type?: any
  ): T {
    if (bytesOrBytes instanceof PBinaryReader) {
      return Serialization.UnserializeObject(bytesOrBytes, type) as T;
    }
    if (!bytesOrBytes || bytesOrBytes.length === 0) {
      return null as T;
    }
    //let type = Object.prototype.propertyIsEnumerable(T);
    let stream: PBinaryReader = new PBinaryReader(bytesOrBytes);
    return Serialization.UnserializeObject<T>(stream, type) as T;
  }

  static UnserializeObject<T extends any>(reader: PBinaryReader, type: any): T {
    if (Serialization._customSerializers.has(typeof type)) {
      var serializer = Serialization._customSerializers[typeof type];
      return serializer.Read(reader);
    }

    if (type == null || type == undefined) {
      return null as T;
    }

    let localType; //: typeof type;

    if (type.name != undefined) {
      let className = type.name as T;
      localType = Object.apply(className);
    } else {
      localType = new type();
    }

    if (
      localType instanceof Boolean ||
      typeof localType == "boolean" ||
      type.name == "Boolean"
    ) {
      return reader.readBoolean() as unknown as T;
    } else if (localType instanceof Number || typeof localType == "number") {
      return reader.readVarInt() as unknown as T;
    } else if (localType instanceof BigInt || typeof localType == "bigint") {
      return reader.readBigInteger() as unknown as T;
    } else if (localType instanceof String || typeof localType == "string") {
      return reader.readVarString() as unknown as T;
    } else if (localType instanceof Timestamp) {
      return new Timestamp(reader.readVarInt()) as unknown as T;
    } else if (
      typeof localType.UnserializeData === "function" &&
      typeof localType.SerializeData === "function"
    ) {
      let obj = localType;
      obj.UnserializeData(reader);
      return obj as T;
    } else if (Array.isArray(type)) {
      var len = reader.readByte();
      var arr = new Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = this.UnserializeObject(reader, type[i]);
      }
      return arr as unknown as T;
    } else if (Object.getPrototypeOf(type) == "enum") {
      return reader.readByte() as unknown as T;
    } else {
      const fields = Object.keys(localType as T);
      /*console.log(fields);
      fields.forEach((field) => {
        localType[field] = this.UnserializeObject(
          reader,
          typeof localType[field]
        );
      });
      return localType as T;*/
    }
  }
}
