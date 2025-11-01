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
    const tokenInfo = new TokenInfo();
    tokenInfo.maxSupply = maxSupply;

    tokenInfo.flags = 0; // Small fungible
    if(isNFT) {
      if(!maxSupply.is8ByteSafe()){
        throw Error("NFT maximum supply must fit into Int64");
      }
      tokenInfo.flags = CarbonTokenFlags.NonFungible;
    } else {
      if(!maxSupply.is8ByteSafe()){
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
}
