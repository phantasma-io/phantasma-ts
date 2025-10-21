import { bytesToHex, hexToBytes } from '../../../../utils';
import { CarbonBinaryReader } from '../../../CarbonSerialization';
import { PhantasmaKeys } from '../../../PhantasmaKeys';
import { Bytes32 } from '../../Bytes32';
import { SmallString } from '../../SmallString';
import { TxTypes } from '../../TxTypes';
import { TxMsgSigner } from '../Extensions/TxMsgSigner';
import { TokenHelper } from '../Modules/TokenHelper';
import { TxMsg } from '../TxMsg';
import { TxMsgMintNonFungible } from '../TxMsgMintNonFungible';
import { MintNftFeeOptions } from './FeeOptions';

export class MintNonFungibleTxHelper {
  // Build a Tx without signing
  static buildTx(
    carbonTokenId: bigint,
    carbonSeriesId: number,
    senderPublicKey: Bytes32,
    receiverPublicKey: Bytes32,
    rom: Uint8Array,
    ram: Uint8Array,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): TxMsg {
    const fees = feeOptions ?? new MintNftFeeOptions();
    const maxGas = fees.calculateMaxGas();

    const msg = new TxMsg();
    msg.type = TxTypes.MintNonFungible;
    msg.expiry = expiry || BigInt(Date.now() + 60_000);
    msg.maxGas = maxGas;
    msg.maxData = maxData;
    msg.gasFrom = senderPublicKey;
    msg.payload = SmallString.empty;

    const mint = new TxMsgMintNonFungible();
    mint.tokenId = carbonTokenId;
    mint.seriesId = carbonSeriesId;
    mint.to = receiverPublicKey;
    mint.rom = rom;
    mint.ram = ram;

    msg.msg = mint;

    return msg;
  }

  // Build and sign, returning raw bytes
  static buildTxAndSign(
    tokenId: bigint,
    seriesId: number,
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    rom: Uint8Array,
    ram: Uint8Array,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): Uint8Array {
    const senderPub = new Bytes32(signer.PublicKey);
    const tx = this.buildTx(
      tokenId,
      seriesId,
      senderPub,
      receiverPublicKey,
      rom,
      ram,
      feeOptions,
      maxData,
      expiry
    );
    return TxMsgSigner.signAndSerialize(tx, signer);
  }

  // Build, sign and return hex string
  static buildTxAndSignHex(
    tokenId: bigint,
    seriesId: number,
    signer: PhantasmaKeys,
    receiverPublicKey: Bytes32,
    rom: Uint8Array,
    ram: Uint8Array | null | undefined,
    feeOptions?: MintNftFeeOptions,
    maxData?: bigint,
    expiry?: bigint
  ): string {
    const bytes = this.buildTxAndSign(
      tokenId,
      seriesId,
      signer,
      receiverPublicKey,
      rom,
      ram,
      feeOptions,
      maxData,
      expiry
    );
    return bytesToHex(bytes);
  }

  static parseResult(carbonTokenId: bigint, resultHex: string): Bytes32[] {
    const result: Bytes32[] = [];

    const r = new CarbonBinaryReader(hexToBytes(resultHex));
    const count = r.read4u();

    for (let i = 0; i < count; i++) {
      const instanceId = r.read8u();

      const carbonNftId = TokenHelper.getNftAddress(carbonTokenId, instanceId);
      result.push(carbonNftId);
    }

    return result;
  }
}
