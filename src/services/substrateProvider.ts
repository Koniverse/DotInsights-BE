// eslint-disable-next-line max-classes-per-file
import { ApiPromise, WsProvider } from '@polkadot/api';

const POLKADOT_ENDPOINTS = process.env.POLKADOT_ENDPOINTS || null;

class ApiSubstrate {
  endPoint: string;

  api: ApiPromise;

  isConnected: boolean = false;

  constructor(endPoint: string) {
    this.endPoint = endPoint;
    const apiPromise = new ApiPromise({ provider: new WsProvider(endPoint) });
    apiPromise.isReady.then(data => {
      this.isConnected = true;
      this.api = data;
      this.api.on('connected', (): void => {
        this.isConnected = true;
        // eslint-disable-next-line no-console
        console.log('API has been connected to the endpoint');
      });
      this.api.on('disconnected', (): void => {
        // eslint-disable-next-line no-console
        console.log('API has been disconnected to the endpoint');
        this.isConnected = false;
      });
    });
  }
}

export class AzeroProvider {
  listAPi: ApiSubstrate[] = [];

  constructor() {
    const api = new ApiSubstrate('wss://ws.azero.dev');
    this.listAPi.push(api);
  }

  getApiConnected() {
    for (let i = 0; i < this.listAPi.length; i += 1) {
      const api = this.listAPi[i];
      if (api.isConnected) {
        return api.api;
      }
    }
    return null;
  };
}

export class SubstrateProvider {
  listAPi: ApiSubstrate[] = [];

  constructor() {
    if (POLKADOT_ENDPOINTS) {
      POLKADOT_ENDPOINTS.split(',').forEach(endPoint => {
        const api = new ApiSubstrate(endPoint);
        this.listAPi.push(api);
      });
    }
  }

  getApiConnected() {
    for (let i = 0; i < this.listAPi.length; i += 1) {
      const api = this.listAPi[i];
      if (api.isConnected) {
        return api.api;
      }
    }
    return null;
  };
}
