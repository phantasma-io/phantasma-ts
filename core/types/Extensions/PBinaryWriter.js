"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBinaryWriter = void 0;
var csharp_binary_stream_1 = require("csharp-binary-stream");
var __1 = require("../..");
var interfaces_1 = require("../../interfaces");
var PBinaryWriter = /** @class */ (function () {
    function PBinaryWriter(arg1) {
        this.writer = new csharp_binary_stream_1.BinaryWriter(arg1);
    }
    Object.defineProperty(PBinaryWriter.prototype, "length", {
        get: function () {
            return this.writer.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PBinaryWriter.prototype, "position", {
        get: function () {
            return this.writer.position;
        },
        set: function (value) {
            this.writer.position = value;
        },
        enumerable: false,
        configurable: true
    });
    PBinaryWriter.prototype.writeBoolean = function (value) {
        this.writer.writeBoolean(value);
    };
    PBinaryWriter.prototype.writeByte = function (value) {
        this.writer.writeByte(value);
    };
    PBinaryWriter.prototype.writeSameByte = function (value, repeats) {
        this.writer.writeSameByte(value, repeats);
    };
    PBinaryWriter.prototype.writeSignedByte = function (value) {
        this.writer.writeSignedByte(value);
    };
    PBinaryWriter.prototype.writeShort = function (value) {
        this.writer.writeShort(value);
    };
    PBinaryWriter.prototype.writeUnsignedShort = function (value) {
        this.writer.writeUnsignedShort(value);
    };
    PBinaryWriter.prototype.writeInt = function (value) {
        this.writer.writeInt(value);
    };
    PBinaryWriter.prototype.writeUnsignedInt = function (value) {
        this.writer.writeUnsignedInt(value);
    };
    PBinaryWriter.prototype.writeLong = function (value) {
        this.writer.writeLong(value);
    };
    PBinaryWriter.prototype.writeUnsignedLong = function (value) {
        this.writer.writeUnsignedLong(value);
    };
    PBinaryWriter.prototype.writeFloat = function (value) {
        this.writer.writeFloat(value);
    };
    PBinaryWriter.prototype.writeDouble = function (value) {
        this.writer.writeDouble(value);
    };
    PBinaryWriter.prototype.writeChar = function (character, encoding) {
        this.writer.writeChar(character, encoding);
    };
    PBinaryWriter.prototype.writeChars = function (characters, encoding) {
        this.writer.writeChars(characters, encoding);
    };
    PBinaryWriter.prototype.clear = function () {
        this.writer.clear();
    };
    PBinaryWriter.prototype.toArray = function () {
        return this.writer.toArray();
    };
    PBinaryWriter.prototype.toUint8Array = function () {
        return this.writer.toUint8Array();
    };
    PBinaryWriter.prototype.appendByte = function (value) {
        this.writeByte(value);
        return this;
    };
    PBinaryWriter.prototype.appendBytes = function (bytes) {
        for (var i = 0; i < bytes.length; i++) {
            if (!Number.isNaN(bytes[i])) {
                this.appendByte(bytes[i]);
            }
        }
    };
    PBinaryWriter.prototype.writeEnum = function (value) {
        //this.writeUnsignedInt(value);
        var bytes = [0, 0, 0, 0];
        for (var i = 0; i < bytes.length; i++) {
            var byte = value & 0xff;
            bytes[i] = byte;
            value = (value - byte) / 256;
        }
        this.appendBytes(bytes);
        return this;
    };
    PBinaryWriter.prototype.writeBytes = function (bytes) {
        for (var i = 0; i < bytes.length; i++)
            this.appendByte(bytes[i]);
        // writer.Write(bytes);
        return this;
    };
    PBinaryWriter.prototype.writeVarInt = function (value) {
        if (value < 0)
            throw "negative value invalid";
        if (value < 0xfd) {
            this.appendByte(value);
        }
        else if (value <= 0xffff) {
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.appendByte(0xfd);
            this.appendByte(A);
            this.appendByte(B);
        }
        else if (value <= 0xffffffff) {
            var C = (value & 0x00ff0000) >> 16;
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.appendByte(0xfe);
            this.appendByte(A);
            this.appendByte(B);
            this.appendByte(C);
        }
        else {
            var D = (value & 0xff000000) >> 24;
            var C = (value & 0x00ff0000) >> 16;
            var B = (value & 0x0000ff00) >> 8;
            var A = value & 0x000000ff;
            // TODO check if the endianess is correct, might have to reverse order of appends
            this.appendByte(0xff);
            this.appendByte(A);
            this.appendByte(B);
            this.appendByte(C);
            this.appendByte(D);
        }
        return this;
    };
    PBinaryWriter.prototype.writeTimestamp = function (obj) {
        var num = obj.value;
        var a = (num & 0xff000000) >> 24;
        var b = (num & 0x00ff0000) >> 16;
        var c = (num & 0x0000ff00) >> 8;
        var d = num & 0x000000ff;
        var bytes = [d, c, b, a];
        this.appendBytes(bytes);
        return this;
    };
    PBinaryWriter.prototype.writeDateTime = function (obj) {
        var num = (obj.getTime() / 1000) | 0;
        var a = (num & 0xff000000) >> 24;
        var b = (num & 0x00ff0000) >> 16;
        var c = (num & 0x0000ff00) >> 8;
        var d = num & 0x000000ff;
        var bytes = [d, c, b, a];
        this.appendBytes(bytes);
        return this;
    };
    PBinaryWriter.prototype.rawString = function (value) {
        var data = [];
        for (var i = 0; i < value.length; i++) {
            data.push(value.charCodeAt(i));
        }
        return data;
    };
    PBinaryWriter.prototype.writeByteArray = function (bytes) {
        if (bytes instanceof Uint8Array) {
            bytes = Array.from(bytes);
        }
        this.writeVarInt(bytes.length);
        this.writeBytes(bytes);
        return this;
    };
    PBinaryWriter.prototype.writeString = function (text) {
        var bytes = this.rawString(text);
        this.writeVarInt(bytes.length);
        this.writeBytes(bytes);
        return this;
    };
    PBinaryWriter.prototype.emitUInt32 = function (value) {
        if (value < 0)
            throw "negative value invalid";
        var D = (value & 0xff000000) >> 24;
        var C = (value & 0x00ff0000) >> 16;
        var B = (value & 0x0000ff00) >> 8;
        var A = value & 0x000000ff;
        // TODO check if the endianess is correct, might have to reverse order of appends
        this.appendByte(0xff);
        this.appendByte(A);
        this.appendByte(B);
        this.appendByte(C);
        this.appendByte(D);
        return this;
    };
    PBinaryWriter.prototype.writeBigInteger = function (value) {
        return this.writeBigIntegerString(value.toString());
    };
    PBinaryWriter.prototype.writeBigIntegerString = function (value) {
        var bytes = [];
        if (value == "0") {
            bytes = [0];
        }
        else if (value.startsWith("-1")) {
            throw new Error("Unsigned bigint serialization not suppoted");
        }
        else {
            var hex = BigInt(value).toString(16);
            if (hex.length % 2)
                hex = "0" + hex;
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
        return this.writeByteArray(bytes);
    };
    PBinaryWriter.prototype.writeSignature = function (signature) {
        if (!signature) {
            this.writeByte(interfaces_1.SignatureKind.None);
            return this;
        }
        this.writeByte(signature.Kind);
        signature.SerializeData(this);
        return this;
    };
    PBinaryWriter.prototype.AppendHexEncoded = function (bytes) {
        var localEncoded = (0, __1.hexStringToBytes)(bytes);
        this.writeVarInt(localEncoded.length);
        /*for (let i = 0; i < localEncoded.length; i++) {
          if (!Number.isNaN(localEncoded[i])) {
            this.appendByte(localEncoded[i]);
          }
        }*/
        this.appendBytes(localEncoded);
        return this;
    };
    return PBinaryWriter;
}());
exports.PBinaryWriter = PBinaryWriter;
