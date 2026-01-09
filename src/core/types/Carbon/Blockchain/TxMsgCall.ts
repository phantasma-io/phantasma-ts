import { ICarbonBlob } from '../../../interfaces/Carbon/ICarbonBlob';
import { CarbonBinaryReader, CarbonBinaryWriter, Throw } from '../../CarbonSerialization';

export type MsgCallArgs = {
  registerOffset: number;
  args: Uint8Array;
};

export class MsgCallArgSections {
  argSections: MsgCallArgs[];

  constructor(argSections: MsgCallArgs[] = []) {
    this.argSections = argSections;
  }

  hasSections(): boolean {
    return this.argSections.length > 0;
  }

  write(w: CarbonBinaryWriter): void {
    Throw.Assert(this.argSections.length > 0, 'arg sections are empty');
    w.write4(-this.argSections.length);
    for (const section of this.argSections) {
      if (section.registerOffset < 0) {
        w.write4(section.registerOffset);
        continue;
      }
      w.write4(section.args.length);
      if (section.args.length > 0) {
        w.write(section.args);
      }
    }
  }

  static readWithCount(r: CarbonBinaryReader, countNegative: number): MsgCallArgSections {
    Throw.Assert(countNegative < 0, 'arg sections count must be negative');
    const length = -countNegative;
    const sections: MsgCallArgs[] = new Array(length);
    for (let i = 0; i < length; i++) {
      const value = r.read4();
      if (value < 0) {
        sections[i] = { registerOffset: value, args: new Uint8Array() };
        continue;
      }
      const args = r.readExactly(value);
      sections[i] = { registerOffset: 0, args };
    }
    return new MsgCallArgSections(sections);
  }
}

export class TxMsgCall implements ICarbonBlob {
  moduleId: number; // uint32
  methodId: number; // uint32
  args: Uint8Array;
  sections: MsgCallArgSections | null;

  constructor(moduleId: number = 0, methodId: number = 0, args: Uint8Array = new Uint8Array()) {
    this.moduleId = moduleId >>> 0;
    this.methodId = methodId >>> 0;
    this.args = args;
    this.sections = null;
  }

  write(w: CarbonBinaryWriter): void {
    w.write4u(this.moduleId);
    w.write4u(this.methodId);
    if (this.sections && this.sections.hasSections()) {
      this.sections.write(w);
      return;
    }
    w.write4(this.args.length);
    if (this.args.length > 0) {
      w.write(this.args);
    }
  }

  read(r: CarbonBinaryReader): void {
    this.moduleId = r.read4u();
    this.methodId = r.read4u();
    const length = r.read4();
    if (length >= 0) {
      this.args = r.readExactly(length);
      this.sections = null;
      return;
    }
    this.sections = MsgCallArgSections.readWithCount(r, length);
    this.args = new Uint8Array();
  }

  static read(r: CarbonBinaryReader): TxMsgCall {
    const v = new TxMsgCall();
    v.read(r);
    return v;
  }
}
