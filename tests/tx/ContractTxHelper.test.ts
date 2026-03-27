import {
  ContractTxHelper,
  PhantasmaKeys,
  ProofOfWork,
  ScriptBuilder,
  Transaction,
  hexToBytes,
} from '../../src/index';

const TEST_WIF = 'L5UEVHBjujaR1721aZM5Zm5ayjDyamMZS9W35RE9Y9giRkdf3dVx';
const TEST_ADDRESS = PhantasmaKeys.fromWIF(TEST_WIF).Address.Text;

describe('ContractTxHelper', () => {
  it('builds deploy script identical to manual Runtime.DeployContract assembly', () => {
    const helperScript = ContractTxHelper.buildDeployScript({
      from: TEST_ADDRESS,
      contractName: 'sample',
      script: new Uint8Array([0xca, 0xfe]),
      abi: new Uint8Array([0xde, 0xad]),
      gasPrice: 100000,
      gasLimit: 100000,
    });

    const manualScript = new ScriptBuilder()
      .BeginScript()
      .AllowGas(TEST_ADDRESS, new ScriptBuilder().NullAddress, 100000, 100000)
      .CallInterop('Runtime.DeployContract', [
        TEST_ADDRESS,
        'sample',
        new Uint8Array([0xca, 0xfe]),
        new Uint8Array([0xde, 0xad]),
      ])
      .SpendGas(TEST_ADDRESS)
      .EndScript();

    expect(helperScript).toBe(manualScript);
  });

  it('builds upgrade transactions with defaults', () => {
    const tx = ContractTxHelper.buildUpgradeTransaction({
      nexus: 'simnet',
      from: TEST_ADDRESS,
      contractName: 'sample',
      script: 'CAFE',
      abi: 'DEAD',
    });

    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.nexusName).toBe('simnet');
    expect(tx.chainName).toBe('main');
    expect(tx.script).toMatch(/^[0-9A-F]+$/);
  });

  it('signs and encodes deploy transactions', () => {
    const encoded = ContractTxHelper.buildDeployTransactionAndEncode({
      nexus: 'simnet',
      from: TEST_ADDRESS,
      contractName: 'sample',
      script: 'CAFE',
      abi: 'DEAD',
      signer: TEST_WIF,
      proofOfWork: ProofOfWork.None,
    });

    const tx = Transaction.Unserialize(hexToBytes(encoded));
    expect(tx.GetSignatureInfo()).toHaveLength(1);
    expect(tx.VerifySignature(TEST_ADDRESS)).toBe(true);
  });

  it('encodes UTF-8 payload text without VM wrapper bytes', () => {
    expect(ContractTxHelper.encodePayloadText('pha')).toBe('706861');
  });
});
