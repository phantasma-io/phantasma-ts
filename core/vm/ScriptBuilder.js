"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptBuilder = void 0;
var bs58_1 = __importDefault(require("bs58"));
var interfaces_1 = require("../interfaces");
var types_1 = require("../types");
var utils_1 = require("../utils");
var Opcode_1 = require("./Opcode");
var VMObject_1 = require("./VMObject");
var VMType_1 = require("./VMType");
var Contracts_1 = require("./Contracts");
var MaxRegisterCount = 32;
var ScriptBuilder = /** @class */ (function () {
    function ScriptBuilder() {
        this._labelLocations = {};
        this._jumpLocations = {};
        this.NullAddress = 'S1111111111111111111111111111111111';
        this.str = '';
        this.writer = new types_1.PBinaryWriter();
    }
    ScriptBuilder.ScriptBuilder = function () {
        return new ScriptBuilder();
    };
    ScriptBuilder.prototype.BeginScript = function () {
        this.str = '';
        this.writer = new types_1.PBinaryWriter();
        return this;
    };
    ScriptBuilder.prototype.GetScript = function () {
        return (0, utils_1.uint8ArrayToHex)(this.writer.toUint8Array());
    };
    ScriptBuilder.prototype.EndScript = function () {
        this.Emit(Opcode_1.Opcode.RET);
        return (0, utils_1.uint8ArrayToHex)(this.writer.toUint8Array()).toUpperCase();
    };
    ScriptBuilder.prototype.Emit = function (opcode, bytes) {
        this.AppendByte(opcode);
        if (bytes) {
            this.EmitBytes(bytes);
        }
        return this;
    };
    ScriptBuilder.prototype.EmitThorw = function (reg) {
        this.Emit(Opcode_1.Opcode.THROW);
        this.AppendByte(reg);
        return this;
    };
    ScriptBuilder.prototype.EmitPush = function (reg) {
        this.Emit(Opcode_1.Opcode.PUSH);
        this.AppendByte(reg);
        return this;
    };
    ScriptBuilder.prototype.EmitPop = function (reg) {
        this.Emit(Opcode_1.Opcode.POP);
        this.AppendByte(reg);
        return this;
    };
    ScriptBuilder.prototype.EmitExtCall = function (method, reg) {
        if (reg === void 0) { reg = 0; }
        this.EmitLoad(reg, method);
        this.Emit(Opcode_1.Opcode.EXTCALL);
        this.AppendByte(reg);
        return this;
    };
    ScriptBuilder.prototype.EmitBigInteger = function (value) {
        var bytes = [];
        if (value == '0') {
            bytes = [0];
        }
        else if (value.startsWith('-1')) {
            throw new Error('Unsigned bigint serialization not suppoted');
        }
        else {
            var hex = BigInt(value).toString(16);
            if (hex.length % 2)
                hex = '0' + hex;
            var len = hex.length / 2;
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
    };
    ScriptBuilder.prototype.EmitAddress = function (textAddress) {
        var bytes = __spreadArray([], __read(bs58_1.default.decode(textAddress.substring(1))), false);
        return this.EmitByteArray(bytes);
    };
    ScriptBuilder.prototype.RawString = function (value) {
        //let bytes = stringToUint8Array(value);
        //console.log(Array.from(bytes))
        //return Array.from(bytes);
        var data = [];
        for (var i = 0; i < value.length; i++) {
            data.push(value.charCodeAt(i));
        }
        return data;
    };
    ScriptBuilder.prototype.EmitLoad = function (reg, obj) {
        var structType = Object.getPrototypeOf(obj).constructor.name;
        switch (typeof obj) {
            case 'string': {
                var bytes = this.RawString(obj);
                this.EmitLoadBytes(reg, bytes, VMType_1.VMType.String);
                break;
            }
            case 'boolean': {
                var bytes = [obj ? 1 : 0];
                this.EmitLoadBytes(reg, bytes, VMType_1.VMType.Bool);
                break;
            }
            case 'number': {
                // obj is BigInteger
                // var bytes = val.ToSignedByteArray();
                // this.emitLoadBytes(reg, bytes, VMType.Number);
                //let bytes = this.RawString(BigInt(obj).toString());
                if (Object.getPrototypeOf(structType).constructor.name == 'enum') {
                    this.AppendByte(obj);
                }
                else {
                    // this.EmitLoadVarInt(reg, obj);
                    var bytes = this.RawString(obj.toString());
                    this.EmitLoadBytes(reg, bytes, VMType_1.VMType.String);
                }
                break;
            }
            case 'object':
                if (obj instanceof Uint8Array) {
                    this.EmitLoadBytes(reg, Array.from(obj));
                }
                else if (obj instanceof VMObject_1.VMObject) {
                    this.EmitLoadVMObject(reg, obj);
                }
                else if (Array.isArray(obj)) {
                    this.EmitLoadArray(reg, obj);
                }
                else if (obj instanceof Date || obj instanceof types_1.Timestamp) {
                    this.EmitLoadTimestamp(reg, obj);
                }
                else if (obj instanceof types_1.Address) {
                    this.EmitLoadAddress(reg, obj);
                }
                else if ((typeof obj.UnserializeData === 'function' && typeof obj.SerializeData === 'function') ||
                    obj instanceof interfaces_1.ISerializable) {
                    this.EmitLoadISerializable(reg, obj);
                }
                else {
                    if (Array.isArray(obj)) {
                        this.EmitLoadArray(reg, obj);
                    }
                    else {
                        throw Error('Load type ' + typeof obj + ' not supported');
                    }
                }
                break;
            default:
                throw Error('Load type ' + typeof obj + ' not supported');
        }
        return this;
    };
    ScriptBuilder.prototype.EmitLoadBytes = function (reg, bytes, type) {
        if (type === void 0) { type = VMType_1.VMType.Bytes; }
        if (bytes.length > 0xffff)
            throw new Error('tried to load too much data');
        this.Emit(Opcode_1.Opcode.LOAD);
        this.AppendByte(reg);
        this.AppendByte(type);
        this.EmitVarInt(bytes.length);
        this.EmitBytes(bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitLoadArray = function (reg, obj) {
        this.Emit(Opcode_1.Opcode.CAST, [reg, reg, VMType_1.VMType.None]);
        for (var i = 0; i < obj.length; i++) {
            var element = obj[i];
            var temp_regVal = reg + 1;
            var temp_regKey = reg + 2;
            this.EmitLoad(temp_regVal, element);
            this.EmitLoad(temp_regKey, i);
            this.Emit(Opcode_1.Opcode.PUT, [temp_regVal, reg, temp_regKey]);
            //this.EmitLoad(reg, element);
            //this.EmitPush(reg);
            //reg++;
        }
        return this;
    };
    ScriptBuilder.prototype.EmitLoadISerializable = function (reg, obj) {
        var writer = new types_1.PBinaryWriter();
        obj.SerializeData(writer);
        this.EmitLoadBytes(reg, writer.toArray(), VMType_1.VMType.Bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitLoadVMObject = function (reg, obj) {
        var e_1, _a;
        var writer = new types_1.PBinaryWriter();
        var result = obj.SerializeObjectCall(writer);
        this.Emit(Opcode_1.Opcode.LOAD);
        this.AppendByte(reg);
        this.AppendByte(obj.Type);
        if (result == undefined) {
            //console.log("enter");
            if (obj.Data instanceof Map || (obj.Data instanceof Map && obj.Data instanceof VMObject_1.VMObject)) {
                var resultData = obj.Data;
                this.EmitVarInt(resultData.size);
                try {
                    for (var resultData_1 = __values(resultData), resultData_1_1 = resultData_1.next(); !resultData_1_1.done; resultData_1_1 = resultData_1.next()) {
                        var entry = resultData_1_1.value;
                        //console.log(entry[0]);
                        var key = entry[0];
                        var value = entry[1];
                        this.EmitLoadVMObject(reg + 1, key);
                        this.EmitLoadVMObject(reg + 2, value);
                        this.Emit(Opcode_1.Opcode.PUT, [reg + 1, reg, reg + 2]);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (resultData_1_1 && !resultData_1_1.done && (_a = resultData_1.return)) _a.call(resultData_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else if (obj.Data instanceof VMObject_1.VMObject) {
                var writerNew = new types_1.PBinaryWriter();
                var bytes_1 = obj.Data.SerializeData(writerNew);
                //console.log(bytes.length);
                this.EmitVarInt(bytes_1.length);
                this.AppendBytes(Array.from(bytes_1));
            }
        }
        else {
            //console.log("reg", reg);
            var bytes = Array.from(result);
            //console.log(bytes.length);
            this.EmitVarInt(bytes.length);
            this.AppendBytes(bytes);
        }
        //this.EmitLoadBytes(reg, Array.from(result), obj.Type);
        return this;
    };
    ScriptBuilder.prototype.EmitLoadEnum = function (reg, enumVal) {
        // var temp = Convert.ToUInt32(enumVal);
        // var bytes = BitConverter.GetBytes(temp);
        var bytes = [0, 0, 0, 0];
        for (var i = 0; i < bytes.length; i++) {
            var byte = enumVal & 0xff;
            bytes[i] = byte;
            enumVal = (enumVal - byte) / 256;
        }
        this.EmitLoadBytes(reg, bytes, VMType_1.VMType.Enum);
        return this;
    };
    ScriptBuilder.prototype.EmitLoadAddress = function (reg, obj) {
        var writer = new types_1.PBinaryWriter();
        obj.SerializeData(writer);
        var byteArray = Array.from(writer.toUint8Array());
        this.EmitLoadBytes(reg, byteArray, VMType_1.VMType.Bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitLoadTimestamp = function (reg, obj) {
        if (obj instanceof types_1.Timestamp) {
            var bytes = Array.from(types_1.Serialization.Serialize(obj));
            this.EmitLoadBytes(reg, bytes, VMType_1.VMType.Timestamp);
        }
        else if (obj instanceof Date) {
            var num = (obj.getTime() + obj.getTimezoneOffset() * 60 * 1000) / 1000;
            var a = (num & 0xff000000) >> 24;
            var b = (num & 0x00ff0000) >> 16;
            var c = (num & 0x0000ff00) >> 8;
            var d = num & 0x000000ff;
            var bytes = [d, c, b, a];
            this.EmitLoadBytes(reg, bytes, VMType_1.VMType.Timestamp);
        }
        return this;
    };
    ScriptBuilder.prototype.EmitLoadVarInt = function (reg, val) {
        var bytes = (0, utils_1.numberToByteArray)(val);
        this.Emit(Opcode_1.Opcode.LOAD);
        this.AppendByte(reg);
        this.AppendByte(VMType_1.VMType.Number);
        this.AppendByte(bytes.length);
        this.EmitBytes(Array.from(bytes));
        return this;
    };
    ScriptBuilder.prototype.EmitMove = function (src_reg, dst_reg) {
        this.Emit(Opcode_1.Opcode.MOVE);
        this.AppendByte(src_reg);
        this.AppendByte(dst_reg);
        return this;
    };
    ScriptBuilder.prototype.EmitCopy = function (src_reg, dst_reg) {
        this.Emit(Opcode_1.Opcode.COPY);
        this.AppendByte(src_reg);
        this.AppendByte(dst_reg);
        return this;
    };
    ScriptBuilder.prototype.EmitLabel = function (label) {
        this.Emit(Opcode_1.Opcode.NOP);
        this._labelLocations[label] = this.str.length;
        return this;
    };
    ScriptBuilder.prototype.EmitJump = function (opcode, label, reg) {
        if (reg === void 0) { reg = 0; }
        switch (opcode) {
            case Opcode_1.Opcode.JMP:
            case Opcode_1.Opcode.JMPIF:
            case Opcode_1.Opcode.JMPNOT:
                this.Emit(opcode);
                break;
            default:
                throw new Error('Invalid jump opcode: ' + opcode);
        }
        if (opcode != Opcode_1.Opcode.JMP) {
            this.AppendByte(reg);
        }
        var ofs = this.str.length;
        this.AppendUshort(0);
        this._jumpLocations[ofs] = label;
        return this;
    };
    ScriptBuilder.prototype.EmitCall = function (label, regCount) {
        if (regCount < 1 || regCount > MaxRegisterCount) {
            throw new Error('Invalid number of registers');
        }
        var ofs = this.str.length; //(int)stream.Position;
        ofs += 2;
        this.Emit(Opcode_1.Opcode.CALL);
        this.AppendByte(regCount);
        this.AppendUshort(0);
        this._jumpLocations[ofs] = label;
        return this;
    };
    ScriptBuilder.prototype.EmitConditionalJump = function (opcode, src_reg, label) {
        if (opcode != Opcode_1.Opcode.JMPIF && opcode != Opcode_1.Opcode.JMPNOT) {
            throw new Error('Opcode is not a conditional jump');
        }
        var ofs = this.str.length;
        ofs += 2;
        this.Emit(opcode);
        this.AppendByte(src_reg);
        this.AppendUshort(0);
        this._jumpLocations[ofs] = label;
        return this;
    };
    ScriptBuilder.prototype.InsertMethodArgs = function (args) {
        var temp_reg = 0;
        for (var i = args.length - 1; i >= 0; i--) {
            var arg = args[i];
            this.EmitLoad(temp_reg, arg);
            this.EmitPush(temp_reg);
        }
    };
    ScriptBuilder.prototype.CallInterop = function (method, args) {
        this.InsertMethodArgs(args);
        var dest_reg = 0;
        this.EmitLoad(dest_reg, method);
        this.Emit(Opcode_1.Opcode.EXTCALL, [dest_reg]);
        return this;
    };
    ScriptBuilder.prototype.CallContract = function (contractName, method, args) {
        this.InsertMethodArgs(args);
        var temp_reg = 0;
        this.EmitLoad(temp_reg, method);
        this.EmitPush(temp_reg);
        var src_reg = 0;
        var dest_reg = 1;
        this.EmitLoad(src_reg, contractName);
        this.Emit(Opcode_1.Opcode.CTX, [src_reg, dest_reg]);
        this.Emit(Opcode_1.Opcode.SWITCH, [dest_reg]);
        return this;
    };
    //#region ScriptBuilderExtensions
    ScriptBuilder.prototype.AllowGas = function (from, to, gasPrice, gasLimit) {
        return this.CallContract(Contracts_1.Contracts.GasContractName, 'AllowGas', [from, to, gasPrice, gasLimit]);
    };
    ScriptBuilder.prototype.SpendGas = function (address) {
        return this.CallContract(Contracts_1.Contracts.GasContractName, 'SpendGas', [address]);
    };
    ScriptBuilder.prototype.CallRPC = function (methodName, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, 'bla'];
            });
        });
    };
    ScriptBuilder.prototype.GetAddressTransactionCount = function (address, chainInput) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = [address, chainInput];
                        return [4 /*yield*/, this.CallRPC('getAddressTransactionCount', params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    //#endregion
    ScriptBuilder.prototype.EmitTimestamp = function (obj) {
        var num = (obj.getTime() + obj.getTimezoneOffset() * 60 * 1000) / 1000;
        var a = (num & 0xff000000) >> 24;
        var b = (num & 0x00ff0000) >> 16;
        var c = (num & 0x0000ff00) >> 8;
        var d = num & 0x000000ff;
        var bytes = [d, c, b, a];
        this.AppendBytes(bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitByteArray = function (bytes) {
        this.EmitVarInt(bytes.length);
        this.EmitBytes(bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitVarString = function (text) {
        var bytes = this.RawString(text);
        this.EmitVarInt(bytes.length);
        this.EmitBytes(bytes);
        return this;
    };
    ScriptBuilder.prototype.EmitVarInt = function (value) {
        if (value < 0)
            throw 'negative value invalid';
        if (value < 0xfd) {
            this.AppendByte(value);
        }
        else if (value <= 0xffff) {
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.AppendByte(0xfd);
            this.AppendByte(A);
            this.AppendByte(B);
        }
        else if (value <= 0xffffffff) {
            var C = (value & 0x00ff0000) >> 16;
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.AppendByte(0xfe);
            this.AppendByte(A);
            this.AppendByte(B);
            this.AppendByte(C);
        }
        else {
            var D = (value & 0xff000000) >> 24;
            var C = (value & 0x00ff0000) >> 16;
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.AppendByte(0xff);
            this.AppendByte(A);
            this.AppendByte(B);
            this.AppendByte(C);
            this.AppendByte(D);
        }
        return this;
    };
    ScriptBuilder.prototype.EmitUInt32 = function (value) {
        if (value < 0)
            throw 'negative value invalid';
        var D = (value & 0xff000000) >> 24;
        var C = (value & 0x00ff0000) >> 16;
        var B = (value & 0x0000ff00) >> 8;
        var A = value & 0x000000ff;
        // TODO check if the endianess is correct, might have to reverse order of appends
        this.AppendByte(0xff);
        this.AppendByte(A);
        this.AppendByte(B);
        this.AppendByte(C);
        this.AppendByte(D);
        return this;
    };
    ScriptBuilder.prototype.EmitBytes = function (bytes) {
        for (var i = 0; i < bytes.length; i++)
            this.AppendByte(bytes[i]);
        // writer.Write(bytes);
        return this;
    };
    //Custom Modified
    ScriptBuilder.prototype.ByteToHex = function (byte) {
        var result = ('0' + (byte & 0xff).toString(16)).slice(-2);
        return result;
    };
    ScriptBuilder.prototype.AppendByte = function (byte) {
        this.str += this.ByteToHex(byte);
        this.writer.writeByte(byte);
    };
    //Custom Modified
    ScriptBuilder.prototype.AppendBytes = function (bytes) {
        for (var i = 0; i < bytes.length; i++) {
            this.AppendByte(bytes[i]);
        }
    };
    ScriptBuilder.prototype.AppendUshort = function (ushort) {
        this.str += this.ByteToHex(ushort & 0xff) + this.ByteToHex((ushort >> 8) & 0xff);
        this.writer.writeUnsignedShort(ushort);
    };
    ScriptBuilder.prototype.AppendHexEncoded = function (bytes) {
        this.str += bytes;
        this.writer.writeBytes(Array.from((0, utils_1.stringToUint8Array)(bytes)));
        return this;
    };
    return ScriptBuilder;
}());
exports.ScriptBuilder = ScriptBuilder;
