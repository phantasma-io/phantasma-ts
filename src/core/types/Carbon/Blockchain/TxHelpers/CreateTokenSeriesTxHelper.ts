import { bytesToHex, hexToBytes } from '../../../../utils/index.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { PhantasmaKeys } from '../../../PhantasmaKeys.js';
import { Bytes32 } from '../../Bytes32.js';
import { SmallString } from '../../SmallString.js';
import { TxTypes } from '../../TxTypes.js';
import { TxMsgSigner } from '../Extensions/TxMsgSigner.js';
import { ModuleId } from '../ModuleId.js';
import { SeriesInfo, TokenContract_Methods } from '../Modules/index.js';
import { TxMsg } from '../TxMsg.js';
import { TxMsgCall } from '../TxMsgCall.js';
import { CreateSeriesFeeOptions } from './FeeOptions.js';

export class CreateTokenSeriesTxHelper {
  /** Build a Tx without signing. */
  static buildTx(
    tokenId: bigint, // ulong
    seriesInfo: SeriesInfo,
    creatorPublicKey: Bytes32,
    feeOptions?: CreateSeriesFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg {
    const fees = feeOptions ?? new CreateSeriesFeeOptions();
    const maxGas = fees.calculateMaxGas();

    const argsW = new CarbonBinaryWriter();
    argsW.write8(tokenId);
    seriesInfo.write(argsW);

    // --- Tx message: Call(Token.CreateTokenSeries, args) ---
    const msg = new TxMsg();
    msg.type = TxTypes.Call;
    msg.expiry = expiry || BigInt(Date.now() + 60_000);
    msg.maxGas = maxGas;
    msg.maxData = maxData;
    msg.gasFrom = creatorPublicKey;
    msg.payload = SmallString.empty;

    const call = new TxMsgCall();
    call.moduleId = ModuleId.Token;
    call.methodId = TokenContract_Methods.CreateTokenSeries;
    call.args = argsW.toUint8Array();
    msg.msg = call;

    return msg;
  }

  /** Build and sign, returning raw bytes. */
  static buildTxAndSign(
    tokenId: bigint,
    seriesInfo: SeriesInfo,
    signer: PhantasmaKeys,
    feeOptions?: CreateSeriesFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): Uint8Array {
    const tx = this.buildTx(
      tokenId,
      seriesInfo,
      new Bytes32(signer.PublicKey),
      feeOptions,
      maxData,
      expiry
    );
    return TxMsgSigner.signAndSerialize(tx, signer);
  }

  /** Build, sign and return hex string. */
  static buildTxAndSignHex(
    tokenId: bigint,
    seriesInfo: SeriesInfo,
    signer: PhantasmaKeys,
    feeOptions?: CreateSeriesFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): string {
    return bytesToHex(
      this.buildTxAndSign(tokenId, seriesInfo, signer, feeOptions, maxData, expiry)
    );
  }

  static parseResult(resultHex: string): number {
    // UInt32 carbon seriesId
    const r = new CarbonBinaryReader(hexToBytes(resultHex));
    return r.read4u();
  }
}
