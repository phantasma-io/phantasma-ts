import { PhantasmaAPI } from '../../rpc/phantasma.js';

export interface LedgerConfig {
  Debug: boolean;
  Transport: any; // Replace 'any' with the actual type of transport
  Bip39: any; // Replace 'any' with the actual type of bip39
  Bip32Factory: any; // Replace 'any' with the actual type of bip32Factory
  Curve: any; // Replace 'any' with the actual type of curve
  NexusName: string;
  ChainName: string;
  Payload: string;
  TokenNames: string[];
  RPC: PhantasmaAPI;
  GasPrice: number;
  GasLimit: number;
  VerifyResponse: boolean;
}
