/// <reference types="node" />
export declare const PrivateToDer: (privateKeyHex: string) => Buffer;
export declare const PublicToDer: (publicKeyHex: string) => Buffer;
export declare const PublicToPem: (publicKeyHex: string) => string;
export declare const SignBytes: (hash: Buffer, privateKey: Buffer) => string;
export declare const GetHash: (encodedTx: string, debug?: boolean) => Buffer;
export declare const Sign: (encodedTx: string, privateKeyHex: string) => string;
export declare const Verify: (encodedTx: string, signatureHex: string, publicKeyHex: string) => boolean;
export declare const GetPublicFromPrivate: (privateKey: string) => string;
//# sourceMappingURL=Transaction-Sign.d.ts.map