import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { Bytes32 } from '../Bytes32.js';

export class TxMsgMintNonFungible implements ICarbonBlob {
  tokenId: bigint; // uint64
  to: Bytes32;
  seriesId: number; // uint32
  rom: Uint8Array;
  ram: Uint8Array;

  constructor(init?: Partial<TxMsgMintNonFungible>) {
    this.tokenId = 0n;
    this.to = new Bytes32();
    this.seriesId = 0;
    this.rom = new Uint8Array();
    this.ram = new Uint8Array();
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    w.write32(this.to);
    w.write4u(this.seriesId);
    w.writeArray(this.rom);
    w.writeArray(this.ram);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.to = Bytes32.read(r);
    this.seriesId = r.read4u();
    this.rom = r.readArray();
    this.ram = r.readArray();
  }

  static read(r: CarbonBinaryReader): TxMsgMintNonFungible {
    const v = new TxMsgMintNonFungible();
    v.read(r);
    return v;
  }
}
