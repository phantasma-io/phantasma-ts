import { Signature } from "./Signature.js";

export interface IKeyPair {
  PrivateKey: Uint8Array;
  PublicKey: Uint8Array;
  Sign(
    msg: Uint8Array,
    customSignFunction?: (
      message: Uint8Array,
      privateKey: Uint8Array,
      publicKey: Uint8Array
    ) => Uint8Array
  ): Signature;
}
