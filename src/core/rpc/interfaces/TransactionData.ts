import { Event } from './Event';
import { EventExtended } from './EventExtended';
import { SignatureResult } from './SignatureResult';

export interface TransactionData {
  hash: string; //Hash of the transaction
  chainAddress: string; //Transaction chain address
  timestamp: number; //Block time
  blockHeight: number; //Block height at which the transaction was accepted
  blockHash: string; //Hash of the block
  script: string; //Script content of the transaction, in hexadecimal format
  payload: string; //Payload content of the transaction, in hexadecimal format
  carbonTxType: number; //Carbon transaction type identifier
  carbonTxData: string; //Carbon transaction payload, hex encoded
  events: Array<Event>; //List of events that triggered in the transaction
  extendedEvents?: Array<EventExtended>; //Extended events, if available
  result: string; //Result of the transaction, if any. Serialized, in hexadecimal format
  debugComment: string; //Debug comment of the transaction, if any. Explains rejection reason
  fee: string; //Fee of the transaction, in KCAL, fixed point
  state: string;
  signatures: Array<SignatureResult>;
  sender: string;
  gasPayer: string;
  gasTarget: string;
  gasPrice: string;
  gasLimit: string;
  expiration: number;
}
