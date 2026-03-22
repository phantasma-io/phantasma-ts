import { bytesToHex, hexToBytes } from '../../../../utils/index.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { PhantasmaKeys } from '../../../PhantasmaKeys.js';
import { Bytes32 } from '../../Bytes32.js';
import { IntX } from '../../IntX.js';
import { SmallString } from '../../SmallString.js';
import { TxTypes } from '../../TxTypes.js';
import { TxMsgSigner } from '../Extensions/TxMsgSigner.js';
import { ModuleId } from '../ModuleId.js';
import {
  MintPhantasmaNonFungibleArgs,
  PhantasmaNftMintInfo,
  PhantasmaNftMintResult,
  TokenContract_Methods,
} from '../Modules/index.js';
import { TxMsg } from '../TxMsg.js';
import { TxMsgCall } from '../TxMsgCall.js';
import { MintNftFeeOptions } from './FeeOptions.js';

export class MintPhantasmaNonFungibleTxHelper {
  static buildTx(
    tokenId: bigint,
    phantasmaSeriesId: bigint,
    senderPublicKey: Bytes32,
    receiverPublicKey: Bytes32,
    publicRom: Uint8Array,
    ram?: Uint8Array,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg;

  static buildTx(
    tokenId: bigint,
    senderPublicKey: Bytes32,
    receiverPublicKey: Bytes32,
    tokens: PhantasmaNftMintInfo[],
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg;

  static buildTx(
    tokenId: bigint,
    arg1: bigint | Bytes32,
    arg2: Bytes32,
    arg3: Bytes32 | PhantasmaNftMintInfo[],
    arg4?: Uint8Array | MintNftFeeOptions,
    arg5?: Uint8Array | bigint,
    arg6?: MintNftFeeOptions | bigint,
    arg7?: bigint,
    arg8?: bigint
  ): TxMsg {
    if (typeof arg1 === 'bigint') {
      if (!(arg3 instanceof Bytes32)) {
        throw new Error('receiverPublicKey is required for single-item MintPhantasmaNonFungible tx');
      }

      const publicRom = arg4;
      const ram = arg5;
      if (!(publicRom instanceof Uint8Array)) {
        throw new Error('publicRom must be a Uint8Array for single-item MintPhantasmaNonFungible tx');
      }
      if (!(ram === undefined || ram instanceof Uint8Array)) {
        throw new Error('ram must be a Uint8Array when provided for single-item MintPhantasmaNonFungible tx');
      }

      const safeRam = ram instanceof Uint8Array ? ram : new Uint8Array();

      return this.buildTxCore(
        tokenId,
        arg2,
        arg3,
        [
          new PhantasmaNftMintInfo({
            phantasmaSeriesId: IntX.fromBigInt(arg1),
            rom: publicRom,
            ram: safeRam,
          }),
        ],
        arg6 instanceof MintNftFeeOptions ? arg6 : undefined,
        typeof arg7 === 'bigint' ? arg7 : undefined,
        typeof arg8 === 'bigint' ? arg8 : undefined
      );
    }

    if (arg3 instanceof Bytes32 || !Array.isArray(arg3)) {
      throw new Error('tokens array is required for multi-item MintPhantasmaNonFungible tx');
    }

    return this.buildTxCore(
      tokenId,
      arg1,
      arg2,
      arg3,
      arg4 instanceof MintNftFeeOptions ? arg4 : undefined,
      typeof arg5 === 'bigint' ? arg5 : undefined,
      typeof arg6 === 'bigint' ? arg6 : undefined
    );
  }

  private static buildTxCore(
    tokenId: bigint,
    senderPublicKey: Bytes32,
    receiverPublicKey: Bytes32,
    tokens: PhantasmaNftMintInfo[],
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg {
    const fees = feeOptions ?? new MintNftFeeOptions();
    const maxGas = fees.calculateMaxGas();

    // This helper only packages the Token.Call ABI surface.
    const args = new MintPhantasmaNonFungibleArgs({
      tokenId,
      address: receiverPublicKey,
      tokens,
    });

    const msg = new TxMsg();
    msg.type = TxTypes.Call;
    msg.expiry = expiry || BigInt(Date.now() + 60_000);
    msg.maxGas = maxGas;
    msg.maxData = maxData;
    msg.gasFrom = senderPublicKey;
    msg.payload = SmallString.empty;

    const call = new TxMsgCall();
    call.moduleId = ModuleId.Token;
    call.methodId = TokenContract_Methods.MintPhantasmaNonFungible;
    const argsWriter = new CarbonBinaryWriter();
    args.write(argsWriter);
    call.args = argsWriter.toUint8Array();
    msg.msg = call;

    return msg;
  }

  static buildTxAndSign(
    tokenId: bigint,
    phantasmaSeriesId: bigint,
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    publicRom: Uint8Array,
    ram?: Uint8Array,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): Uint8Array;

  static buildTxAndSign(
    tokenId: bigint,
    tokens: PhantasmaNftMintInfo[],
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): Uint8Array;

  static buildTxAndSign(
    tokenId: bigint,
    arg1: bigint | PhantasmaNftMintInfo[],
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    arg4?: Uint8Array | MintNftFeeOptions,
    arg5?: Uint8Array | bigint,
    arg6?: MintNftFeeOptions | bigint,
    arg7?: bigint,
    arg8?: bigint
  ): Uint8Array {
    const senderPub = new Bytes32(signer.PublicKey);

    if (typeof arg1 === 'bigint') {
      const tx = this.buildTx(
        tokenId,
        arg1,
        senderPub,
        receiverPublicKey,
        arg4 as Uint8Array,
        arg5 instanceof Uint8Array ? arg5 : undefined,
        arg6 instanceof MintNftFeeOptions ? arg6 : undefined,
        typeof arg7 === 'bigint' ? arg7 : undefined,
        typeof arg8 === 'bigint' ? arg8 : undefined
      );
      return TxMsgSigner.signAndSerialize(tx, signer);
    }

    const tx = this.buildTx(
      tokenId,
      senderPub,
      receiverPublicKey,
      arg1,
      arg4 instanceof MintNftFeeOptions ? arg4 : undefined,
      typeof arg5 === 'bigint' ? arg5 : undefined,
      typeof arg6 === 'bigint' ? arg6 : undefined
    );
    return TxMsgSigner.signAndSerialize(tx, signer);
  }

  static buildTxAndSignHex(
    tokenId: bigint,
    phantasmaSeriesId: bigint,
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    publicRom: Uint8Array,
    ram?: Uint8Array,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): string;

  static buildTxAndSignHex(
    tokenId: bigint,
    tokens: PhantasmaNftMintInfo[],
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): string;

  static buildTxAndSignHex(
    tokenId: bigint,
    arg1: bigint | PhantasmaNftMintInfo[],
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    arg4?: Uint8Array | MintNftFeeOptions,
    arg5?: Uint8Array | bigint,
    arg6?: MintNftFeeOptions | bigint,
    arg7?: bigint,
    arg8?: bigint
  ): string {
    if (typeof arg1 === 'bigint') {
      return bytesToHex(
        this.buildTxAndSign(
          tokenId,
          arg1,
          signer,
          receiverPublicKey,
          arg4 as Uint8Array,
          arg5 instanceof Uint8Array ? arg5 : undefined,
          arg6 instanceof MintNftFeeOptions ? arg6 : undefined,
          typeof arg7 === 'bigint' ? arg7 : undefined,
          typeof arg8 === 'bigint' ? arg8 : undefined
        )
      );
    }

    return bytesToHex(
      this.buildTxAndSign(
        tokenId,
        arg1,
        signer,
        receiverPublicKey,
        arg4 instanceof MintNftFeeOptions ? arg4 : undefined,
        typeof arg5 === 'bigint' ? arg5 : undefined,
        typeof arg6 === 'bigint' ? arg6 : undefined
      )
    );
  }

  static parseResult(resultHex: string): PhantasmaNftMintResult[] {
    const r = new CarbonBinaryReader(hexToBytes(resultHex));
    return r.readArrayBlob(PhantasmaNftMintResult);
  }
}
