import { Balance } from './Balance.js';
import { Stake } from './Stake.js';
import { Storage } from './Storage.js';

export interface Account {
  address: string;
  name: string;
  stakes: Stake; //Info about staking if available
  stake: string;
  unclaimed: string;
  relay: string; //Amount of available KCAL for relay channel
  validator: string; //Validator role
  storage: Storage;
  balances: Array<Balance>;
  txs: Array<string>;
}
