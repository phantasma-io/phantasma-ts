import { ABIEvent } from './ABIEvent.js';
import { ABIMethod } from './ABIMethod.js';

export interface Contract {
  name: string;
  address: string;
  owner: string;
  script: string;
  methods?: Array<ABIMethod>;
  events?: Array<ABIEvent>;
}
