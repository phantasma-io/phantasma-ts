import { ICarbonBlob } from '../../../../interfaces/Carbon/ICarbonBlob.js';
import type { CarbonBinaryReader, CarbonBinaryWriter } from '../../../CarbonSerialization.js';
import { Bytes32 } from '../../Bytes32.js';
import { PhantasmaNftMintInfo } from './PhantasmaNftMintInfo.js';

export class MintPhantasmaNonFungibleArgs implements ICarbonBlob {
  tokenId: bigint;
  address: Bytes32;
  tokens: PhantasmaNftMintInfo[];

  constructor(init?: Partial<MintPhantasmaNonFungibleArgs>) {
    this.tokenId = 0n;
    this.address = new Bytes32();
    this.tokens = [];
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    w.write8u(this.tokenId);
    this.address.write(w);
    w.writeArrayBlob(this.tokens);
  }

  read(r: CarbonBinaryReader): void {
    this.tokenId = r.read8u();
    this.address = Bytes32.read(r);
    this.tokens = r.readArrayBlob(PhantasmaNftMintInfo);
  }

  static read(r: CarbonBinaryReader): MintPhantasmaNonFungibleArgs {
    const v = new MintPhantasmaNonFungibleArgs();
    v.read(r);
    return v;
  }
}
