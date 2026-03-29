import { jest } from '@jest/globals';

import { PhantasmaLink } from '../../src/core/link/phantasmaLink';
import { TxMsg } from '../../src/core/types/Carbon/Blockchain/TxMsg';
import { TxMsgTransferFungible } from '../../src/core/types/Carbon/Blockchain/TxMsgTransferFungible';
import { Bytes32 } from '../../src/core/types/Carbon/Bytes32';
import { SmallString } from '../../src/core/types/Carbon/SmallString';
import { TxTypes } from '../../src/core/types/Carbon/TxTypes';
import { CarbonBlob } from '../../src/core/types/Carbon/CarbonBlob';
import { bytesToHex } from '../../src/core/utils/Hex';
import { ScriptBuilder } from '../../src/core/vm';
import { ProofOfWork } from '../../src/core/link/interfaces/ProofOfWork';
import { EasyConnect } from '../../src/core/link/easyConnect';
import { Transaction } from '../../src/core/tx/Transaction';
import { PhantasmaKeys } from '../../src/core/types/PhantasmaKeys';
import { Ed25519Signature } from '../../src/core/types/Ed25519Signature';

const buildBytes32 = (seed: number): Bytes32 => {
  const bytes = new Uint8Array(32);
  bytes.fill(seed);
  return new Bytes32(bytes);
};

const buildCarbonTransfer = (): TxMsg => {
  return new TxMsg(
    TxTypes.TransferFungible,
    123n,
    456n,
    789n,
    buildBytes32(1),
    SmallString.empty,
    new TxMsgTransferFungible(buildBytes32(2), 1n, 10n)
  );
};

describe('PhantasmaLink.signCarbonTxAndBroadcast', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('serializes TxMsg payloads and forwards them through the socket', () => {
    const link = new PhantasmaLink('test', false);
    link.version = 4;
    const txMsg = buildCarbonTransfer();
    const expectedHex = bytesToHex(CarbonBlob.Serialize(txMsg));

    const sendLinkSpy = jest
      .spyOn(link as any, 'sendLinkRequest')
      .mockImplementation((_request: string, callback: (result: any) => void) => {
        callback({ success: true, signedTx: 'deadbeef' });
      });

    const onSuccess = jest.fn();
    const onError = jest.fn();

    link.signCarbonTxAndBroadcast(txMsg, onSuccess, onError);

    expect(sendLinkSpy).toHaveBeenCalledTimes(1);
    expect(sendLinkSpy.mock.calls[0][0]).toBe(`signCarbonTxAndBroadcast/${expectedHex}`);
    expect(onSuccess).toHaveBeenCalledWith({ success: true, signedTx: 'deadbeef' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('rejects when wallet capability is below v4', () => {
    const link = new PhantasmaLink('test', false);
    link.version = 3;
    const txMsg = buildCarbonTransfer();
    const onError = jest.fn();

    link.signCarbonTxAndBroadcast(txMsg, jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('Carbon transactions require a wallet that supports Phantasma Link v4 or higher')
    );
  });
});

describe('PhantasmaLink.signTx', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('converts string payloads to script bytes before sending to the wallet', () => {
    const link = new PhantasmaLink('test', false);
    const sendLinkSpy = jest.spyOn(link as any, 'sendLinkRequest').mockImplementation(() => {});
    const payload = 'plain payload';
    const script = 'DEADBEEF';

    link.signTx(script, payload, jest.fn(), jest.fn());

    const sb = new ScriptBuilder();
    const bytes = sb.RawString(payload);
    sb.AppendBytes(bytes);
    const expectedPayload = sb.EndScript();

    expect(sendLinkSpy).toHaveBeenCalledWith(
      `signTx/${link.chain}/${script}/${expectedPayload}/Ed25519/${link.platform}/${ProofOfWork.None}`,
      expect.any(Function)
    );
  });
});

describe('PhantasmaLink.signTxSignature', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows serialized transactions larger than the old 1KB guard', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = { readyState: 1, send: jest.fn() };
    const sendLinkSpy = jest.spyOn(link as any, 'sendLinkRequest').mockImplementation(() => {});
    const tx = 'AB'.repeat(2000);

    link.signTxSignature(tx, jest.fn(), jest.fn());

    expect(sendLinkSpy).toHaveBeenCalledWith(
      `signTxSignature/${tx}/Ed25519/${link.platform}`,
      expect.any(Function)
    );
  });

  it('propagates wallet-side rejection details to the error callback', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = { readyState: 1, send: jest.fn() };
    jest.spyOn(link as any, 'sendLinkRequest').mockImplementation((_request: string, callback: (result: any) => void) => {
      callback({ success: false, message: 'signData: Expected nexus mainnet, instead got testnet' });
    });

    const onError = jest.fn();

    link.signTxSignature('ABCD', jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith('signData: Expected nexus mainnet, instead got testnet');
  });
});

describe('PhantasmaLink.signPrebuiltTransaction', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('assembles a signed transaction from a wallet signature response', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = { readyState: 1, send: jest.fn() };
    const keys = PhantasmaKeys.generate();
    link.account = { address: keys.Address.Text } as any;

    const tx = new Transaction(
      'testnet',
      'main',
      '0D0004',
      new Date('2026-03-29T01:00:00.000Z'),
      '706F77'
    );

    const signatureBytes = Ed25519Signature.Generate(keys, tx.GetUnsignedBytes()).Bytes;
    const walletSignatureHex = bytesToHex(new Uint8Array([signatureBytes.length, ...signatureBytes]));
    const expectedSignedTx = Transaction.FromBytes(tx.ToStringEncoded(false).toUpperCase());
    expectedSignedTx.signatures = [new Ed25519Signature(signatureBytes)];

    jest.spyOn(link as any, 'sendLinkRequest').mockImplementation((_request: string, callback: (result: any) => void) => {
      callback({ success: true, signature: walletSignatureHex });
    });

    const onSuccess = jest.fn();
    const onError = jest.fn();

    link.signPrebuiltTransaction(tx, onSuccess, onError);

    expect(onError).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({
      success: true,
      signature: walletSignatureHex,
      signedTx: expectedSignedTx.ToStringEncoded(true).toUpperCase(),
    });
  });

  it('propagates signTxSignature rejection details without collapsing them to a generic fallback', () => {
    const link = new PhantasmaLink('test', false);
    const tx = new Transaction(
      'testnet',
      'main',
      '0D0004',
      new Date('2026-03-29T01:00:00.000Z'),
      '706F77'
    );

    jest.spyOn(link, 'signTxSignature').mockImplementation((_tx, _ok, onError) => {
      onError('signData: Expected nexus mainnet, instead got testnet');
    });

    const onError = jest.fn();

    link.signPrebuiltTransaction(tx, jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith('signData: Expected nexus mainnet, instead got testnet');
  });
});

describe('EasyConnect.signCarbonTransaction', () => {
  beforeAll(() => {
    (globalThis as any).window = (globalThis as any).window || {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards signing to PhantasmaLink when connected', () => {
    const easy = new EasyConnect();
    easy.connected = true;
    easy.link.version = 4;
    const txMsg = buildCarbonTransfer();
    const spy = jest.spyOn(easy.link, 'signCarbonTxAndBroadcast').mockImplementation(() => {});
    const onSuccess = jest.fn();
    const onFail = jest.fn();

    easy.signCarbonTransaction(txMsg, onSuccess, onFail);

    expect(spy).toHaveBeenCalledWith(txMsg, onSuccess, onFail);
  });

  it('fails fast when no wallet session is available', () => {
    const easy = new EasyConnect();
    easy.connected = false;
    const onFail = jest.fn();

    easy.signCarbonTransaction(buildCarbonTransfer(), jest.fn(), onFail);

    expect(onFail).toHaveBeenCalledWith('Wallet is not connected');
  });

  it('forwards prebuilt transaction signing to PhantasmaLink when connected', () => {
    const easy = new EasyConnect();
    easy.connected = true;
    const tx = new Transaction(
      'testnet',
      'main',
      '0D0004',
      new Date('2026-03-29T01:00:00.000Z'),
      '706F77'
    );
    const spy = jest.spyOn(easy.link, 'signPrebuiltTransaction').mockImplementation(() => {});
    const onSuccess = jest.fn();
    const onFail = jest.fn();

    easy.signPrebuiltTransaction(tx, onSuccess, onFail);

    expect(spy).toHaveBeenCalledWith(tx, onSuccess, onFail);
  });
});

describe('PhantasmaLink socket error handling', () => {
  it('propagates socket failures to the pending request callback', () => {
    const link = new PhantasmaLink('test', false);
    const callback = jest.fn();
    (link as any).requestCallback = callback;

    (link as any).handleSocketFailure('Connection lost');

    expect(callback).toHaveBeenCalledWith({ success: false, error: 'Connection lost' });
  });

  it('invokes onError when there is no pending request', () => {
    const link = new PhantasmaLink('test', false);
    const errorSpy = jest.fn();
    link.onError = errorSpy;

    (link as any).handleSocketFailure('');

    expect(errorSpy).toHaveBeenCalledWith('Connection lost with Phantasma Link wallet');
  });
});

describe('PhantasmaLink wallet error reporting', () => {
  const originalWindow = (globalThis as any).window;
  const originalWebSocket = (globalThis as any).WebSocket;

  afterEach(() => {
    jest.restoreAllMocks();
    (globalThis as any).window = originalWindow;
    (globalThis as any).WebSocket = originalWebSocket;
  });

  it('preserves wallet-side authorize errors instead of collapsing them', () => {
    const fakeSocket: Record<string, any> = {
      close: jest.fn(),
      readyState: 1,
    };

    (globalThis as any).window = {};
    (globalThis as any).WebSocket = jest.fn(() => fakeSocket);

    const link = new PhantasmaLink('test', false);
    const onError = jest.fn();
    jest.spyOn(link as any, 'sendLinkRequest').mockImplementation((_request: string, callback: (result: any) => void) => {
      callback({ success: false, message: 'A previous request is still pending' });
    });
    const disconnectSpy = jest.spyOn(link, 'disconnect').mockImplementation(() => {});

    link.login(jest.fn(), onError);
    fakeSocket.onopen({});

    expect(onError).toHaveBeenCalledWith('A previous request is still pending');
    expect(disconnectSpy).toHaveBeenCalledWith('Auth Failure');
  });

  it('surfaces pending-request wallet messages from socket events', () => {
    const fakeSocket: Record<string, any> = {
      close: jest.fn(),
      readyState: 1,
    };

    (globalThis as any).window = {};
    (globalThis as any).WebSocket = jest.fn(() => fakeSocket);

    const link = new PhantasmaLink('test', false);
    const onError = jest.fn();

    link.login(jest.fn(), onError);
    fakeSocket.onmessage({
      data: JSON.stringify({ message: 'A previous request is still pending', success: false }),
    });

    expect(onError).toHaveBeenCalledWith('A previous request is still pending');
  });

  it('starts with no nexus and syncs the wallet nexus from authorize responses', () => {
    const fakeSocket: Record<string, any> = {
      close: jest.fn(),
      readyState: 1,
    };

    (globalThis as any).window = {};
    (globalThis as any).WebSocket = jest.fn(() => fakeSocket);

    const link = new PhantasmaLink('test', false);
    const onLogin = jest.fn();

    expect(link.nexus).toBe('');

    jest
      .spyOn(link as any, 'sendLinkRequest')
      .mockImplementation((request: string, callback: (result: any) => void) => {
        if (request.startsWith('authorize/')) {
          callback({
            success: true,
            wallet: 'Poltergeist Lite',
            nexus: 'simnet',
            token: 'abc',
          });
          return;
        }

        if (request.startsWith('getAccount/')) {
          callback({
            success: true,
            address: 'P2K8J3j8g4P5mS5F5k67A8z9jz6Jb1qX2k3W4m5n6p7q8r9s',
          });
          return;
        }

        throw new Error(`Unexpected request: ${request}`);
      });

    link.login(onLogin, jest.fn());
    fakeSocket.onopen({});

    expect(link.nexus).toBe('simnet');
    expect(onLogin).toHaveBeenCalledWith(true);
  });
});

describe('PhantasmaLink.sendLinkRequest safeguards', () => {
  it('fails fast when socket is missing or closed', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = { readyState: 3, send: jest.fn() };
    const callback = jest.fn();

    (link as any).sendLinkRequest('signTx/foo', callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('Wallet connection is closed'),
    });
    expect((link as any).socket.send).not.toHaveBeenCalled();
  });

  it('propagates send errors as callback failures', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = {
      readyState: 1,
      send: jest.fn(() => {
        throw new Error('boom');
      }),
    };
    const callback = jest.fn();

    (link as any).sendLinkRequest('signTx/foo', callback);

    expect(callback).toHaveBeenCalledWith({ success: false, error: 'boom' });
  });

  it('accepts injected sockets that do not expose readyState once onopen fired', () => {
    const link = new PhantasmaLink('test', false);
    (link as any).socket = { send: jest.fn() };
    (link as any).socketOpen = true;

    (link as any).sendLinkRequest('signTx/foo', jest.fn());

    expect((link as any).socket.send).toHaveBeenCalledWith('1,signTx/foo');
  });
});
