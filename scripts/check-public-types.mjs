import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tempRoot = path.join(root, 'node_modules', '.cache');
fs.mkdirSync(tempRoot, { recursive: true });
const tempDir = fs.mkdtempSync(path.join(tempRoot, 'phantasma-sdk-public-types-'));
const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

const compilerArgs = [
  tscBin,
  '--ignoreConfig',
  '--noEmit',
  '--pretty',
  'false',
  '--strict',
  '--skipLibCheck',
  '--target',
  'ES2020',
  '--module',
  'NodeNext',
  '--moduleResolution',
  'NodeNext',
  '--types',
  'node',
];

function writeFile(name, source) {
  const file = path.join(tempDir, name);
  fs.writeFileSync(file, source);
  return file;
}

function runTsc(file) {
  return spawnSync(process.execPath, [...compilerArgs, file], {
    cwd: root,
    encoding: 'utf8',
  });
}

function expectTscSuccess(file) {
  const result = runTsc(file);
  if (result.status !== 0) {
    throw new Error(
      `Expected ${path.basename(file)} to compile:\n${result.stdout}${result.stderr}`
    );
  }
}

function expectTscFailure(file, expectedText) {
  const result = runTsc(file);
  const output = `${result.stdout}${result.stderr}`;
  if (result.status === 0 || !output.includes(expectedText)) {
    throw new Error(
      `Expected ${path.basename(file)} to fail with ${expectedText}:\n${output || '<no output>'}`
    );
  }
}

const publicConsumer = writeFile(
  'public-consumer.ts',
  `
import {
  Address,
  ContractInterface,
  Ed25519Signature,
  isRpcErrorResult,
  PBinaryWriter,
  PhantasmaAPI,
  PhantasmaKeys,
  ScriptBuilder,
  SignatureKind,
  Transaction,
  unwrapRpcResult,
  VMObject,
  VMType,
  type ContractDescriptor,
  type KeyPair,
  type LinkAccount,
  type JsonRpcParam,
  type KeyValue,
  type RpcErrorResult,
  type RpcResult,
  type Serializable,
  type SpecialResolutionArgumentsByMethod,
  type StackLike,
  type VmValue,
} from 'phantasma-sdk-ts/public';

const keys = PhantasmaKeys.generate();
const keyPair: KeyPair = keys;
const address = Address.fromPublicKey(keyPair.publicKey);
const script = new ScriptBuilder().beginScript().emitVarString(address.text).endScript();
const tx = new Transaction('testnet', 'main', script, new Date('2026-01-01T00:00:00Z'), '');
const decoded = Transaction.fromBytes(tx.toByteArray(false));
const signature = Ed25519Signature.generate(keys, tx.getUnsignedBytes());
const signatureKind: SignatureKind = signature.kind;
const signatureBytes: Uint8Array = signature.bytes;
const writer = new PBinaryWriter();
signature.serializeData(writer);
const vmObject = VMObject.fromObject(address.text);
const vmObjectType: VMType | undefined = vmObject?.type;
const vmObjectData: unknown = vmObject?.data;
const contractMethods = ContractInterface.empty.methods;
const contractMethodCount: number = ContractInterface.empty.methodCount;

const values: number[] = [];
const stack: StackLike<number> = {
  push(item) {
    values.push(item);
  },
  pop() {
    return values.pop();
  },
  peek() {
    return values[values.length - 1];
  },
  size() {
    return values.length;
  },
};

const account: LinkAccount = {
  alias: 'main',
  name: 'Main',
  address: Address.nullText,
  avatar: '',
  platform: 'phantasma',
  external: '',
  balances: [],
  files: [],
};

const contract: ContractDescriptor = { name: 'account', abi: ContractInterface.empty };
const api = new PhantasmaAPI('http://localhost:5172/rpc', null, 'localnet');
const heightPromise: Promise<number> = api.getBlockHeight('main');
const blockPromise = api.getLatestBlock('main');
blockPromise.then((block) => void block.hash);
const rawResultPromise: Promise<RpcResult<number>> = api.JSONRPCResult<number>('getBlockHeight', [
  'main',
]);
class LegacyRpcSubclass extends PhantasmaAPI {
  override async JSONRPC(method: string, params: JsonRpcParam[]): Promise<unknown> {
    return super.JSONRPC(method, params);
  }
}
const rpcResult: RpcResult<number> = { error: 'failure' };
const rpcError: RpcErrorResult = { error: 'failure', code: -32601 };
if (isRpcErrorResult(rpcResult)) {
  void rpcResult.error;
}
// Token metadata rows carry the VM shape the node answers, so a scalar and an array of structs
// must both be assignable, and the per-method argument map must be reachable from the public entry.
const scalarProperty: KeyValue = { key: 'name', value: 'Phantasma Stake' };
const structuredProperty: KeyValue = { key: '_ia', value: [{ mul: '25', who: ['00'] }] };
const inflationTargets: VmValue = structuredProperty.value;
const transferArguments: SpecialResolutionArgumentsByMethod['token.TransferFungible'] = {
  token: 'KCAL',
  tokenId: '2',
  from: 'S3dPnV8dfdkHDHDcJiHY255FEUZCM7oAmDW78LpYZ4jveGW',
  to: 'P2KFNXEbt65rQiWqogAzqkVGMqFirPmqPw8mQyxvRKsrXV8',
  amount: '10000000000',
};

const serializable: Serializable = {
  serializeData: () => undefined,
  unserializeData: () => undefined,
};
const addressSerializable: Serializable = address;
const unwrappedNumber = unwrapRpcResult<number>(123);

void decoded;
void signatureKind;
void signatureBytes;
void writer;
void vmObject;
void vmObjectType;
void vmObjectData;
void VMType.String;
void contractMethods;
void contractMethodCount;
void stack;
void account;
void contract;
void heightPromise;
void rawResultPromise;
void LegacyRpcSubclass;
void rpcError;
void serializable;
void addressSerializable;
void unwrappedNumber;
void scalarProperty;
void inflationTargets;
void transferArguments;
`
);

const legacyRootConsumer = writeFile(
  'legacy-root-consumer.ts',
  `
import type { IKeyPair } from 'phantasma-sdk-ts';

const legacy: IKeyPair | null = null;
void legacy;
`
);

const deepImportConsumer = writeFile(
  'deep-import-consumer.ts',
  `
import { Address } from 'phantasma-sdk-ts/public';
import { Ed25519Signature } from 'phantasma-sdk-ts/types/ed25519-signature';
import { Transaction as NewTransaction } from 'phantasma-sdk-ts/tx/transaction';
import { ScriptBuilder as NewScriptBuilder } from 'phantasma-sdk-ts/vm';
import { Address as NewAddress } from 'phantasma-sdk-ts/types/address';
import { Bytes32 as NewBytes32 } from 'phantasma-sdk-ts/types/carbon/bytes32';
import { TokenContractMethods } from 'phantasma-sdk-ts/types/carbon/blockchain/modules/token-contract-methods';
import { getPublicKey } from 'phantasma-sdk-ts/ledger/ledger-utils';
import type { LedgerAccountSigner, LedgerSigner } from 'phantasma-sdk-ts/ledger';
import { unwrapRpcResult } from 'phantasma-sdk-ts/rpc/rpc-result';
import { PhantasmaLink as NewPhantasmaLink } from 'phantasma-sdk-ts/link/phantasma-link';
import { Transaction as LegacyTransaction } from 'phantasma-sdk-ts/core/tx/Transaction';
import { ScriptBuilder as LegacyScriptBuilder } from 'phantasma-sdk-ts/core/vm';
import { Address as LegacyAddress } from 'phantasma-sdk-ts/core/types/Address';
import { Bytes32 as LegacyBytes32 } from 'phantasma-sdk-ts/core/types/Carbon/Bytes32';

const script = new NewScriptBuilder().beginScript().emitVarString('deep-imports').endScript();
const tx = new NewTransaction('testnet', 'main', script, new Date('2026-01-01T00:00:00Z'), '');
const signature = new Ed25519Signature();
const legacyTx = LegacyTransaction.fromBytes(tx.toByteArray(false));
const legacyScript = new LegacyScriptBuilder().beginScript().emitVarString('legacy').endScript();
const legacySigner: LedgerSigner = {
  GetPublicKey: () => '00'.repeat(32),
  GetAccount: () => Address.nullAddress,
};
const accountSigner: LedgerAccountSigner = {
  getPublicKey: () => '00'.repeat(32),
  getAccount: () => Address.nullAddress,
  GetPublicKey: () => '00'.repeat(32),
  GetAccount: () => Address.nullAddress,
};

void legacyTx;
void signature.bytes;
void legacyScript;
void legacySigner;
void accountSigner;
void NewAddress.nullText;
void NewBytes32;
void TokenContractMethods.TransferFungible;
void getPublicKey;
void unwrapRpcResult;
void NewPhantasmaLink;
void LegacyAddress.NullText;
void LegacyBytes32;
`
);

const legacyPublicConsumer = writeFile(
  'legacy-public-consumer.ts',
  `
import type { IKeyPair } from 'phantasma-sdk-ts/public';

const legacy: IKeyPair | null = null;
void legacy;
`
);

try {
  expectTscSuccess(publicConsumer);
  expectTscSuccess(legacyRootConsumer);
  expectTscSuccess(deepImportConsumer);
  expectTscFailure(legacyPublicConsumer, "has no exported member named 'IKeyPair'");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
