import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { TxMsgBurnFungibleGasPayer } from './TxMsgBurnFungibleGasPayer.js';
import { TxMsgBurnNonFungibleGasPayer } from './TxMsgBurnNonFungibleGasPayer.js';
import { TxMsgMintFungible } from './TxMsgMintFungible.js';
import { TxMsgMintNonFungible } from './TxMsgMintNonFungible.js';
import { TxMsgTransferFungibleGasPayer } from './TxMsgTransferFungibleGasPayer.js';
import { TxMsgTransferNonFungibleSingleGasPayer } from './TxMsgTransferNonFungibleSingleGasPayer.js';

export class TxMsgTrade implements ICarbonBlob {
  transferF: TxMsgTransferFungibleGasPayer[];
  transferN: TxMsgTransferNonFungibleSingleGasPayer[];
  mintF: TxMsgMintFungible[];
  burnF: TxMsgBurnFungibleGasPayer[];
  mintN: TxMsgMintNonFungible[];
  burnN: TxMsgBurnNonFungibleGasPayer[];

  constructor(init?: Partial<TxMsgTrade>) {
    this.transferF = [];
    this.transferN = [];
    this.mintF = [];
    this.burnF = [];
    this.mintN = [];
    this.burnN = [];
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.writeArrayBlob(this.transferF);
    w.writeArrayBlob(this.transferN);
    w.writeArrayBlob(this.mintF);
    w.writeArrayBlob(this.burnF);
    w.writeArrayBlob(this.mintN);
    w.writeArrayBlob(this.burnN);
  }

  read(r: CarbonBinaryReader): void {
    this.transferF = r.readArrayBlob(TxMsgTransferFungibleGasPayer);
    this.transferN = r.readArrayBlob(TxMsgTransferNonFungibleSingleGasPayer);
    this.mintF = r.readArrayBlob(TxMsgMintFungible);
    this.burnF = r.readArrayBlob(TxMsgBurnFungibleGasPayer);
    this.mintN = r.readArrayBlob(TxMsgMintNonFungible);
    this.burnN = r.readArrayBlob(TxMsgBurnNonFungibleGasPayer);
  }

  static read(r: CarbonBinaryReader): TxMsgTrade {
    const v = new TxMsgTrade();
    v.read(r);
    return v;
  }
}
