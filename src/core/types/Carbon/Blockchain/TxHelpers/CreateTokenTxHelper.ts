import { bytesToHex, hexToBytes } from '../../../../utils/index.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { PhantasmaKeys } from '../../../PhantasmaKeys.js';
import { Bytes32 } from '../../Bytes32.js';
import { SmallString } from '../../SmallString.js';
import { TxTypes } from '../../TxTypes.js';
import { TxMsgSigner } from '../Extensions/TxMsgSigner.js';
import { ModuleId } from '../ModuleId.js';
import { TokenContract_Methods, TokenInfo } from '../Modules/index.js';
import { TxMsg } from '../TxMsg.js';
import { TxMsgCall } from '../TxMsgCall.js';
import { CreateTokenFeeOptions } from './FeeOptions.js';

export class CreateTokenTxHelper {
  static buildTx(
    tokenInfo: TokenInfo,
    creatorPublicKey: Bytes32,
    feeOptions?: CreateTokenFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg {
    const fees = feeOptions ?? new CreateTokenFeeOptions();
    const maxGas = fees.calculateMaxGas(tokenInfo.symbol);

    const msg = new TxMsg();
    msg.type = TxTypes.Call;
    msg.expiry = expiry || BigInt(Date.now() + 60_000);
    msg.maxGas = maxGas;
    msg.maxData = maxData;
    msg.gasFrom = creatorPublicKey;
    msg.payload = SmallString.empty;

    const argsW = new CarbonBinaryWriter();
    tokenInfo.write(argsW);

    const call = new TxMsgCall();
    call.moduleId = ModuleId.Token;
    call.methodId = TokenContract_Methods.CreateToken;
    call.args = argsW.toUint8Array();
    msg.msg = call;

    return msg;
  }

  static buildTxAndSign(
    tokenInfo: TokenInfo,
    signer: PhantasmaKeys,
    feeOptions?: CreateTokenFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): Uint8Array {
    const tx = this.buildTx(tokenInfo, new Bytes32(signer.PublicKey), feeOptions, maxData, expiry);
    return TxMsgSigner.signAndSerialize(tx, signer);
  }

  static buildTxAndSignHex(
    tokenInfo: TokenInfo,
    signer: PhantasmaKeys,
    feeOptions?: CreateTokenFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): string {
    const bytes = this.buildTxAndSign(tokenInfo, signer, feeOptions, maxData, expiry);
    return bytesToHex(bytes);
  }

  static parseResult(resultHex: string): number {
    // UInt32 carbon tokenId
    const r = new CarbonBinaryReader(hexToBytes(resultHex));
    return r.read4u();
  }
}
