// coin used by ledger nano s.

import { bufferToHex, hexToByteArray } from '../utils';
import { LedgerConfig } from './interfaces/LedgerConfig';

// 60   | 0x80000273 | SOUL   | [Phantasma](https://phantasma.info/)
export const SOUL_COIN: number = 60;

/**
 * converts a mnemonic into a private key, using the phantasma coin's bip44 path.
 *
 * @param config the config
 * @param mnemonic the mnemonic
 * @param index the bip44 index
 * @return returns the private key, hex encoded, upper case.
 */
export const GetPrivateKeyFromMnemonic = (
  config: LedgerConfig,
  mnemonic: string,
  index: string
): string => {
  const bip39 = config.Bip39;
  const seedBytes = bip39.mnemonicToSeedSync(mnemonic);
  const seed = bufferToHex(seedBytes);
  return GetPrivateKeyFromSeed(config, seed, index);
};

/**
 * converts a mnemonic into a seed.
 *
 * @param config the config
 * @param seed the seed
 * @param index the bip44 index
 * @return returns the seed, hex encoded, upper case.
 */
export const GetPrivateKeyFromSeed = (
  config: LedgerConfig,
  seed: string,
  index: string
): string => {
  const bip32Factory = config.Bip32Factory;
  const curve = config.Curve;
  const seedBytes = hexToByteArray(seed);
  const bip32 = bip32Factory(curve);
  const bip32node = bip32.fromSeed(seedBytes);

  const bip44path = GetBip44Path(index);
  const bip32child = bip32node.derivePath(bip44path);

  return Buffer.from(bip32child.privateKey).toString('hex').toUpperCase();
};

/**
 * converts a mnemonic into a Poltergeist mnemonic, using the phantasma coin's bip44 path.
 *
 * @param config the config
 * @param mnemonic the mnemonic
 * @param index the index
 * @return returns the private key, hex encoded, upper case.
 */
export const GetPoltergeistMnemonic = (
  config: LedgerConfig,
  mnemonic: string,
  index: string
): string => {
  const bip39 = config.Bip39;
  const privateKey = GetPrivateKeyFromMnemonic(config, mnemonic, index);
  const poltergeistMnemonic = bip39.entropyToMnemonic(privateKey);
  return poltergeistMnemonic;
};

/**
 * @param index the index
 * @return returns the bip44 path.
 */
export const GetBip44Path = (index: string): string => {
  const bip44path = `m/44'/${SOUL_COIN}'/0'/0/${index}`;
  return bip44path;
};
