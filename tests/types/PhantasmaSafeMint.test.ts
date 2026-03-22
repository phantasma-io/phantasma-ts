import { bytesToHex } from '../../src/core/utils';
import { CarbonBinaryReader, CarbonBinaryWriter } from '../../src/core/types/CarbonSerialization';
import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { TxTypes } from '../../src/core/types/Carbon/TxTypes';
import { TxMsgCall } from '../../src/core/types/Carbon/Blockchain/TxMsgCall';
import {
  MintPhantasmaNonFungibleArgs,
  PhantasmaNftMintResult,
  TokenContract_Methods,
} from '../../src/core/types/Carbon/Blockchain/Modules';
import {
  PhantasmaNftRomBuilder,
  TokenSchemasBuilder,
} from '../../src/core/types/Carbon/Blockchain/Modules/Builders';
import { VmDynamicStruct } from '../../src/core/types/Carbon/Blockchain/Vm';
import { SmallString } from '../../src/core/types/Carbon/SmallString';
import { MintNftFeeOptions, MintPhantasmaNonFungibleTxHelper } from '../../src/core/types/Carbon/Blockchain/TxHelpers';
import { ModuleId } from '../../src/core/types/Carbon/Blockchain/ModuleId';

const sender = new Bytes32(new Uint8Array(32).fill(0x11));
const receiver = new Bytes32(new Uint8Array(32).fill(0x22));

const buildMetadata = () => [
  { name: 'name', value: 'My NFT #1' },
  { name: 'description', value: 'This is my first NFT!' },
  { name: 'imageURL', value: 'images-assets.nasa.gov/image/PIA13227/PIA13227~orig.jpg' },
  { name: 'infoURL', value: 'https://images.nasa.gov/details/PIA13227' },
  { name: 'royalties', value: 10000000 },
];

describe('Phantasma deterministic mint helpers', () => {
  it('PhantasmaNftRomBuilder serializes public mint payload without service fields', () => {
    const tokenSchemas = TokenSchemasBuilder.prepareStandard(false);
    const rom = PhantasmaNftRomBuilder.buildAndSerialize(tokenSchemas.rom, buildMetadata());
    const publicSchema = PhantasmaNftRomBuilder.buildPublicMintSchema(tokenSchemas.rom);

    const reader = new CarbonBinaryReader(rom);
    const romStruct = new VmDynamicStruct();
    romStruct.readWithSchema(publicSchema, reader);

    expect(romStruct.getValue(new SmallString('name'))?.data).toBe('My NFT #1');
    expect(romStruct.getValue(new SmallString('description'))?.data).toBe('This is my first NFT!');
    expect(romStruct.getValue(new SmallString('_i'))).toBeUndefined();
    expect(romStruct.getValue(new SmallString('rom'))).toBeUndefined();
  });

  it('MintPhantasmaNonFungibleTxHelper builds Token.Call args with the deterministic method id', () => {
    const tokenSchemas = TokenSchemasBuilder.prepareStandard(false);
    const rom = PhantasmaNftRomBuilder.buildAndSerialize(tokenSchemas.rom, buildMetadata());

    const tx = MintPhantasmaNonFungibleTxHelper.buildTx(
      42n,
      777n,
      sender,
      receiver,
      rom,
      new Uint8Array(),
      new MintNftFeeOptions(),
      123n,
      999n
    );

    expect(tx.type).toBe(TxTypes.Call);

    const call = tx.msg as TxMsgCall;
    expect(call.moduleId).toBe(ModuleId.Token);
    expect(call.methodId).toBe(TokenContract_Methods.MintPhantasmaNonFungible);

    const argsReader = new CarbonBinaryReader(call.args);
    const decoded = MintPhantasmaNonFungibleArgs.read(argsReader);
    expect(decoded.tokenId).toBe(42n);
    expect(decoded.address.equals(receiver)).toBe(true);
    expect(decoded.tokens).toHaveLength(1);
    expect(decoded.tokens[0].phantasmaSeriesId.toBigInt()).toBe(777n);
    expect(bytesToHex(decoded.tokens[0].rom).toUpperCase()).toBe(bytesToHex(rom).toUpperCase());
    expect(decoded.tokens[0].ram).toEqual(new Uint8Array());
  });

  it('MintPhantasmaNonFungibleTxHelper.parseResult preserves both ids', () => {
    const lowId = new Uint8Array(32);
    lowId[0] = 0x7b;
    const highId = new Uint8Array(32);
    highId[0] = 0x2a;
    highId[31] = 0x80;

    const writer = new CarbonBinaryWriter();
    writer.writeArrayBlob([
      new PhantasmaNftMintResult({
        phantasmaNftId: new Bytes32(lowId),
        carbonInstanceId: 7n,
      }),
      new PhantasmaNftMintResult({
        phantasmaNftId: new Bytes32(highId),
        carbonInstanceId: 8n,
      }),
    ]);

    const parsed = MintPhantasmaNonFungibleTxHelper.parseResult(bytesToHex(writer.toUint8Array()));
    expect(parsed).toHaveLength(2);
    expect(parsed[0].phantasmaNftId.equals(new Bytes32(lowId))).toBe(true);
    expect(parsed[0].carbonInstanceId).toBe(7n);
    expect(parsed[1].phantasmaNftId.equals(new Bytes32(highId))).toBe(true);
    expect(parsed[1].carbonInstanceId).toBe(8n);
  });
});
