import { Platform } from './Platform.js';
import { Governance } from './Governance.js';
import { Token } from './Token.js';
import { Chain } from './Chain.js';

export interface Nexus {
  name: string; //Name of the nexus
  protocol: string;
  platforms: Array<Platform>; //List of platforms
  tokens: Array<Token>; //List of tokens
  chains: Array<Chain>; //List of chains
  governance: Array<Governance>; //List of governance values
  organizations: Array<string>; //List of organizations
}
