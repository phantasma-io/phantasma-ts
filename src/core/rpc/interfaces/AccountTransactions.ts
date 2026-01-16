import { TransactionData } from './TransactionData.js';

export interface AccountTransactions {
  address: string;
  txs: Array<TransactionData>; //List of transactions
}
