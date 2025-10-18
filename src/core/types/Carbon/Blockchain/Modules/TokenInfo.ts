import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization';
import { IntX } from '../../IntX';
import { Bytes32 } from '../../Bytes32';
import { SmallString } from '../../SmallString';
import { CarbonTokenFlags } from '../CarbonTokenFlags';

export class TokenInfo implements ICarbonBlob {
  maxSupply: IntX;
  flags: CarbonTokenFlags;
  decimals: number; // uint8
  owner: Bytes32;
  symbol: SmallString;
  metadata: Uint8Array;
  tokenSchemas?: Uint8Array; // present only if NonFungible flag is set

  constructor(init?: Partial<TokenInfo>) {
    this.maxSupply = new IntX();
    this.flags = CarbonTokenFlags.None;
    this.decimals = 0;
    this.owner = new Bytes32();
    this.symbol = new SmallString();
    this.metadata = new Uint8Array();
    this.tokenSchemas = undefined;
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    this.maxSupply.write(w);
    w.write1(this.flags & 0xff);
    w.write1(this.decimals & 0xff);
    this.owner.write(w);
    this.symbol.write(w);
    w.writeArray(this.metadata);
    if ((this.flags & CarbonTokenFlags.NonFungible) !== 0) {
      w.writeArray(this.tokenSchemas ?? new Uint8Array());
    }
  }

  read(r: CarbonBinaryReader): void {
    this.maxSupply = r.readBlob(IntX);
    this.flags = r.read1() as CarbonTokenFlags;
    this.decimals = r.read1();
    this.owner = Bytes32.read(r);
    this.symbol = r.readBlob(SmallString);
    this.metadata = r.readArray();
    if ((this.flags & CarbonTokenFlags.NonFungible) !== 0) {
      this.tokenSchemas = r.readArray();
    } else {
      this.tokenSchemas = undefined;
    }
  }

  static read(r: CarbonBinaryReader): TokenInfo {
    const v = new TokenInfo();
    v.read(r);
    return v;
  }
}
