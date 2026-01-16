import { Int2Buffer, hex2ascii } from '../utils/index.js';
import { ApplicationNameResponse } from './interfaces/ApplicationNameResponse.js';
import { DeviceResponse } from './interfaces/DeviceResponse.js';
import { PublicKeyResponse } from './interfaces/PublicKeyResponse.js';
import { SignResponse } from './interfaces/SignResponse.js';
import { VersionResponse } from './interfaces/VersionResponse.js';
import { logger } from '../utils/logger.js';

export const MAX_SIGNED_TX_LEN = 1024;

const Debug = true;

export const Bip44Path =
  '8000002C' + // 44
  '8000003C' + // 60
  '80000000' + // 0
  '00000000' + // 0
  '00000000'; // 0

export const ErrorDescriptions = {
  '530C': 'Unlock Ledger Device',
  '6D02': 'App Not Open On Ledger Device',
  6511: 'App Not Open On Ledger Device',
  '6E00': 'App Not Open On Ledger Device',
  '6A86': 'Incorrect Pip2',
  '6A87': 'Wrong Data Length',
  '6A88': 'No Data Length',
  '6A89': 'Wrong Main Data Length',
  '6A90': 'Incorrect Pip1',
  6985: 'Tx Denied on Ledger',
  '6D06': 'Tx Decoding Buffer Underflow',
  B000: 'Wrong response length on Ledger Device',
  B002: 'Failed to display Address on Ledger Device',
  B005: 'Failed to parse Transaction on Ledger Device',
  B008: 'Failed to sign Transaction on Ledger Device',
  B009: 'Wrong signing parmeters on Ledger Device',
};

/**
 * Get's the error message.
 * @param responseStr
 * @returns
 */
export const GetErrorMessage = (responseStr: string): string => {
  const suffix = responseStr.slice(-4);
  if (ErrorDescriptions[suffix] !== undefined) {
    const description = ErrorDescriptions[suffix];
    return `[${suffix}] ${responseStr} ${description}`;
  } else {
    return `[${suffix}] ${responseStr} Unknown Error`;
  }
};

/**
 * Get Device
 * @param transport
 * @returns
 */
export const GetDevice = async (transport): Promise<DeviceResponse> => {
  /* istanbul ignore if */
  if (Debug) {
    logger.log('getDevice', 'transport', transport);
  }
  const supported = await transport.isSupported();
  /* istanbul ignore if */
  if (Debug) {
    logger.log('getDevice', 'supported', supported);
  }

  if (!supported) {
    return {
      enabled: false,
      error: true,
      message: 'Your computer does not support the ledger device.',
    };
  }

  const list = await transport.list();
  /* istanbul ignore if */
  if (Debug) {
    logger.log('getDevice', 'list', list);
  }

  if (list.length == 0) {
    return {
      enabled: false,
      error: true,
      message: 'No device connected.',
    };
  }

  const path = list[0];
  /* istanbul ignore if */
  if (Debug) {
    logger.log('getDevice', 'path', path);
  }
  const device = await transport.open(path);

  /* istanbul ignore if */
  if (Debug) {
    logger.log('getDevice', 'device', device);
  }
  return {
    enabled: true,
    error: false,
    device: device,
  };
};

/**
 * Get Application Name
 * @param transport
 * @returns
 */
export const GetApplicationName = async (transport): Promise<ApplicationNameResponse> => {
  const device = await GetDevice(transport);
  if (!device.enabled) {
    return {
      success: false,
      message: 'Your computer does not support the ledger device.',
    };
  }

  try {
    const request = Buffer.from('E004000000', 'hex');
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'request', request.toString('hex').toUpperCase());
    }
    const response = await device.device.exchange(request);
    const responseStr = response.toString('hex').toUpperCase();
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'response', responseStr);
    }
    let success = false;
    let message = '';
    let applicationName = '';
    if (responseStr.endsWith('9000')) {
      success = true;
      message = responseStr;
      applicationName = responseStr.substring(0, responseStr.length - 4);
      applicationName = hex2ascii(applicationName);
    } else {
      message = GetErrorMessage(responseStr);
    }
    return {
      success: success,
      message: message,
      applicationName: applicationName,
    };
  } catch (error) {
    /* istanbul ignore if */
    if (Debug) {
      logger.trace('getApplicationName', 'error', error);
    }
    return {
      success: false,
      message: error.message,
    };
  } finally {
    await device.device.close();
  }

  if (device.error) {
    return {
      success: false,
      message: device.message!,
    };
  }
};

/**
 * Get Version
 * @param transport
 * @returns
 */
export const GetVersion = async (transport): Promise<VersionResponse> => {
  const device = await GetDevice(transport);
  if (!device.enabled) {
    return {
      success: false,
      message: 'Your computer does not support the ledger device.',
    };
  }

  try {
    const request = Buffer.from('E003000000', 'hex');
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'request', request.toString('hex').toUpperCase());
    }
    const response = await device.device.exchange(request);
    const responseStr = response.toString('hex').toUpperCase();
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'response', responseStr);
    }
    let success = false;
    let message = '';
    let version = '';
    if (responseStr.endsWith('9000')) {
      success = true;
      message = responseStr;
      version = responseStr.substring(0, responseStr.length - 4);
      version = hex2ascii(version);
    } else {
      message = GetErrorMessage(responseStr);
    }
    return {
      success: success,
      message: message,
      version: version,
    };
  } catch (error) {
    /* istanbul ignore if */
    if (Debug) {
      logger.trace('getVersion', 'error', error);
    }
    return {
      success: false,
      message: error.message,
    };
  } finally {
    await device.device.close();
  }

  if (device.error) {
    return {
      success: false,
      message: device.message!,
    };
  }
};

/**
 * Get Pip44 Path Message
 * @param messagePrefix
 * @returns
 */
export const GetBip44PathMessage = (messagePrefix: any): Buffer => {
  /* istanbul ignore if */
  if (messagePrefix == undefined) {
    throw Error('messagePrefix is a required parameter.');
  }
  if (messagePrefix.length !== 4) {
    throw Error('messagePrefix must be of length 4.');
  }

  const bip44PathBuffer = Buffer.from(Bip44Path, 'hex');
  const bip44PathBufferLen = 5; // bip44PathBuffer.length;
  const bip44PathBufferLenBuffer = Int2Buffer(bip44PathBufferLen);
  const payload = Buffer.concat([bip44PathBufferLenBuffer, bip44PathBuffer]);
  const payloadLen = Int2Buffer(payload.length);

  if (Debug) {
    logger.log(
      'getBip44PathMessage',
      'bip44PathBuffer',
      bip44PathBuffer.toString('hex').toUpperCase()
    );
    logger.log('getBip44PathMessage', 'bip44PathBufferLen', bip44PathBufferLen);
    logger.log(
      'getBip44PathMessage',
      'bip44PathBufferLenBuffer',
      bip44PathBufferLenBuffer.toString('hex').toUpperCase()
    );
    logger.log('getBip44PathMessage', 'payload', payload.toString('hex').toUpperCase());
    logger.log('getBip44PathMessage', 'payloadLen', payloadLen.toString('hex').toUpperCase());
  }

  const message = Buffer.concat([messagePrefix, payloadLen, payload]);
  return message;
};

/**
 * Get Public Key
 * @param transport
 * @param options
 * @returns
 */
export const GetPublicKey = async (transport, options): Promise<PublicKeyResponse> => {
  /* istanbul ignore if */
  if (transport == undefined) {
    throw Error('transport is a required parameter.');
  }
  /* istanbul ignore if */
  if (options == undefined) {
    throw Error('options is a required parameter.');
  }
  const device = await GetDevice(transport);
  if (!device.enabled) {
    return {
      success: false,
      message: 'Your computer does not support the ledger device.',
    };
  }

  try {
    let messagePrefix;
    if (options.verifyOnDevice) {
      messagePrefix = Buffer.from('E0050100', 'hex');
    } else {
      messagePrefix = Buffer.from('E0050000', 'hex');
    }

    const request = GetBip44PathMessage(messagePrefix);
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'request', request.toString('hex').toUpperCase());
    }
    const response = await device.device.exchange(request);
    const responseStr = response.toString('hex').toUpperCase();
    /* istanbul ignore if */
    if (Debug) {
      logger.log('exchange', 'response', responseStr);
    }
    let success = false;
    let message = '';
    let publicKey = '';
    if (responseStr.endsWith('9000')) {
      success = true;
      message = responseStr;
      publicKey = responseStr.substring(0, 64);
    } else {
      message = GetErrorMessage(responseStr);
    }
    return {
      success: success,
      message: message,
      publicKey: publicKey,
    };
  } catch (error) {
    /* istanbul ignore if */
    if (Debug) {
      logger.trace('getPublicKey', 'error', error);
    }
    return {
      success: false,
      message: error.message,
    };
  } finally {
    await device.device.close();
  }

  if (device.error) {
    return {
      success: false,
      message: device.message!,
    };
  }

  return {
    success: false,
    message: 'Unknown Error',
  };
};

/**
 * Chunk String
 * @param str
 * @param length
 * @returns
 */
export const ChunkString = (str, length) => {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
};

export const SplitMessageIntoChunks = (ledgerMessage) => {
  const messages: any = [];

  messages.push(GetBip44PathMessage(Buffer.from('E006' + '00' + '80', 'hex')));

  if (Debug) {
    logger.log('splitMessageIntoChunks', 'ledgerMessage.length', ledgerMessage.length);
  }

  // MAX 250, as theres 5 header bytes, and max total buffer size is 255.
  const bufferSize = 250 * 2;

  // ledgerMessage = ledgerMessage.substring(0,bufferSize);

  const chunks = ChunkString(ledgerMessage, bufferSize);

  for (let chunkIx = 0; chunkIx < chunks.length; chunkIx++) {
    const chunk = chunks[chunkIx];
    const chunkNbr = chunkIx + 1;
    if (Debug) {
      logger.log('splitMessageIntoChunks', 'chunk.length', chunk.length);
    }
    const p1 = chunkNbr.toString(16).padStart(2, '0');
    if (Debug) {
      logger.log('splitMessageIntoChunks', 'p1', p1);
    }

    let p2;
    if (chunkNbr == chunks.length) {
      // LAST
      p2 = '00';
    } else {
      // MORE
      p2 = '80';
    }
    if (Debug) {
      logger.log('splitMessageIntoChunks', 'p2', p2);
    }

    const chunkLength = chunk.length / 2;

    const chunkLengthHex = chunkLength.toString(16).padStart(2, '0');

    if (Debug) {
      logger.log('splitMessageIntoChunks', 'chunkLengthHex', chunkLengthHex);
    }

    const messageHex = 'E006' + p1 + p2 + chunkLengthHex + chunk;

    if (Debug) {
      logger.log('splitMessageIntoChunks', 'messageHex', messageHex);
    }
    const message = Buffer.from(messageHex, 'hex');
    if (Debug) {
      logger.log('splitMessageIntoChunks', 'message', message);
    }
    messages.push(message);
  }

  return messages;
};

export const DecodeSignature = (response) => {
  /* istanbul ignore if */
  if (Debug) {
    logger.log('decodeSignature', 'response', response);
  }
  const signature = response.substring(0, 128);
  /* istanbul ignore if */
  if (Debug) {
    logger.log('decodeSignature', 'signature', signature);
  }
  return signature;
};

export const SignLedger = async (transport, transactionHex): Promise<SignResponse> => {
  /* istanbul ignore if */
  if (Debug) {
    logger.log('sign', 'transactionHex', transactionHex);
  }
  // transactionHex = '0200000000000000';
  const transactionByteLength = Math.ceil(transactionHex.length / 2);
  if (transactionByteLength > MAX_SIGNED_TX_LEN) {
    return {
      success: false,
      message: `Transaction length of ${transactionByteLength} bytes exceeds max length of ${MAX_SIGNED_TX_LEN} bytes. Send less candidates and consolidate utxos.`,
    };
  }

  const ledgerMessage = transactionHex;

  const messages = SplitMessageIntoChunks(ledgerMessage);
  if (Debug) {
    logger.log('sign', 'transport', transport);
  }

  const device = await GetDevice(transport);

  if (Debug) {
    logger.log('sign', 'device', device);
    logger.log('sign', 'messages.length', messages.length);
  }
  if (!device.enabled) {
    return {
      success: false,
      message: 'Your computer does not support the ledger device.',
    };
  }

  try {
    let lastResponse: string | undefined = undefined;
    // console.log('deviceThenCallback', 'messages', messages);
    for (let ix = 0; ix < messages.length; ix++) {
      const message = messages[ix];
      /* istanbul ignore if */
      if (Debug) {
        logger.log(
          'exchange',
          ix,
          'of',
          messages.length,
          'message',
          message.toString('hex').toUpperCase()
        );
      }

      const response = await device.device.exchange(message);
      const responseStr = response.toString('hex').toUpperCase();
      if (Debug) {
        logger.log('exchange', ix, 'of', messages.length, 'response', responseStr);
      }
      if (responseStr !== undefined) {
        if (!responseStr.endsWith('9000')) {
          const message = GetErrorMessage(responseStr);
          return {
            success: false,
            message: message,
            signature: '',
          };
        }
      }

      lastResponse = responseStr;
    }

    let signature = undefined;
    let success = false;
    let message = lastResponse;
    if (lastResponse !== undefined) {
      if (lastResponse.endsWith('9000')) {
        signature = DecodeSignature(lastResponse);
        success = true;
      } else {
        message = GetErrorMessage(lastResponse);
      }
    }

    return {
      success: success,
      message: message!,
      signature: signature,
    };
  } catch (error) {
    /* istanbul ignore if */
    if (Debug) {
      logger.trace('sign', 'error', error);
    }
    return {
      success: false,
      message: error.message,
    };
  } finally {
    await device.device.close();
  }

  if (device.error) {
    return {
      success: false,
      message: device.message!,
    };
  }
};
