import { Stake } from './stake.js';

/**
 * Lightweight account overview returned by `getAccountInfo`.
 *
 * Carries no balances and no NFT id lists, so the cost of fetching it does not grow with how much
 * an address holds - unlike {@link Account}, whose `balances[].ids` embed every owned NFT id and are
 * capped server-side at 10000 entries per token. Balances and NFTs are fetched separately through
 * the cursor-paginated `getAccountFungibleTokens` / `getAccountNFTs` / `getAccountOwnedTokens`.
 */
export interface AccountInfo {
  address: string;
  /** On-chain registered name, or `anonymous` when the address has none. */
  name: string;
  /**
   * Staking info. Note the wire name differs from {@link Account}, which carries the same object
   * under `stakes` and uses `stake` for a deprecated flat scalar.
   */
  stake: Stake;
}
