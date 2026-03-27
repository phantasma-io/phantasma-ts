import {
  buildContractArtifactBundle,
  buildContractArtifactManifest,
  coerceContractBytes,
} from '../../src/core/tx/ContractArtifacts';

describe('ContractArtifacts', () => {
  it('builds a manifest with stable hashes and sizes', () => {
    const manifest = buildContractArtifactManifest({
      contractName: ' SampleContract ',
      compilerName: 'pha-tomb',
      compilerVersion: '2.0.0',
      scriptPath: 'SampleContract.pvm',
      script: 'CAFE',
      abiPath: 'SampleContract.abi',
      abi: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      debugPath: 'SampleContract.debug',
      debug: new TextEncoder().encode('{"ok":true}'),
      sourceFile: 'SampleContract.tomb',
      createdAtUtc: '2026-03-27T00:00:00.000Z',
    });

    expect(manifest).toEqual({
      format: 'pha.contract.artifacts/v1',
      contractName: 'SampleContract',
      createdAtUtc: '2026-03-27T00:00:00.000Z',
      compiler: {
        name: 'pha-tomb',
        version: '2.0.0',
      },
      sourceFile: 'SampleContract.tomb',
      files: {
        script: {
          path: 'SampleContract.pvm',
          size: 2,
          sha256: '03346f0e7990de2423a3bca5335bf92cdc0bd14bef2206b87c63f18a1e996c52',
        },
        abi: {
          path: 'SampleContract.abi',
          size: 4,
          sha256: '5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953',
        },
        debug: {
          path: 'SampleContract.debug',
          size: 11,
          sha256: '4062edaf750fb8074e7e83e0c9028c94e32468a8b6f1614774328ef045150f93',
        },
      },
    });
  });

  it('normalizes hex strings and copies bundle bytes', () => {
    const script = new Uint8Array([1, 2, 3]);
    const bundle = buildContractArtifactBundle({
      contractName: 'BundleContract',
      script,
      abi: '0X0A0B',
    });

    script[0] = 9;

    expect(bundle.contractName).toBe('BundleContract');
    expect(Array.from(bundle.script)).toEqual([1, 2, 3]);
    expect(Array.from(bundle.abi)).toEqual([10, 11]);
  });

  it('rejects invalid hex strings', () => {
    expect(() => coerceContractBytes('zz', 'script')).toThrow('Invalid hex string: zz');
  });
});
