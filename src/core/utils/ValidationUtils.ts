import { DomainSettings } from '../types/DomainSettings';

export const ANONYMOUS_NAME = 'anonymous';
export const GENESIS_NAME = 'genesis';
export const ENTRY_CONTEXT_NAME = 'entry';
export const NULL_NAME = 'null';

const prefixNames: string[] = [
  'phantasma', 'neo', 'ethereum', 'bitcoin', 'litecoin', 'eos',
  'decentraland', 'elastos', 'loopring', 'grin', 'nuls',
  'bancor', 'ark', 'nos', 'bluzelle', 'satoshi', 'gwei', 'nacho',
  'oracle', 'oracles', 'dex', 'exchange', 'wallet', 'account',
  'airdrop', 'giveaway', 'free', 'mail', 'dapp', 'charity', 'address', 'system',
  'coin', 'token', 'nexus', 'deposit', 'phantom', 'cityofzion', 'coz',
  'huobi', 'binance', 'kraken', 'kucoin', 'coinbase', 'switcheo', 'bittrex', 'bitstamp',
  'bithumb', 'okex', 'hotbit', 'bitmart', 'bilaxy', 'vitalik', 'nakamoto',
];

const reservedNames: string[] = [
  'ripple', 'tether', 'tron', 'chainchanged', 'libra', 'loom', 'enigma', 'wax',
  'monero', 'dash', 'tezos', 'cosmos', 'maker', 'ontology', 'dogecoin', 'zcash', 'vechain',
  'qtum', 'omise', 'holo', 'nano', 'augur', 'waves', 'icon', 'dai', 'bitshares',
  'siacoin', 'komodo', 'zilliqa', 'steem', 'enjin', 'aelf', 'nash', 'stratis',
  'windows', 'osx', 'ios', 'android', 'google', 'yahoo', 'facebook', 'alibaba', 'ebay',
  'apple', 'amazon', 'microsoft', 'samsung', 'verizon', 'walmart', 'ibm', 'disney',
  'netflix', 'alibaba', 'tencent', 'baidu', 'visa', 'mastercard', 'instagram', 'paypal',
  'adobe', 'huawei', 'vodafone', 'dell', 'uber', 'youtube', 'whatsapp', 'snapchat', 'pinterest',
  'gamecenter', 'pixgamecenter', 'seal', 'crosschain', 'blacat',
  'bitladon', 'bitcoinmeester', 'ico', 'ieo', 'sto', 'kyc',
];

export function isReservedIdentifier(name: string): boolean {
  if (name === DomainSettings.InfusionName) {
    return true;
  }

  if (name === NULL_NAME) {
    return true;
  }

  if (prefixNames.some(prefix => name.startsWith(prefix))) {
    return true;
  }

  return reservedNames.includes(name);
}

export function isValidIdentifier(name: string | null | undefined): boolean {
  if (!name) {
    return false;
  }

  if (name.length < 3 || name.length > 15) {
    return false;
  }

  if (name === ANONYMOUS_NAME || name === GENESIS_NAME || name === ENTRY_CONTEXT_NAME) {
    return false;
  }

  for (let index = 0; index < name.length; index++) {
    const code = name.charCodeAt(index);
    if (code >= 97 && code <= 122) continue; // lowercase a-z
    if (code === 95) continue; // underscore
    if (index > 0 && code >= 48 && code <= 57) continue; // digits except first char
    return false;
  }

  return true;
}

export function isValidTicker(name: string | null | undefined): boolean {
  if (!name) {
    return false;
  }

  if (name.length < 2 || name.length > 5) {
    return false;
  }

  for (let index = 0; index < name.length; index++) {
    const code = name.charCodeAt(index);
    if (code >= 65 && code <= 90) continue; // uppercase A-Z
    return false;
  }

  return true;
}
