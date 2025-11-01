import { Bytes32 } from '../../../Bytes32';
import { IntX } from '../../../IntX';
import { SmallString } from '../../../SmallString';
import { CarbonTokenFlags } from '../../CarbonTokenFlags';
import { TokenInfo } from '../TokenInfo';
import { TokenSchemasBuilder } from './TokenSchemasBuilder';

export class TokenInfoBuilder {
  static build(
    symbol: string,
    maxSupply: IntX,
    isNFT: boolean,
    decimals: number,
    creatorPublicKey: Bytes32,
    metadata?: Uint8Array,
    tokenSchemas?: Uint8Array
  ): TokenInfo {
    const {ok, error} = this.checkIsValidSymbol(symbol);
    if(!ok){
      throw Error(error ?? "Unknown error");
    }

    const tokenInfo = new TokenInfo();
    tokenInfo.maxSupply = maxSupply;

    tokenInfo.flags = 0; // Small fungible
    if (isNFT) {
      if (!maxSupply.is8ByteSafe()) {
        throw Error("NFT maximum supply must fit into Int64");
      }
      tokenInfo.flags = CarbonTokenFlags.NonFungible;
    } else {
      if (!maxSupply.is8ByteSafe()) {
        tokenInfo.flags = CarbonTokenFlags.BigFungible;
      }
    }

    tokenInfo.decimals = decimals;
    tokenInfo.owner = creatorPublicKey;
    tokenInfo.symbol = new SmallString(symbol);
    tokenInfo.metadata = metadata;
    tokenInfo.tokenSchemas = tokenSchemas || TokenSchemasBuilder.buildAndSerialize();

    return tokenInfo;
  }

  static maxSymbolLength: number = 255;
  /**
  * Mirrors carbon::CheckIsValidSymbol from contracts/token.cpp.
  * Returns true when valid, or false when the symbol must be rejected.
  */
  static checkIsValidSymbol(symbol: string): {ok: boolean, error: string | null} {
    if (!symbol || symbol.length === 0) {
      return {ok: false, error: "Symbol validation error: Empty string is invalid"};
    }
    if (symbol.length > this.maxSymbolLength) {
      return {ok: false, error: "Symbol validation error: Too long"};
    }

    for (let i = 0; i < symbol.length; i++) {
      const code = symbol.charCodeAt(i);
      const isUppercaseAsciiLetter = code >= 0x41 && code <= 0x5a; // 'A'..'Z'
      if (!isUppercaseAsciiLetter) {
        return {ok: false, error: "Symbol validation error: Anything outside A–Z is forbidden (digits, accents, etc.)"};
      }
    }

    return {ok: true, error: null};
  }
}
