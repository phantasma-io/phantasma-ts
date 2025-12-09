export interface Auction {
  creatorAddress: string; //Address of auction creator
  chainAddress: string; //Address of auction chain
  startDate: number;
  endDate: number;
  baseSymbol: string;
  quoteSymbol: string;
  tokenId: string;
  price: string;
  endPrice: string;
  extensionPeriod: string;
  type: string;
  rom: string;
  ram: string;
  listingFee: string;
  currentWinner: string;
}
