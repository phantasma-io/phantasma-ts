import { hexToBytes } from './Hex';

export * from './Hex';

export function reverseHex(hex: string): string {
  let out = '';
  for (let i = hex.length - 2; i >= 0; i -= 2) {
    out += hex.substr(i, 2);
  }
  return out;
}

export function getDifficulty(transactionHash: string) {
  let bytes = hexToBytes(transactionHash).reverse();
  let result = 0;

  for (let i = 0; i < bytes.length; i++) {
    var n = bytes[i];
    for (let j = 0; j < 8; j++) {
      if ((bytes[i] & (1 << j)) != 0) {
        result = 1 + (i << 3) + j;
      }
    }
  }

  return 256 - result;
}

export function decodeBase16(hex: string) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function encodeBase16(str: string) {
  return str
    .split('')
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function uint8ArrayToString(array: Uint8Array): string {
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

export function uint8ArrayToStringDefault(array: Uint8Array): string {
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += array[i].toString(16);
  }
  return result;
}

export function uint8ArrayToNumberArray(array: Uint8Array): number[] {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
  }
  return result;
}

export function stringToUint8Array(str: string): Uint8Array {
  let result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i);
  }
  return result;
}

export function hexStringToUint8Array(str: string): Uint8Array {
  let result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i).toString(16).charCodeAt(0);
  }
  return result;
}

export function arrayNumberToUint8Array(arr: number[]): Uint8Array {
  let result = new Uint8Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[i];
  }
  return result;
}

export function uint8ArrayToBytes(array: Uint8Array): number[] {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
  }
  return result;
}

export function numberToByteArray(num: number, size?: number): Uint8Array {
  if (size === undefined) {
    if (num < 0xfd) {
      size = 1;
    } else if (num <= 0xfffd) {
      size = 2;
    } else if (num <= 0xffffd) {
      size = 3;
    } else if (num <= 0xfffffffd) {
      size = 4;
    } else if (num <= 0xffffffff) {
      size = 5;
    } else if (num <= 0xffffffffffffffff) {
      size = 9;
    }
  }
  var bytes = new Uint8Array(size);

  var i = 0;
  do {
    bytes[i++] = num & 0xff;
    num = num >> 8;
  } while (num);
  return bytes;
}

export function bigIntToByteArray(bigint: bigint): Uint8Array {
  // Get a big-endian byte representation of the bigint
  var bytes = bigint.toString(16).padStart(64, '0');
  var byteArray = new Uint8Array(bytes.length / 2);
  for (var i = 0; i < bytes.length; i += 2) {
    byteArray[i / 2] = parseInt(bytes.substring(i, i + 2), 16);
  }
  return byteArray;
}

export const hex2ascii = (hexx) => {
  const hex = hexx.toString();
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const char = hex.substr(i, 2);
    const charCode = String.fromCharCode(parseInt(char, 16));
    // console.log('char', char, 'charCode', charCode);
    str += charCode;
  }
  return str;
};

export const Int2Buffer = (i: number): Buffer => {
  let hex = i.toString(16).toUpperCase();
  if (hex.length % 2 === 1) {
    hex = '0' + hex;
  }
  return Buffer.from(hex, 'hex');
};
