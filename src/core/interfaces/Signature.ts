import { Address, PBinaryReader, PBinaryWriter } from "../types/index.js";
import { ISerializable } from "./ISerializable.js";
import { BinaryReader, BinaryWriter } from "csharp-binary-stream";

export enum SignatureKind {
  None,
  Ed25519,
  ECDSA,
}

export class ISignature {
  signature: string;
  kind: number;
}

export abstract class Signature implements ISerializable {
  abstract Bytes: Uint8Array;
  abstract Kind: SignatureKind;
  abstract SerializeData(writer: PBinaryWriter): void;
  abstract UnserializeData(reader: PBinaryReader): void;
  abstract VerifyMultiple(message: Uint8Array, addresses: Address[]): boolean;
  Verify(message: Uint8Array, address: Address): boolean {
    return this.VerifyMultiple(message, [address]);
  }

  ToByteArray(): Uint8Array {
    const stream = new Uint8Array(64);
    const writer = new PBinaryWriter(stream);
    this.SerializeData(writer);
    return new Uint8Array(stream);
  }
}
