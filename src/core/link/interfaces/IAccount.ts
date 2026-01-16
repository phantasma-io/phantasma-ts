import { Balance } from '../../rpc/interfaces/Balance.js';
import { IFile } from './IFile.js';

export interface IAccount {
  alias: string;
  name: string;
  address: string;
  avatar: string;
  platform: string;
  external: string;
  balances: Balance[];
  files: IFile[];
}
