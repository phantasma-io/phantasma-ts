import { ProofOfWork } from '../link/interfaces/ProofOfWork.js';
import { Address } from '../types/Address.js';
import { DomainSettings } from '../types/DomainSettings.js';
import { PhantasmaKeys } from '../types/PhantasmaKeys.js';
import { bytesToHex } from '../utils/index.js';
import { ScriptBuilder } from '../vm/index.js';
import { Transaction } from './Transaction.js';
import { ContractArtifactBundle, ContractBinaryInput, coerceContractBytes, normalizeContractName } from './ContractArtifacts.js';

export interface ContractScriptBuildParams {
  from: string | Address;
  contractName: string;
  script: ContractBinaryInput;
  abi: ContractBinaryInput;
  gasPrice?: number | bigint;
  gasLimit?: number | bigint;
}

export interface ContractTransactionBuildParams extends ContractScriptBuildParams {
  nexus: string;
  chain?: string;
  expiration?: Date;
  payloadHex?: string;
}

export interface ContractTransactionSignParams extends ContractTransactionBuildParams {
  signer: string | PhantasmaKeys;
  proofOfWork?: number;
}

export class ContractTxHelper {
  static readonly DefaultGasPrice = DomainSettings.DefaultMinimumGasFee;
  static readonly DefaultGasLimit = 100_000;

  static buildDeployScript(params: ContractScriptBuildParams): string {
    return this.buildContractLifecycleScript('Runtime.DeployContract', params);
  }

  static buildUpgradeScript(params: ContractScriptBuildParams): string {
    return this.buildContractLifecycleScript('Runtime.UpgradeContract', params);
  }

  static buildDeployTransaction(params: ContractTransactionBuildParams): Transaction {
    return this.buildContractLifecycleTransaction(this.buildDeployScript(params), params);
  }

  static buildUpgradeTransaction(params: ContractTransactionBuildParams): Transaction {
    return this.buildContractLifecycleTransaction(this.buildUpgradeScript(params), params);
  }

  static buildDeployTransactionAndEncode(params: ContractTransactionSignParams): string {
    const tx = this.buildDeployTransaction(params);
    this.signTransaction(tx, params.signer, params.proofOfWork);
    return tx.ToStringEncoded(true).toUpperCase();
  }

  static buildUpgradeTransactionAndEncode(params: ContractTransactionSignParams): string {
    const tx = this.buildUpgradeTransaction(params);
    this.signTransaction(tx, params.signer, params.proofOfWork);
    return tx.ToStringEncoded(true).toUpperCase();
  }

  static buildDeployScriptFromBundle(bundle: ContractArtifactBundle, from: string | Address, gasPrice?: number | bigint, gasLimit?: number | bigint): string {
    return this.buildDeployScript({
      from,
      contractName: bundle.contractName,
      script: bundle.script,
      abi: bundle.abi,
      gasPrice,
      gasLimit,
    });
  }

  static buildUpgradeScriptFromBundle(bundle: ContractArtifactBundle, from: string | Address, gasPrice?: number | bigint, gasLimit?: number | bigint): string {
    return this.buildUpgradeScript({
      from,
      contractName: bundle.contractName,
      script: bundle.script,
      abi: bundle.abi,
      gasPrice,
      gasLimit,
    });
  }

  static encodePayloadText(text: string): string {
    return bytesToHex(new TextEncoder().encode(text));
  }

  private static buildContractLifecycleScript(
    interopName: 'Runtime.DeployContract' | 'Runtime.UpgradeContract',
    params: ContractScriptBuildParams
  ): string {
    // Keep deploy/upgrade on the same legacy VM script path so CLI and wallet flows generate identical transactions.
    const fromAddress = this.normalizeAddress(params.from);
    const contractName = normalizeContractName(params.contractName);
    const scriptBytes = coerceContractBytes(params.script, 'script');
    const abiBytes = coerceContractBytes(params.abi, 'abi');
    const gasPrice = this.normalizeSmallInteger(params.gasPrice ?? this.DefaultGasPrice, 'gasPrice');
    const gasLimit = this.normalizeSmallInteger(params.gasLimit ?? this.DefaultGasLimit, 'gasLimit');
    const nullAddress = new ScriptBuilder().NullAddress;

    return new ScriptBuilder()
      .BeginScript()
      .AllowGas(fromAddress, nullAddress, gasPrice, gasLimit)
      .CallInterop(interopName, [fromAddress, contractName, scriptBytes, abiBytes])
      .SpendGas(fromAddress)
      .EndScript();
  }

  private static buildContractLifecycleTransaction(
    scriptHex: string,
    params: ContractTransactionBuildParams
  ): Transaction {
    // Transaction construction stays separate from signing so callers can inspect or override the unsigned tx first.
    const nexus = params.nexus.trim();
    const chain = (params.chain ?? DomainSettings.RootChainName).trim();

    if (!nexus) {
      throw new Error('nexus cannot be empty');
    }
    if (!chain) {
      throw new Error('chain cannot be empty');
    }

    const payloadHex = params.payloadHex?.trim() ?? '';
    return new Transaction(
      nexus,
      chain,
      scriptHex,
      params.expiration ?? new Date(Date.now() + 5 * 60 * 1000),
      payloadHex
    );
  }

  private static signTransaction(
    tx: Transaction,
    signer: string | PhantasmaKeys,
    proofOfWork: number = ProofOfWork.Minimal
  ): void {
    // Mining/signing is the only mutation stage; everything above should remain deterministic and side-effect free.
    if (proofOfWork > 0) {
      tx.mineTransaction(proofOfWork);
    }

    if (typeof signer === 'string') {
      const trimmedWif = signer.trim();
      if (!trimmedWif) {
        throw new Error('signer WIF cannot be empty');
      }
      tx.sign(trimmedWif);
      return;
    }

    tx.signWithKeys(signer);
  }

  private static normalizeAddress(address: string | Address): string | Address {
    if (typeof address === 'string') {
      const trimmed = address.trim();
      if (!trimmed) {
        throw new Error('from cannot be empty');
      }
      return trimmed;
    }

    return address;
  }

  private static normalizeSmallInteger(value: number | bigint, label: string): number {
    const numeric = typeof value === 'bigint' ? Number(value) : value;
    if (!Number.isSafeInteger(numeric) || numeric <= 0) {
      throw new Error(`${label} must be a positive safe integer`);
    }

    return numeric;
  }
}
