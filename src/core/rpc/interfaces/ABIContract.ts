import { ABIMethod } from './ABIMethod.js';

export interface ABIContract {
  name: string; //Name of contract
  methods: Array<ABIMethod>; //List of methods
}
