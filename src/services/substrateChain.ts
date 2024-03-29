// eslint-disable-next-line max-classes-per-file
import { ApiPromise, WsProvider } from '@polkadot/api';

const POLKADOT_ENDPOINTS = process.env.POLKADOT_ENDPOINTS || null;
export const CHAIN_ENDPOINT_MAP = {
  aleptZero: ['wss://ws.azero.dev'],
  ternoa: ['wss://mainnet.ternoa.network'],
  // edgeware: ['wss://edgeware-rpc.dwellir.com'],
  polkadex: ['wss://mainnet.polkadex.trade']
};

class SubstrateApi {
  endPoint: string;

  api: ApiPromise;

  isConnected: boolean = false;

  constructor(endPoint: string) {
    this.endPoint = endPoint;
    try {
      const apiPromise = new ApiPromise({ provider: new WsProvider(endPoint) });
      apiPromise.isReady.then(data => {
        this.isConnected = true;
        this.api = data;
        this.api.on('connected', (): void => {
          this.isConnected = true;
          // eslint-disable-next-line no-console
          console.log('API has been connected to the endpoint');
        });
        this.api.on('ready', (): void => {
          this.isConnected = true;
          // eslint-disable-next-line no-console
          console.log('API has been ready to the endpoint');
        });
        this.api.on('disconnected', (): void => {
          // eslint-disable-next-line no-console
          console.log('API has been disconnected to the endpoint');
          this.isConnected = false;
        });
      });
    } catch (e) {
      this.isConnected = false;
    }
  }
}

export class SubstrateChain {
  substrateApis: SubstrateApi[];

  name: string;

  constructor(endPoints: string[], name: string) {
    this.substrateApis = endPoints.map(endPoint => new SubstrateApi(endPoint));
    this.name = name;
  }

  getConnectedApi(): SubstrateApi {
    return this.substrateApis?.find(sApi => sApi.api.isConnected);
  };
}
