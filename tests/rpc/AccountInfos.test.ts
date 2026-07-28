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

// Two accounts with distinct non-zero values so an order or attribution mix-up cannot pass.
const wireResponse = [
  {
    address: 'P2Kaccount1',
    name: 'anonymous',
    stake: { amount: '0', time: 0, unclaimed: '0' },
  },
  {
    address: 'P2Kaccount2',
    name: 'myname',
    stake: { amount: '1500000000000', time: 1743520000, unclaimed: '42000000000' },
  },
];

describe('getAccountInfos', () => {
  // The batch contract is a NATIVE JSON array parameter (Solana getMultipleAccounts style), not
  // the comma-joined string the deprecated getAccounts wire used.
  it('sends the addresses as one native array parameter', async () => {
    const api = new CapturingAPI();
    api.nextResult = wireResponse;

    await api.getAccountInfos(['P2Kaccount1', 'P2Kaccount2']);

    expect(api.calls).toEqual([
      { method: 'getAccountInfos', params: [['P2Kaccount1', 'P2Kaccount2']] },
    ]);
  });

  // Per-element decode carries the same stake-vs-stakes wire nuance as getAccountInfo, and the
  // request order must survive the round-trip.
  it('maps the node wire shape onto AccountInfo[] in request order', async () => {
    const api = new CapturingAPI();
    api.nextResult = wireResponse;

    const infos: AccountInfo[] = await api.getAccountInfos(['P2Kaccount1', 'P2Kaccount2']);

    expect(infos).toHaveLength(2);
    expect(infos[0].address).toBe('P2Kaccount1');
    expect(infos[0].name).toBe('anonymous');
    expect(infos[0].stake.amount).toBe('0');
    expect(infos[1].address).toBe('P2Kaccount2');
    expect(infos[1].name).toBe('myname');
    expect(infos[1].stake.amount).toBe('1500000000000');
    expect(infos[1].stake.unclaimed).toBe('42000000000');
  });
});
