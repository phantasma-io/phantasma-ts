// namespace PhantasmaPhoenix.Protocol.Carbon.Blockchain.TxHelpers

/** Common interface for fee option. */
export interface IFeeOptions {
  feeMultiplier: bigint;
  calculateMaxGas(...args: unknown[]): bigint;
}

/** Base fee options with sensible defaults. */
export class FeeOptions implements IFeeOptions {
  gasFeeBase: bigint;
  feeMultiplier: bigint;

  constructor(gasFeeBase: bigint = 10_000n, feeMultiplier: bigint = 1_000n) {
    this.gasFeeBase = gasFeeBase;
    this.feeMultiplier = feeMultiplier;
  }

  calculateMaxGas(..._args: unknown[]): bigint {
    return this.gasFeeBase * this.feeMultiplier;
  }
}

/** Fee options for token creation transactions. */
export class CreateTokenFeeOptions extends FeeOptions implements IFeeOptions {
  gasFeeCreateTokenBase: bigint;
  gasFeeCreateTokenSymbol: bigint;

  constructor(
    gasFeeBase: bigint = 10_000n,
    gasFeeCreateTokenBase: bigint = 10_000_000_000n,
    gasFeeCreateTokenSymbol: bigint = 10_000_000_000n,
    feeMultiplier: bigint = 10_000n
  ) {
    super(gasFeeBase, feeMultiplier);
    this.gasFeeCreateTokenBase = gasFeeCreateTokenBase;
    this.gasFeeCreateTokenSymbol = gasFeeCreateTokenSymbol;
  }

  override calculateMaxGas(...args: unknown[]): bigint {
    let symbol = '';
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null && 'data' in args[0]) {
      const s = args[0] as { data: string };
      symbol = s.data;
    }
    const symbolLen = symbol.length;
    const shift = symbolLen > 0 ? BigInt(symbolLen - 1) : 0n;
    const symbolCost = this.gasFeeCreateTokenSymbol >> shift;
    return (this.gasFeeBase + this.gasFeeCreateTokenBase + symbolCost) * this.feeMultiplier;
  }
}

/** Fee options for creating a new series on an NFT token. */
export class CreateSeriesFeeOptions extends FeeOptions implements IFeeOptions {
  gasFeeCreateSeriesBase: bigint;

  constructor(
    gasFeeBase: bigint = 10_000n,
    gasFeeCreateSeriesBase: bigint = 2_500_000_000n,
    feeMultiplier: bigint = 10_000n
  ) {
    super(gasFeeBase, feeMultiplier);
    this.gasFeeCreateSeriesBase = gasFeeCreateSeriesBase;
  }

  override calculateMaxGas(..._args: unknown[]): bigint {
    return (this.gasFeeBase + this.gasFeeCreateSeriesBase) * this.feeMultiplier;
  }
}

/** Fee options for minting non-fungible tokens (NFT instances). */
export class MintNftFeeOptions extends FeeOptions implements IFeeOptions {
  constructor(gasFeeBase: bigint = 10_000n, feeMultiplier: bigint = 1_000n) {
    super(gasFeeBase, feeMultiplier);
  }

  override calculateMaxGas(..._args: unknown[]): bigint {
    return this.gasFeeBase * this.feeMultiplier;
  }
}
