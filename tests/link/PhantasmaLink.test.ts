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
});
