import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob.js';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../CarbonSerialization.js';
import { SmallString } from '../SmallString.js';

export class TxMsgPhantasma implements ICarbonBlob {
  nexus: SmallString;
  chain: SmallString;
  script: Uint8Array;

  constructor(init?: Partial<TxMsgPhantasma>) {
    this.nexus = new SmallString('');
    this.chain = new SmallString('');
    this.script = new Uint8Array();
    Object.assign(this, init);
  }

  write(w: CarbonBinaryWriter): void {
    this.nexus.write(w);
    this.chain.write(w);
    w.writeArray(this.script);
  }

  read(r: CarbonBinaryReader): void {
    this.nexus = SmallString.read(r);
    this.chain = SmallString.read(r);
    this.script = r.readArray();
  }

  static read(r: CarbonBinaryReader): TxMsgPhantasma {
    const v = new TxMsgPhantasma();
    v.read(r);
    return v;
  }
}
