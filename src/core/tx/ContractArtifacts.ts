import SHA256 from 'crypto-js/sha256.js';
import hexEncoding from 'crypto-js/enc-hex.js';
import { bytesToHex, hexToBytes } from '../utils/index.js';

export type ContractBinaryInput = Uint8Array | string;

export interface ContractArtifactFileEntry {
  path: string;
  size: number;
  sha256: string;
}

export interface ContractArtifactManifest {
  format: 'pha.contract.artifacts/v1';
  contractName: string;
  createdAtUtc: string;
  compiler: {
    name: string;
    version: string;
  };
  sourceFile?: string;
  files: {
    script: ContractArtifactFileEntry;
    abi: ContractArtifactFileEntry;
    debug?: ContractArtifactFileEntry;
  };
}

export interface ContractArtifactBundle {
  contractName: string;
  script: Uint8Array;
  abi: Uint8Array;
  debug?: Uint8Array;
  manifest?: ContractArtifactManifest;
}

export interface BuildContractArtifactManifestParams {
  contractName: string;
  compilerName: string;
  compilerVersion: string;
  scriptPath: string;
  script: ContractBinaryInput;
  abiPath: string;
  abi: ContractBinaryInput;
  sourceFile?: string;
  debugPath?: string;
  debug?: ContractBinaryInput;
  createdAtUtc?: string;
}

export interface BuildContractArtifactBundleParams {
  contractName: string;
  script: ContractBinaryInput;
  abi: ContractBinaryInput;
  debug?: ContractBinaryInput;
  manifest?: ContractArtifactManifest;
}

function sha256Hex(bytes: Uint8Array): string {
  return SHA256(hexEncoding.parse(bytesToHex(bytes))).toString(hexEncoding);
}

function buildFileEntry(path: string, bytes: Uint8Array): ContractArtifactFileEntry {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    throw new Error('artifact path cannot be empty');
  }

  return {
    path: trimmedPath,
    size: bytes.length,
    sha256: sha256Hex(bytes),
  };
}

export function normalizeContractName(contractName: string): string {
  const trimmed = contractName.trim();
  if (!trimmed) {
    throw new Error('contractName cannot be empty');
  }

  return trimmed;
}

export function coerceContractBytes(input: ContractBinaryInput, label: string): Uint8Array {
  if (input instanceof Uint8Array) {
    if (input.length === 0) {
      throw new Error(`${label} cannot be empty`);
    }

    // Copy mutable buffers so callers can keep reusing their original arrays safely.
    return new Uint8Array(input);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error(`${label} cannot be empty`);
    }

    const bytes = hexToBytes(trimmed);
    if (bytes.length === 0) {
      throw new Error(`${label} cannot be empty`);
    }
    return bytes;
  }

  throw new Error(`${label} must be Uint8Array or hex string`);
}

export function buildContractArtifactManifest(
  params: BuildContractArtifactManifestParams
): ContractArtifactManifest {
  // The manifest is the stable handoff contract between compiler, CLI, frontend, and runbooks.
  const contractName = normalizeContractName(params.contractName);
  const compilerName = params.compilerName.trim();
  const compilerVersion = params.compilerVersion.trim();

  if (!compilerName) {
    throw new Error('compilerName cannot be empty');
  }
  if (!compilerVersion) {
    throw new Error('compilerVersion cannot be empty');
  }

  const scriptBytes = coerceContractBytes(params.script, 'script');
  const abiBytes = coerceContractBytes(params.abi, 'abi');

  let debugEntry: ContractArtifactFileEntry | undefined;
  if (params.debugPath !== undefined || params.debug !== undefined) {
    if (!params.debugPath || params.debug === undefined) {
      throw new Error('debugPath and debug must be provided together');
    }
    debugEntry = buildFileEntry(params.debugPath, coerceContractBytes(params.debug, 'debug'));
  }

  const manifest: ContractArtifactManifest = {
    format: 'pha.contract.artifacts/v1',
    contractName,
    createdAtUtc: (params.createdAtUtc ?? new Date().toISOString()).trim(),
    compiler: {
      name: compilerName,
      version: compilerVersion,
    },
    files: {
      script: buildFileEntry(params.scriptPath, scriptBytes),
      abi: buildFileEntry(params.abiPath, abiBytes),
      ...(debugEntry ? { debug: debugEntry } : {}),
    },
    ...(params.sourceFile ? { sourceFile: params.sourceFile } : {}),
  };

  if (!manifest.createdAtUtc) {
    throw new Error('createdAtUtc cannot be empty');
  }

  return manifest;
}

export function buildContractArtifactBundle(
  params: BuildContractArtifactBundleParams
): ContractArtifactBundle {
  // Keep bundle materialization small and explicit so higher layers can choose their own IO/layout policy.
  const bundle: ContractArtifactBundle = {
    contractName: normalizeContractName(params.contractName),
    script: coerceContractBytes(params.script, 'script'),
    abi: coerceContractBytes(params.abi, 'abi'),
    ...(params.debug !== undefined ? { debug: coerceContractBytes(params.debug, 'debug') } : {}),
    ...(params.manifest ? { manifest: params.manifest } : {}),
  };

  return bundle;
}
