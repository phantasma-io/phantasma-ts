import { ISerializable } from '../interfaces';
import { VMType } from '../vm/VMType';
import { BinaryReader, BinaryWriter, Encoding } from 'csharp-binary-stream';
import { arrayNumberToUint8Array, uint8ArrayToNumberArray } from '../utils';
import { TokenTrigger } from './DomainSettings';
import { PBinaryReader, PBinaryWriter } from './Extensions';

export class ContractParameter {
  name: string;
  type: VMType;

  constructor(name: string, type: VMType) {
    this.name = name;
    this.type = type;
  }
}

export class ContractInterface implements ISerializable {
  public static readonly Empty: ContractInterface = new ContractInterface([], []);
  private _methods = new Map<string, ContractMethod>();
  public Methods = Array.from(this._methods.values());
  public MethodCount = this._methods.size;

  private _events: ContractEvent[];
  public Events(): ContractEvent[] {
    return this._events;
  }

  public EventCount() {
    return this._events.length;
  }

  public newEmpty() {
    this._methods = new Map<string, ContractMethod>();
    this._events = [];
  }

  public constructor(methods: ContractMethod[], events: ContractEvent[]) {
    for (const entry of methods) {
      this._methods.set(entry.name, entry);
    }
    this._events = events;
  }

  public get(name: string): ContractMethod | null {
    return this.FindMethod(name);
  }
  public HasMethod(name: string): boolean {
    return this._methods.has(name);
  }

  public HasTokenTrigger(trigger: TokenTrigger): boolean {
    const strName = trigger.toString();
    const name = strName[0].toLowerCase() + strName.slice(1);
    return this._methods.has(name);
  }

  public FindMethod(name: string): ContractMethod | null {
    if (this._methods.has(name)) {
      return this._methods.get(name);
    }
    return null;
  }

  public FindEvent(value: number): ContractEvent | null {
    for (const evt of this._events) {
      if (evt.value === value) {
        return evt;
      }
    }
    return null;
  }

  public ImplementsEvent(evt: ContractEvent): boolean {
    for (const entry of this.Events()) {
      if (
        entry.name === evt.name &&
        entry.value === evt.value &&
        entry.returnType === evt.returnType
      ) {
        return true;
      }
    }
    return false;
  }

  public ImplementsMethod(method: ContractMethod): boolean {
    if (!this._methods.has(method.name)) {
      return false;
    }
    const thisMethod = this._methods.get(method.name);
    if (thisMethod.parameters.length !== method.parameters.length) {
      return false;
    }

    for (let i = 0; i < method.parameters.length; i++) {
      if (thisMethod.parameters[i].type !== method.parameters[i].type) {
        return false;
      }
    }

    return true;
  }

  public ImplementsInterface(other: ContractInterface): boolean {
    for (const method of other.Methods) {
      if (!this.ImplementsMethod(method)) {
        return false;
      }
    }

    for (const evt of other.Events()) {
      if (!this.ImplementsEvent(evt)) {
        return false;
      }
    }

    return true;
  }

  public UnserializeData(reader: PBinaryReader): void {
    const len = reader.readByte();
    this._methods.clear();
    for (let i = 0; i < len; i++) {
      const method = ContractMethod.Unserialize(reader);
      this._methods.set(method.name, method);
    }
    const eventLen = reader.readByte();
    this._events = [];
    for (let i = 0; i < eventLen; i++) {
      this._events.push(ContractEvent.Unserialize(reader));
    }
  }
  public SerializeData(writer: PBinaryWriter): void {
    writer.writeByte(this._methods.size);
    for (const [_, value] of this._methods) {
      value.Serialize(writer);
    }
    writer.writeByte(this._events.length);
    for (const entry of this._events) {
      entry.Serialize(writer);
    }
  }
}

export class ContractMethod implements ISerializable {
  public name: string;
  public returnType: VMType;
  public parameters: ContractParameter[];
  public offset: number;

  SerializeData(writer: PBinaryWriter) {
    this.Serialize(writer);
  }
  UnserializeData(reader: PBinaryReader) {
    return ContractMethod.Unserialize(reader);
  }

  public constructorOne(
    name: string,
    returnType: VMType,
    labels: Map<string, number>,
    parameters: ContractParameter[]
  ) {
    if (!labels.has(name)) {
      throw new Error(`Missing offset in label map for method ${name}`);
    }

    const offset = labels.get(name);

    this.name = name;
    this.offset = offset;
    this.returnType = returnType;
    this.parameters = parameters;
  }

  constructor(name: string, returnType: VMType, offset: number, parameters: ContractParameter[]) {
    this.name = name;
    this.offset = offset;
    this.returnType = returnType;
    this.parameters = parameters;
  }

  public isProperty(): boolean {
    if (
      this.name.length >= 4 &&
      this.name.startsWith('get') &&
      this.name[3] === this.name[3].toUpperCase()
    ) {
      return true;
    }

    if (
      this.name.length >= 3 &&
      this.name.startsWith('is') &&
      this.name[2] === this.name[2].toUpperCase()
    ) {
      return true;
    }

    return false;
  }

  public isTrigger(): boolean {
    if (
      this.name.length >= 3 &&
      this.name.startsWith('on') &&
      this.name[2] === this.name[2].toUpperCase()
    ) {
      return true;
    }

    return false;
  }

  public toString(): string {
    return `${this.name} : ${this.returnType}`;
  }

  public static fromBytes(bytes: Uint8Array): ContractMethod {
    const stream = new Uint8Array(bytes);
    const reader = new PBinaryReader(stream);
    return ContractMethod.Unserialize(reader);
  }

  public static Unserialize(reader: PBinaryReader): ContractMethod {
    const name = reader.readString();
    const returnType = reader.readByte() as VMType;
    const offset = reader.readInt();
    const len = reader.readByte();
    const parameters: ContractParameter[] = new Array(len);
    for (let i = 0; i < len; i++) {
      const pName = reader.readString();
      const pVMType = reader.readByte() as VMType;
      parameters[i] = new ContractParameter(pName, pVMType);
    }

    return new ContractMethod(name, returnType, offset, parameters);
  }

  public Serialize(writer: PBinaryWriter): void {
    writer.writeString(this.name);
    writer.writeByte(this.returnType);
    writer.writeInt(this.offset);
    writer.writeByte(this.parameters.length);
    this.parameters.forEach((entry) => {
      writer.writeString(entry.name);
      writer.writeByte(entry.type);
    });
  }

  public toArray(): Uint8Array {
    const stream = new Uint8Array();
    const writer = new PBinaryWriter(stream);
    this.Serialize(writer);
    return stream;
  }
}

export class ContractEvent implements ISerializable {
  public readonly value: number;
  public readonly name: string;
  public readonly returnType: VMType;
  public readonly description: Uint8Array;

  constructor(value: number, name: string, returnType: VMType, description: Uint8Array) {
    this.value = value;
    this.name = name;
    this.returnType = returnType;
    this.description = description;
  }

  SerializeData(writer: PBinaryWriter) {
    this.Serialize(writer);
  }

  UnserializeData(reader: PBinaryReader) {
    return ContractEvent.Unserialize(reader);
  }

  public toString(): string {
    return `${this.name} : ${this.returnType} => ${this.value}`;
  }

  public static Unserialize(reader: PBinaryReader): ContractEvent {
    const value = reader.readByte();
    const name = reader.readString();
    const returnType = reader.readByte() as VMType;
    const description = reader.readBytes(reader.readByte());

    return new ContractEvent(value, name, returnType, arrayNumberToUint8Array(description));
  }

  public Serialize(writer: PBinaryWriter): void {
    writer.writeByte(this.value);
    writer.writeString(this.name);
    writer.writeByte(this.returnType);
    writer.writeByte(this.description.length);
    writer.writeBytes(uint8ArrayToNumberArray(this.description));
  }
}
