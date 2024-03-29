import { VMType } from "./VMType";
import { Timestamp } from "../types/Timestamp";
import { PBinaryReader, PBinaryWriter } from "../types";
import { ISerializable } from "../interfaces";
import { Type } from "typescript";
export declare class VMObject implements ISerializable {
    Type: VMType;
    Data: object | null | undefined;
    get IsEmpty(): boolean;
    private _localSize;
    private static readonly TimeFormat;
    GetChildren(): Map<VMObject, VMObject> | null;
    get Size(): number;
    constructor();
    AsTimestamp(): Timestamp;
    AsByteArray(): Uint8Array;
    AsString(): string;
    ToString(): string;
    AsNumber(): number;
    AsEnum<T extends any>(): T;
    GetArrayType(): VMType;
    AsType(type: VMType): any;
    static isEnum(instance: any): boolean;
    AsBool(): boolean;
    static isStructOrClass(type: Type): boolean;
    static isSerializable(type: any): boolean;
    static isPrimitive(type: any): boolean;
    static isValueType(type: any): boolean;
    static isClass(type: any): boolean;
    static isInterface(type: any): boolean;
    private static ConvertObjectInternal;
    ToArray(arrayElementType: any): any[];
    ToObjectType(type: any): any;
    ToObject(): any;
    ToStruct<T>(structType: any): T;
    static GetVMType(type: any): any;
    static IsVMType(type: any): boolean;
    SetValue(value: any): VMObject;
    setValue(val: any, type: VMType): void;
    static ValidateStructKey(key: VMObject): void;
    CastViaReflection(srcObj: any, level: number, dontConvertSerializables?: boolean): any;
    SetKey(key: VMObject, obj: VMObject): void;
    Copy(other: VMObject): void;
    SetType(type: VMType): void;
    static FromArray(array: Array<any>): VMObject;
    static CastTo(srcObj: VMObject, type: VMType): VMObject;
    static FromObject(obj: any): any;
    static FromEnum(obj: any): VMObject;
    static FromStruct(obj: any): VMObject;
    static FromBytes(bytes: any): VMObject;
    SerializeData(writer: PBinaryWriter): Uint8Array;
    SerializeObjectCall(writer: PBinaryWriter): Uint8Array;
    UnserializeData(reader: PBinaryReader): void;
}
//# sourceMappingURL=VMObject.d.ts.map