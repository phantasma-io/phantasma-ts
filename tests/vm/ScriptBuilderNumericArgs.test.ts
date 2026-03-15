import { bigIntToTwosComplementLE, Opcode, ScriptBuilder, VMType } from '../../src/core';

type LoadInstruction = {
  reg: number;
  type: number;
  payload: number[];
};

function hexToBytes(hex: string): number[] {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) {
    throw new Error(`Expected even-length hex, got ${clean.length}`);
  }

  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    out.push(Number.parseInt(clean.slice(i, i + 2), 16));
  }
  return out;
}

function readVarInt(bytes: number[], offset: number): { value: number; next: number } {
  const marker = bytes[offset];
  if (marker < 0xfd) {
    return { value: marker, next: offset + 1 };
  }

  if (marker === 0xfd) {
    return { value: bytes[offset + 1] | (bytes[offset + 2] << 8), next: offset + 3 };
  }

  if (marker === 0xfe) {
    return {
      value:
        bytes[offset + 1] |
        (bytes[offset + 2] << 8) |
        (bytes[offset + 3] << 16) |
        (bytes[offset + 4] << 24),
      next: offset + 5,
    };
  }

  throw new Error('8-byte varints are not needed in this test');
}

function parseFirstLoadInstruction(scriptHex: string): LoadInstruction {
  const bytes = hexToBytes(scriptHex);
  expect(bytes[0]).toBe(Opcode.LOAD);

  const reg = bytes[1];
  const type = bytes[2];
  const len = readVarInt(bytes, 3);
  const payload = bytes.slice(len.next, len.next + len.value);
  return { reg, type, payload };
}

function payloadAsAscii(payload: number[]): string {
  return String.fromCharCode(...payload);
}

describe('ScriptBuilder numeric arguments', () => {
  const from = 'P2KFEyFevpQfSaW8G4VjSmhWUZXR4QrG9YQR1HbMpTUCpCL';

  test('small LP ids passed as JS number stay decimal strings for compatibility', () => {
    const script = new ScriptBuilder()
      .BeginScript()
      .CallContract('SATRN', 'removeLiquidity', [from, 4294967423])
      .EndScript();

    const firstLoad = parseFirstLoadInstruction(script);
    expect(firstLoad.reg).toBe(0);
    expect(firstLoad.type).toBe(VMType.String);
    expect(payloadAsAscii(firstLoad.payload)).toBe('4294967423');
  });

  test('unsafe JS numbers are rounded before ScriptBuilder can serialize them', () => {
    const intended = '9007199254740993';
    const rounded = Number(intended);
    expect(Number.isSafeInteger(rounded)).toBe(false);
    expect(rounded.toString()).toBe('9007199254740992');

    const script = new ScriptBuilder()
      .BeginScript()
      .CallContract('SATRN', 'removeLiquidity', [from, rounded])
      .EndScript();

    const firstLoad = parseFirstLoadInstruction(script);
    expect(firstLoad.type).toBe(VMType.String);
    expect(payloadAsAscii(firstLoad.payload)).toBe('9007199254740992');
  });

  test('bigint arguments serialize as exact VM numbers in generic CallContract path', () => {
    const exactLpId = BigInt(
      '100152248859758165081358319173701784838411236087473055789578298559873130784096'
    );

    const script = new ScriptBuilder()
      .BeginScript()
      .CallContract('SATRN', 'removeLiquidity', [from, exactLpId])
      .EndScript();

    const firstLoad = parseFirstLoadInstruction(script);
    expect(firstLoad.type).toBe(VMType.Number);
    expect(firstLoad.payload).toEqual(Array.from(bigIntToTwosComplementLE(exactLpId)));
    expect(firstLoad.payload.length).toBeGreaterThan(8);
  });
});
