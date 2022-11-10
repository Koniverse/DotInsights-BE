// eslint-disable-next-line max-classes-per-file
import { ApiPromise, WsProvider } from '@polkadot/api';

const LIST_END_POINTS = process.env.LIST_END_POINTS || null;

class Api {
  endPoint: string;

  api: ApiPromise;

  isConnected: boolean = false;

  constructor(endPoint: string) {
    this.endPoint = endPoint;
    const apiPromise = new ApiPromise({ provider: new WsProvider(endPoint) });
    apiPromise.isReady.then(data => {
      console.log('co vao day ko ');
      this.isConnected = true;
      this.api = data;
      this.api.on('connected', (): void => {
        this.isConnected = true;
        console.log('API has been connected to the endpoint');
      });
      this.api.on('disconnected', (): void => {
        console.log('API has been disconnected to the endpoint');
        this.isConnected = false;
      });
    });
  }
}

export class Provider {
  listAPi: Api[] = [];

  constructor() {
    if (LIST_END_POINTS) {
      LIST_END_POINTS.split(',').forEach(endPoint => {
        const api = new Api(endPoint);
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
