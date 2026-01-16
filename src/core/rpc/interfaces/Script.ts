import { Event } from './Event.js';
import { Oracle } from './Oracle.js';

export interface Script {
  events: Array<Event>; //List of events that triggered in the transaction
  result: string;
  results: Array<string>; //Results of the transaction, if any. Serialized, in hexadecimal format
  oracles: Array<Oracle>; //List of oracle reads that were triggered in the transaction
}
