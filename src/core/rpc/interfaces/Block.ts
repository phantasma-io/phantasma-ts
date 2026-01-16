import { Event } from './Event.js';
import { Oracle } from './Oracle.js';
import { TransactionData } from './TransactionData.js';

export interface Block {
  hash: string;
  previousHash: string; //Hash of previous block
  timestamp: number;
  height: number;
  chainAddress: string; //Address of chain where the block belongs
  protocol: number; //Network protocol version
  txs: Array<TransactionData>; //List of transactions in block
  validatorAddress: string; //Address of validator who minted the block
  reward: string; //Amount of KCAL rewarded by this fees in this block
  events: Array<Event>; //Block events
  oracles: Array<Oracle>; //Block oracles
}
