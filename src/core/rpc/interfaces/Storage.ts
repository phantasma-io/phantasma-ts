import { Archive } from './Archive.js';

export interface Storage {
  available: number;
  used: number;
  avatar: string;
  archives: Array<Archive>;
}
