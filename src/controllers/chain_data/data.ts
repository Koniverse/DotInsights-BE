import { RequestHandler } from 'express';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Error } from 'mongoose';
import moment from 'moment';

import { relogRequestHandler } from '../../middleware/request-middleware';
import { httpGetRequest } from '../../libs/http-request';

const chainCache = require('memory-cache');
const https = require('https');

const urlTransfersV1 = (chain: string) => `https://${chain}.api.subscan.io/api/scan/transfers`;
const urlPolkadot = (chain: string) => `https://api.coingecko.com/api/v3/coins/${chain}`;
const urlBlock = (chain: string) => `https://${chain}.api.subscan.io/api/scan/block`;
const urlExtrinsics = (chain: string) => `https://${chain}.api.subscan.io/api/scan/extrinsics`;
const urlAccountDaily = (chain: string) => `https://${chain}.api.subscan.io/api/scan/daily`;
const urlScanData = (chain: string) => `https://${chain}.api.subscan.io/api/scan/metadata`;

const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY || '';
const LIMIT_UPDATE_DATA_CHAIN = process.env.LIMIT_UPDATE_DATA_CHAIN || 10;

function querySubscanData(url: string, body: string) {
  let urlObject;

  try {
    urlObject = new URL(url);
  } catch (error) {
    throw new Error(`Invalid url ${url}`);
  }
  const options = {
    method: 'POST',
    hostname: urlObject.hostname,
    port: urlObject.port,
    path: urlObject.pathname,
    dataType: 'json',
    headers: {
      'X-API-Key': SUBSCAN_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const clientRequest = https.request(options, (incomingMessage: IncomingMessage) => {
      // Response object.
      const response: { headers: IncomingHttpHeaders; body: string[]; statusCode: number } = {
        statusCode: incomingMessage.statusCode,
        headers: incomingMessage.headers,
        body: []
      };

      incomingMessage.on('data', (chunk: any) => {
        // console.log(chunk);
        response.body.push(chunk);
      });
      // Resolve on end.
      incomingMessage.on('end', () => {
        if (response.body.length) {
          try {
            // @ts-ignore
            response.body = JSON.parse(Buffer.concat(response.body));
          } catch (error) {
            // Silently fail if response is not JSON.
          }
        }
        resolve(response);
      });
    });

    // Reject on request error.
    clientRequest.on('error', (error: Error) => {
      reject(error);
    });

    // Write request body if present.
    if (body) {
      clientRequest.write(body);
    }

    // Close HTTP connection.
    clientRequest.end();
  });
}

const getTransferChange = async (chain: string) => {
  const yesterday = moment().utc().subtract(1, 'd');
  const timeStamp = yesterday.unix();
  const dataSend = JSON.stringify({
    block_timestamp: timeStamp,
    only_head: true
  });
  const getDataBlock = await querySubscanData(urlBlock(chain), dataSend);
  // @ts-ignore
  const bodyData = getDataBlock.body;
  let blockNumYesterday = 0;
  if (bodyData.data) {
    blockNumYesterday = bodyData.data.block_num;
  }
  return new Promise((resolve, reject) => {
    const transferDataSend = JSON.stringify({
      row: 1,
      page: 1,
      from_block: blockNumYesterday
    });
    querySubscanData(urlTransfersV1(chain), transferDataSend).then((response: any) => {
      const countBlockChange = response.body?.data?.count || 0;
      resolve({ countBlockChange, blockNumYesterday });
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

const getExtrinsicsChange = async (chain: string, blockRange: string) => {
  const postData = JSON.stringify({
    row: 1,
    page: 1,
    signed: 'yes',
    block_range: blockRange
  });

  return new Promise((resolve, reject) => {
    querySubscanData(urlExtrinsics(chain), postData).then((response: any) => {
      let count = 0;
      if (response.body?.data) {
        count = response.body.data.count;
      }
      resolve(count);
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

const getDataMeta: (chain: string) => Promise<{
  countSignedExtrinsic: number,
  finalizedBlockNum: number,
  accounts: number,
  blockNum: number,
  transfers: number
}> = async (chain: string) => {
  const postData = JSON.stringify({
    row: 1,
    page: 1
  });

  return new Promise((resolve, reject) => {
    querySubscanData(urlScanData(chain), postData).then((response: any) => {
      const { data } = response.body;
      resolve(
        {
          finalizedBlockNum: data?.finalized_blockNum || 0,
          countSignedExtrinsic: data?.count_signed_extrinsic || 0,
          accounts: data?.count_account || 0,
          transfers: data?.count_transfer || 0,
          blockNum: data?.blockNum || 0
        }
      );
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

const getDataPolkadot: (chain: string) => Promise<{
  currentPrice: number,
  volume24h: number,
  marketCap: number,
  marketCapRank: number
}> = async (chain: string) => {
  const dataSendPolkadot = JSON.stringify({
    tickers: false,
    market_data: true,
    community_data: false,
    developer_data: false,
    sparkline: false
  });

  return new Promise((resolve, reject) => {
    httpGetRequest(urlPolkadot(chain), dataSendPolkadot).then((response: any) => {
      if (response) {
        const marketData = response.market_data;
        const currentPrice = marketData?.current_price?.usd || 0;
        const volume24h = marketData?.market_cap_change_percentage_24h || 0;
        const marketCapRank = marketData?.market_cap_rank || 0;
        const marketCap = marketData?.market_cap?.usd || 0;
        resolve({
          currentPrice,
          volume24h,
          marketCap,
          marketCapRank
        });
      }
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

const getDataAccountDaily = async (chain: string, category = 'NewAccount') => {
  const now = moment().utc();
  const yesterday = moment().utc().subtract(1, 'd');
  const stringTimeNow = now.format('YYYY-MM-DD');
  const stringTimeYesterday = yesterday.format('YYYY-MM-DD');
  const postDataDaily = JSON.stringify({
    start: stringTimeYesterday,
    end: stringTimeNow,
    format: 'hour',
    category
  });

  return new Promise((resolve, reject) => {
    querySubscanData(urlAccountDaily(chain), postDataDaily).then((response: any) => {
      let accountsChange24h = 0;
      if (response.body) {
        const { body } = response;
        if (body.data && body?.data?.list.length > 0) {
          body?.data?.list.forEach((item: any) => {
            if (item && item.time_utc) {
              const timeUtc = moment(item.time_utc).utc();
              if (timeUtc.isBefore(now) && yesterday.isBefore(timeUtc)) {
                accountsChange24h += item.total;
              }
            }
          });
        }
      }
      resolve(accountsChange24h);
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

// @ts-ignore
async function retryPromise(promise: any, nthTry: number) {
  try {
    // try to resolve the promise
    const data = await promise;
    // if resolved simply return the result back to the caller
    return data;
  } catch (e) {
    // if the promise fails and we are down to 1 try we reject
    if (nthTry === 1) {
      return Promise.reject(e);
    }
    // eslint-disable-next-line no-console
    console.log('retrying', nthTry, 'time');
    return retryPromise(promise, nthTry - 1);
  }
}

const getNameCacheWithChain = (chain: string) => `KEY_CACHE_WITH_${chain}`;

const getDataInCache = (chain:string) => {
  const keyName = getNameCacheWithChain(chain);
  if (chainCache.get(keyName)) return JSON.parse(chainCache.get(keyName));
  return null;
};

const updateDataToCache = async (data: any, chain: string) => {
  const timeOutCache = Number(LIMIT_UPDATE_DATA_CHAIN) * 60 * 1000;
  const keyName = getNameCacheWithChain(chain);
  const dataSave = JSON.stringify(data);
  const cacheData = getDataInCache(chain);
  if (!cacheData) {
    chainCache.put(keyName, dataSave, timeOutCache);
  }
};

const getData: RequestHandler = async (req, res) => {
  const {
    chain
  } = req.params;
  const requestMetaSubscan = retryPromise(getDataMeta(chain), 3);
  const requestAccountDaily = retryPromise(getDataAccountDaily(chain), 3);
  const requestExtrinsicsDaily = retryPromise(getDataAccountDaily(chain, 'extrinsic'), 3);
  const requestTransferChange = retryPromise(getTransferChange(chain), 3);
  try {
    const [metaSubScan, accountDaily, transferChange, extrinsicsChange] = await Promise.all([requestMetaSubscan, requestAccountDaily, requestTransferChange, requestExtrinsicsDaily]);
    const {
      finalizedBlockNum, countSignedExtrinsic, accounts, transfers, blockNum
    } = metaSubScan;
    const { countBlockChange, blockNumYesterday } = transferChange;
    // const extrinsicsChange = await retryPromise(getExtrinsicsChange(chain, `${blockNumYesterday}-${blockNum}`), 3);
    const dataSend = {
      accounts,
      accounts_change_24h: accountDaily,
      block_change_24h: blockNum - blockNumYesterday,
      transfers,
      transfers_change_24h: countBlockChange,
      finalizedBlockNum,
      countSignedExtrinsic,
      extrinsicsChange
    };
    updateDataToCache(dataSend, chain);
    res.send(dataSend);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error promise all data');
    // eslint-disable-next-line no-console
    console.error(error);
    const dataSendToClient = getDataInCache(chain);
    // eslint-disable-next-line no-console
    console.log(dataSendToClient);
    res.send(dataSendToClient);
  }
};

export const data = relogRequestHandler(getData, { skipJwtAuth: true });
