import { ApiPromise, WsProvider } from '@polkadot/api';

export class Provider {
  endPoint: string;

  api: Promise<ApiPromise>;

  constructor() {
    console.log('controller');
    const apiPromise = new ApiPromise({ provider: new WsProvider('wss://rpc.polkadot.io') });
    this.api = apiPromise.isReady;
  }
}
