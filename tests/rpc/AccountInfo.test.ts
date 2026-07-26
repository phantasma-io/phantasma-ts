import { PhantasmaAPI } from '../../src/rpc/phantasma';
import { AccountInfo } from '../../src/rpc/interfaces/account-info';

class CapturingAPI extends PhantasmaAPI {
  calls: Array<{ method: string; params: Array<unknown> }> = [];
  nextResult: unknown = null;

  constructor() {
    super('https://example.invalid/rpc', null, 'main');
  }

  async JSONRPC(method: string, params: Array<unknown>): Promise<unknown> {
    this.calls.push({ method, params });
    return this.nextResult;
  }
}

// Shape copied from a live node response, with non-zero values so a wrong field binding cannot pass
// by coincidence.
const wireResponse = {
  address: 'P2Kaccount',
  name: 'myname',
  stake: { amount: '1500000000000', time: 1743520000, unclaimed: '42000000000' },
};

describe('getAccountInfo', () => {
  it('sends only the account, so cost does not depend on account size', async () => {
    const api = new CapturingAPI();
    api.nextResult = wireResponse;

    await api.getAccountInfo('P2Kaccount');

    expect(api.calls).toEqual([{ method: 'getAccountInfo', params: ['P2Kaccount'] }]);
  });

  // The node names the staking object `stake` on this endpoint while `getAccount` carries the same
  // object under `stakes`; binding the wrong one would silently yield an undefined stake.
  it('maps the node wire shape onto AccountInfo', async () => {
    const api = new CapturingAPI();
    api.nextResult = wireResponse;

    const info: AccountInfo = await api.getAccountInfo('P2Kaccount');

    expect(info.address).toBe('P2Kaccount');
    expect(info.name).toBe('myname');
    expect(info.stake.amount).toBe('1500000000000');
    expect(info.stake.time).toBe(1743520000);
    expect(info.stake.unclaimed).toBe('42000000000');
  });

  it('does not return balance or NFT id lists', async () => {
    const api = new CapturingAPI();
    api.nextResult = wireResponse;

    const info = await api.getAccountInfo('P2Kaccount');

    expect(Object.keys(info).sort()).toEqual(['address', 'name', 'stake']);
  });
});
