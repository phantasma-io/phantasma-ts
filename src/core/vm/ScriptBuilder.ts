import base58 from 'bs58';
import { ISerializable } from '../interfaces';
import { Address, PBinaryWriter, Serialization, Timestamp } from '../types';
import { numberToByteArray, stringToUint8Array, bytesToHex } from '../utils';
import { Opcode } from './Opcode';
import { VMObject } from './VMObject';
import { VMType } from './VMType';
import { Contracts } from './Contracts';

type byte = number;

const MaxRegisterCount = 32;

export class ScriptBuilder {
  _labelLocations: { [id: string]: number } = {};
  _jumpLocations: { [id: number]: string } = {};

  public str: string;

  public writer: PBinaryWriter;

  public NullAddress = 'S1111111111111111111111111111111111';

  public static ScriptBuilder(): ScriptBuilder {
    return new ScriptBuilder();
  }

  public constructor() {
    this.str = '';
    this.writer = new PBinaryWriter();
  }

  public BeginScript() {
    this.str = '';
    this.writer = new PBinaryWriter();
    return this;
  }

  public GetScript(): string {
    return bytesToHex(this.writer.toUint8Array());
  }

  public EndScript(): string {
    this.Emit(Opcode.RET);
    return bytesToHex(this.writer.toUint8Array()).toUpperCase();
  }

  public Emit(opcode: Opcode, bytes?: number[]): this {
    this.AppendByte(opcode);
    if (bytes) {
      this.EmitBytes(bytes);
    }
    return this;
  }

  public EmitThorw(reg: byte): this {
    this.Emit(Opcode.THROW);
    this.AppendByte(reg);
    return this;
  }

  public EmitPush(reg: byte): this {
    this.Emit(Opcode.PUSH);
    this.AppendByte(reg);
    return this;
  }

  public EmitPop(reg: byte): this {
    this.Emit(Opcode.POP);
    this.AppendByte(reg);
    return this;
  }

  public EmitExtCall(method: string, reg: byte = 0): this {
    this.EmitLoad(reg, method);
    this.Emit(Opcode.EXTCALL);
    this.AppendByte(reg);
    return this;
  }

  public EmitBigInteger(value: string) {
    let bytes: number[] = [];

    if (value == '0') {
      bytes = [0];
    } else if (value.startsWith('-1')) {
      throw new Error('Unsigned bigint serialization not suppoted');
    } else {
      let hex = BigInt(value).toString(16);
      if (hex.length % 2) hex = '0' + hex;
      const len = hex.length / 2;
      var i = 0;
      var j = 0;
      while (i < len) {
        bytes.unshift(parseInt(hex.slice(j, j + 2), 16)); // little endian
        i += 1;
        j += 2;
      }
      bytes.push(0); // add sign at the end
    }
    return this.EmitByteArray(bytes);
  }

  public EmitAddress(textAddress: string) {
    const bytes = [...base58.decode(textAddress.substring(1))];
    return this.EmitByteArray(bytes);
  }

  RawString(value: string) {
    //let bytes = stringToUint8Array(value);
    //console.log(Array.from(bytes))
    //return Array.from(bytes);
    var data = [];
    for (var i = 0; i < value.length; i++) {
      data.push(value.charCodeAt(i));
    }
    return data;
  }

  public EmitLoad(reg: number, obj: any): this {
    let structType = Object.getPrototypeOf(obj).constructor.name;

    switch (typeof obj) {
      case 'string': {
        let bytes = this.RawString(obj);
        this.EmitLoadBytes(reg, bytes, VMType.String);
        break;
      }

      case 'boolean': {
        let bytes = [(obj as boolean) ? 1 : 0];
        this.EmitLoadBytes(reg, bytes, VMType.Bool);
        break;
      }

      case 'number': {
        // obj is BigInteger
        // var bytes = val.ToSignedByteArray();
        // this.emitLoadBytes(reg, bytes, VMType.Number);
        //let bytes = this.RawString(BigInt(obj).toString());
        if (Object.getPrototypeOf(structType).constructor.name == 'enum') {
          this.AppendByte(obj);
        } else {
          // this.EmitLoadVarInt(reg, obj);
          let bytes = this.RawString(obj.toString());
          this.EmitLoadBytes(reg, bytes, VMType.String);
        }
        break;
      }

      case 'object':
        if (obj instanceof Uint8Array) {
          this.EmitLoadBytes(reg, Array.from(obj));
        } else if (obj instanceof VMObject) {
          this.EmitLoadVMObject(reg, obj);
        } else if (Array.isArray(obj)) {
          this.EmitLoadArray(reg, obj);
        } else if (obj instanceof Date || obj instanceof Timestamp) {
          this.EmitLoadTimestamp(reg, obj);
        } else if (obj instanceof Address) {
          this.EmitLoadAddress(reg, obj);
        } else if (
          (typeof obj.UnserializeData === 'function' && typeof obj.SerializeData === 'function') ||
          obj instanceof ISerializable
        ) {
          this.EmitLoadISerializable(reg, obj);
        } else {
          if (Array.isArray(obj)) {
            this.EmitLoadArray(reg, obj);
          } else {
            throw Error('Load type ' + typeof obj + ' not supported');
          }
        }
        break;
      default:
        throw Error('Load type ' + typeof obj + ' not supported');
    }
    return this;
  }

  public EmitLoadBytes(reg: number, bytes: byte[], type: VMType = VMType.Bytes): this {
    if (bytes.length > 0xffff) throw new Error('tried to load too much data');
    this.Emit(Opcode.LOAD);
    this.AppendByte(reg);
    this.AppendByte(type);

    this.EmitVarInt(bytes.length);
    this.EmitBytes(bytes);
    return this;
  }

  public EmitLoadArray(reg: number, obj: any): this {
    this.Emit(Opcode.CAST, [reg, reg, VMType.None]);

    for (let i = 0; i < obj.length; i++) {
      let element = obj[i];
      let temp_regVal = reg + 1;
      let temp_regKey = reg + 2;

      this.EmitLoad(temp_regVal, element);
      this.EmitLoad(temp_regKey, i);
      this.Emit(Opcode.PUT, [temp_regVal, reg, temp_regKey]);
      //this.EmitLoad(reg, element);
      //this.EmitPush(reg);
      //reg++;
    }

    return this;
  }

  public EmitLoadISerializable(reg: number, obj: ISerializable): this {
    let writer: PBinaryWriter = new PBinaryWriter();
    obj.SerializeData(writer);
    this.EmitLoadBytes(reg, writer.toArray(), VMType.Bytes);
    return this;
  }

  public EmitLoadVMObject(reg: number, obj: VMObject): this {
    let writer: PBinaryWriter = new PBinaryWriter();
    let result = obj.SerializeObjectCall(writer);

    this.Emit(Opcode.LOAD);
    this.AppendByte(reg);
    this.AppendByte(obj.Type);

    if (result == undefined) {
      //console.log("enter");
      if (obj.Data instanceof Map || (obj.Data instanceof Map && obj.Data instanceof VMObject)) {
        let resultData = obj.Data as Map<VMObject, VMObject>;
        this.EmitVarInt(resultData.size);
        for (let entry of resultData) {
          //console.log(entry[0]);
          let key = entry[0];
          let value = entry[1];
          this.EmitLoadVMObject(reg + 1, key);
          this.EmitLoadVMObject(reg + 2, value);
          this.Emit(Opcode.PUT, [reg + 1, reg, reg + 2]);
        }
      } else if (obj.Data instanceof VMObject) {
        let writerNew: PBinaryWriter = new PBinaryWriter();
        let bytes = obj.Data.SerializeData(writerNew);
        //console.log(bytes.length);
        this.EmitVarInt(bytes.length);
        this.AppendBytes(Array.from(bytes));
      }
    } else {
      //console.log("reg", reg);

      var bytes = Array.from(result);
      //console.log(bytes.length);
      this.EmitVarInt(bytes.length);
      this.AppendBytes(bytes);
    }
    //this.EmitLoadBytes(reg, Array.from(result), obj.Type);
    return this;
  }

  public EmitLoadEnum(reg: number, enumVal: number): this {
    // var temp = Convert.ToUInt32(enumVal);
    // var bytes = BitConverter.GetBytes(temp);

    let bytes = [0, 0, 0, 0];

    for (let i = 0; i < bytes.length; i++) {
      var byte = enumVal & 0xff;
      bytes[i] = byte;
      enumVal = (enumVal - byte) / 256;
    }

    this.EmitLoadBytes(reg, bytes, VMType.Enum);
    return this;
  }

  public EmitLoadAddress(reg: number, obj: Address): this {
    let writer = new PBinaryWriter();
    obj.SerializeData(writer);
    let byteArray = Array.from(writer.toUint8Array());
    this.EmitLoadBytes(reg, byteArray, VMType.Bytes);
    return this;
  }

  public EmitLoadTimestamp(reg: number, obj: Date | Timestamp): this {
    if (obj instanceof Timestamp) {
      let bytes = Array.from(Serialization.Serialize(obj));
      this.EmitLoadBytes(reg, bytes, VMType.Timestamp);
    } else if (obj instanceof Date) {
      let num = (obj.getTime() / 1000) | 0;

      let a = (num & 0xff000000) >> 24;
      let b = (num & 0x00ff0000) >> 16;
      let c = (num & 0x0000ff00) >> 8;
      let d = num & 0x000000ff;

      let bytes = [d, c, b, a];
      this.EmitLoadBytes(reg, bytes, VMType.Timestamp);
    }
    return this;
  }

  public EmitLoadVarInt(reg: number, val: number): this {
    let bytes = numberToByteArray(val);

    this.Emit(Opcode.LOAD);
    this.AppendByte(reg);
    this.AppendByte(VMType.Number);

    this.AppendByte(bytes.length);
    this.EmitBytes(Array.from(bytes));
    return this;
  }

  public EmitMove(src_reg: number, dst_reg: number): this {
    this.Emit(Opcode.MOVE);
    this.AppendByte(src_reg);
    this.AppendByte(dst_reg);
    return this;
  }

  public EmitCopy(src_reg: number, dst_reg: number): this {
    this.Emit(Opcode.COPY);
    this.AppendByte(src_reg);
    this.AppendByte(dst_reg);
    return this;
  }

  public EmitLabel(label: string): this {
    this.Emit(Opcode.NOP);
    this._labelLocations[label] = this.str.length;
    return this;
  }

  public EmitJump(opcode: Opcode, label: string, reg: number = 0): this {
    switch (opcode) {
      case Opcode.JMP:
      case Opcode.JMPIF:
      case Opcode.JMPNOT:
        this.Emit(opcode);
        break;

      default:
        throw new Error('Invalid jump opcode: ' + opcode);
    }

    if (opcode != Opcode.JMP) {
      this.AppendByte(reg);
    }

    var ofs = this.str.length;
    this.AppendUshort(0);
    this._jumpLocations[ofs] = label;
    return this;
  }

  public EmitCall(label: string, regCount: byte): this {
    if (regCount < 1 || regCount > MaxRegisterCount) {
      throw new Error('Invalid number of registers');
    }

    var ofs = this.str.length; //(int)stream.Position;
    ofs += 2;
    this.Emit(Opcode.CALL);
    this.AppendByte(regCount);
    this.AppendUshort(0);

    this._jumpLocations[ofs] = label;
    return this;
  }

  public EmitConditionalJump(opcode: Opcode, src_reg: byte, label: string): this {
    if (opcode != Opcode.JMPIF && opcode != Opcode.JMPNOT) {
      throw new Error('Opcode is not a conditional jump');
    }

    var ofs = this.str.length;
    ofs += 2;

    this.Emit(opcode);
    this.AppendByte(src_reg);
    this.AppendUshort(0);
    this._jumpLocations[ofs] = label;
    return this;
  }

  public InsertMethodArgs(args: any[]) {
    let temp_reg = 0;
    for (let i = args.length - 1; i >= 0; i--) {
      let arg = args[i];
      this.EmitLoad(temp_reg, arg);
      this.EmitPush(temp_reg);
    }
  }

  public CallInterop(method: string, args: any[]): this {
    this.InsertMethodArgs(args);

    let dest_reg = 0;
    this.EmitLoad(dest_reg, method);

    this.Emit(Opcode.EXTCALL, [dest_reg]);
    return this;
  }

  public CallContract(contractName: string, method: string, args: any[]) {
    this.InsertMethodArgs(args);

    let temp_reg = 0;
    this.EmitLoad(temp_reg, method);
    this.EmitPush(temp_reg);

    let src_reg = 0;
    let dest_reg = 1;
    this.EmitLoad(src_reg, contractName);
    this.Emit(Opcode.CTX, [src_reg, dest_reg]);

    this.Emit(Opcode.SWITCH, [dest_reg]);
    return this;
  }

  //#region ScriptBuilderExtensions

  public AllowGas(
    from: string | Address,
    to: string | Address,
    gasPrice: number,
    gasLimit: number
  ): this {
    return this.CallContract(Contracts.GasContractName, 'AllowGas', [from, to, gasPrice, gasLimit]);
  }

  public SpendGas(address: string | Address): this {
    return this.CallContract(Contracts.GasContractName, 'SpendGas', [address]);
  }

  async CallRPC<T>(methodName: string, params: any[]): Promise<T> {
    return 'bla' as unknown as T;
  }

  async GetAddressTransactionCount(address: string, chainInput: string): Promise<number> {
    let params = [address, chainInput];
    return await this.CallRPC<number>('getAddressTransactionCount', params);
  }

  //#endregion

  public EmitTimestamp(obj: Date): this {
    let num = (obj.getTime() / 1000) | 0;

    let a = (num & 0xff000000) >> 24;
    let b = (num & 0x00ff0000) >> 16;
    let c = (num & 0x0000ff00) >> 8;
    let d = num & 0x000000ff;

    let bytes = [d, c, b, a];
    this.AppendBytes(bytes);
    return this;
  }

  public EmitByteArray(bytes: number[]) {
    this.EmitVarInt(bytes.length);
    this.EmitBytes(bytes);
    return this;
  }

  public EmitVarString(text: string): this {
    let bytes = this.RawString(text);
    this.EmitVarInt(bytes.length);
    this.EmitBytes(bytes);
    return this;
  }

  public EmitVarInt(value: number): this {
    if (value < 0) throw 'negative value invalid';

    if (value < 0xfd) {
      this.AppendByte(value);
    } else if (value <= 0xffff) {
      let B = (value & 0x0000ff00) >> 8;
      let A = value & 0x000000ff;

      // TODO check if the endianess is correct, might have to reverse order of appends
      this.AppendByte(0xfd);
      this.AppendByte(A);
      this.AppendByte(B);
    } else if (value <= 0xffffffff) {
      let C = (value & 0x00ff0000) >> 16;
      let B = (value & 0x0000ff00) >> 8;
      let A = value & 0x000000ff;

      // TODO check if the endianess is correct, might have to reverse order of appends
      this.AppendByte(0xfe);
      this.AppendByte(A);
      this.AppendByte(B);
      this.AppendByte(C);
    } else {
      let D = (value & 0xff000000) >> 24;
      let C = (value & 0x00ff0000) >> 16;
      let B = (value & 0x0000ff00) >> 8;
      let A = value & 0x000000ff;

      // TODO check if the endianess is correct, might have to reverse order of appends
      this.AppendByte(0xff);
      this.AppendByte(A);
      this.AppendByte(B);
      this.AppendByte(C);
      this.AppendByte(D);
    }
    return this;
  }

  public EmitUInt32(value: number): this {
    if (value < 0) throw 'negative value invalid';

    let D = (value & 0xff000000) >> 24;
    let C = (value & 0x00ff0000) >> 16;
    let B = (value & 0x0000ff00) >> 8;
    let A = value & 0x000000ff;

    // TODO check if the endianess is correct, might have to reverse order of appends
    this.AppendByte(0xff);
    this.AppendByte(A);
    this.AppendByte(B);
    this.AppendByte(C);
    this.AppendByte(D);

    return this;
  }

  EmitBytes(bytes: byte[]): this {
    for (let i = 0; i < bytes.length; i++) this.AppendByte(bytes[i]);

    // writer.Write(bytes);
    return this;
  }

  //Custom Modified
  ByteToHex(byte: number) {
    let result = ('0' + (byte & 0xff).toString(16)).slice(-2);
    return result;
  }

  AppendByte(byte: number) {
    this.str += this.ByteToHex(byte);
    this.writer.writeByte(byte);
  }

  //Custom Modified
  AppendBytes(bytes: byte[]) {
    for (let i = 0; i < bytes.length; i++) {
      this.AppendByte(bytes[i]);
    }
  }

  AppendUshort(ushort: number) {
    this.str += this.ByteToHex(ushort & 0xff) + this.ByteToHex((ushort >> 8) & 0xff);
    this.writer.writeUnsignedShort(ushort);
  }

  AppendHexEncoded(bytes: string): this {
    this.str += bytes;
    this.writer.writeBytes(Array.from(stringToUint8Array(bytes)));
    return this;
  }
}
