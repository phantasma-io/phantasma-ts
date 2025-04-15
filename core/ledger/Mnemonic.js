"use strict";
// coin used by ledger nano s.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBip44Path = exports.GetPoltergeistMnemonic = exports.GetPrivateKeyFromSeed = exports.GetPrivateKeyFromMnemonic = exports.SOUL_COIN = void 0;
var utils_1 = require("../utils");
// 60   | 0x80000273 | SOUL   | [Phantasma](https://phantasma.info/)
exports.SOUL_COIN = 60;
/**
 * converts a mnemonic into a private key, using the phantasma coin's bip44 path.
 *
 * @param config the config
 * @param mnemonic the mnemonic
 * @param index the bip44 index
 * @return returns the private key, hex encoded, upper case.
 */
var GetPrivateKeyFromMnemonic = function (config, mnemonic, index) {
    var bip39 = config.Bip39;
    var seedBytes = bip39.mnemonicToSeedSync(mnemonic);
    var seed = (0, utils_1.bufferToHex)(seedBytes);
    return (0, exports.GetPrivateKeyFromSeed)(config, seed, index);
};
exports.GetPrivateKeyFromMnemonic = GetPrivateKeyFromMnemonic;
/**
 * converts a mnemonic into a seed.
 *
 * @param config the config
 * @param seed the seed
 * @param index the bip44 index
 * @return returns the seed, hex encoded, upper case.
 */
var GetPrivateKeyFromSeed = function (config, seed, index) {
    var bip32Factory = config.Bip32Factory;
    var curve = config.Curve;
    var seedBytes = (0, utils_1.hexToBuffer)(seed);
    var bip32 = bip32Factory(curve);
    var bip32node = bip32.fromSeed(seedBytes);
    var bip44path = (0, exports.GetBip44Path)(index);
    var bip32child = bip32node.derivePath(bip44path);
    return Buffer.from(bip32child.privateKey).toString('hex').toUpperCase();
};
exports.GetPrivateKeyFromSeed = GetPrivateKeyFromSeed;
/**
 * converts a mnemonic into a Poltergeist mnemonic, using the phantasma coin's bip44 path.
 *
 * @param config the config
 * @param mnemonic the mnemonic
 * @param index the index
 * @return returns the private key, hex encoded, upper case.
 */
var GetPoltergeistMnemonic = function (config, mnemonic, index) {
    var bip39 = config.Bip39;
    var privateKey = (0, exports.GetPrivateKeyFromMnemonic)(config, mnemonic, index);
    var poltergeistMnemonic = bip39.entropyToMnemonic(privateKey);
    return poltergeistMnemonic;
};
exports.GetPoltergeistMnemonic = GetPoltergeistMnemonic;
/**
 * @param index the index
 * @return returns the bip44 path.
 */
var GetBip44Path = function (index) {
    var bip44path = "m/44'/".concat(exports.SOUL_COIN, "'/0'/0/").concat(index);
    return bip44path;
};
exports.GetBip44Path = GetBip44Path;
