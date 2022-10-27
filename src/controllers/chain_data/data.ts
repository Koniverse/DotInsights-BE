import { RequestHandler } from 'express';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Error } from 'mongoose';
import moment from 'moment';
import { relogRequestHandler } from '../../middleware/request-middleware';

const https = require('https');

const urlAccounts = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/accounts`;
const urlTransfers = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/transfers`;
const urlTransfersV1 = (chain: string) => `https://${chain}.api.subscan.io/api/scan/transfers`;
const urlPolkadot = (chain: string) => `https://api.coingecko.com/api/v3/coins/${chain}`;
const urlBlock = (chain: string) => `https://${chain}.api.subscan.io/api/scan/block`;
const urlAccountDaily = (chain: string) => `https://${chain}.api.subscan.io/api/scan/daily`;

const { SUBSCAN_API_KEY } = process.env;

function httpGetRequest(url: string, body: string) {
  return new Promise((resolve, reject) => {
    const clientRequest = https.get(url, {}, (incomingMessage: IncomingMessage) => {
      // Buffer the body entirely for processing as a whole.
      const bodyChunks: any[] | readonly Uint8Array[] = [];
      incomingMessage.on('data', (chunk: any) => {
        // @ts-ignore
        bodyChunks.push(chunk);
      }).on('end', () => {
        const response = Buffer.concat(bodyChunks);
        // @ts-ignore
        resolve(JSON.parse(response));
      });
    });
    clientRequest.on('error', (error: Error) => {
      reject(error);
    });
    clientRequest.end();
  });
}

function httpPostRequest(url: string, body: string) {
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
            response.body = JSON.parse(response.body.join());
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

const getTransferChange = async (timeStamp: number, chain: string) => {
  const dataSend = JSON.stringify({
    block_timestamp: timeStamp,
    only_head: true
  });
  const getDataBlock = await httpPostRequest(urlBlock(chain), dataSend);
  // @ts-ignore
  const bodyData = getDataBlock.body;
  let blockNum = 0;
  if (bodyData.data) {
    blockNum = bodyData.data.block_num;
  }
  return new Promise((resolve, reject) => {
    const transferDataSend = JSON.stringify({
      row: 1,
      page: 1,
      from_block: blockNum
    });
    httpPostRequest(urlTransfersV1(chain), transferDataSend).then((data: any) => {
      resolve(data);
    }).catch((e: Error) => {
      reject(e);
    });
  });
};

const getData: RequestHandler = async (req, res) => {
  const {
    chain
  } = req.params;
  //
  const now = moment().utc();
  const yesterday = moment().utc().subtract(1, 'd');
  const stringTimeNow = now.format('YYYY-MM-DD');
  const timeStampYesterday = yesterday.unix();
  const stringTimeYesterday = yesterday.format('YYYY-MM-DD');
  const postDataDaily = JSON.stringify({
    start: stringTimeYesterday,
    end: stringTimeNow,
    format: 'hour',
    category: 'NewAccount'
  });
  // @ts-ignore
  const postData = JSON.stringify({
    row: 1,
    page: 1
  });
  const dataSendPolkadot = JSON.stringify({
    tickers: false,
    market_data: true,
    community_data: false,
    developer_data: false,
    sparkline: false
  });
  const requestAccounts = httpPostRequest(urlAccounts(chain), postData);
  const requestTransfers = httpPostRequest(urlTransfers(chain), postData);
  const requestPolkadot = httpGetRequest(urlPolkadot(chain), dataSendPolkadot);
  const requestAccountDaily = httpPostRequest(urlAccountDaily(chain), postDataDaily);
  const requestTransferChange = getTransferChange(timeStampYesterday, chain);
  const [dataAccounts, dataTransfers, dataPolkadot, dataAccountDaily, dataTransferChange] = await Promise.all([requestAccounts, requestTransfers, requestPolkadot, requestAccountDaily, requestTransferChange]);
  // console.log(data);
  // @ts-ignore
  const bodyAccountDaily = dataAccountDaily.body;
  let accountsChange24h = 0;
  if (bodyAccountDaily.data && bodyAccountDaily?.data?.list.length > 0) {
    bodyAccountDaily?.data?.list.forEach((item: any) => {
      if (item && item.time_utc) {
        const timeUtc = moment(item.time_utc).utc();
        if (timeUtc.isBefore(now) && yesterday.isBefore(timeUtc)) {
          accountsChange24h += item.total;
        }
      }
    });
  }
  // @ts-ignore
  const bodyTransferChange = dataTransferChange.body;
  // @ts-ignore
  const bodyTransfers = dataTransfers.body;
  // @ts-ignore
  const bodyAccounts = dataAccounts.body;
  // @ts-ignore
  const marketData = dataPolkadot.market_data;
  const currentPrice = marketData.current_price.usd;
  const volume24h = marketData.market_cap_change_percentage_24h;
  const marketCapRank = marketData.market_cap_rank;
  const marketCap = marketData.market_cap.usd;

  // @ts-ignore
  res.send({
    accounts: bodyAccounts.data.count,
    accounts_change_24h: accountsChange24h,
    transfers: bodyTransfers.data.count,
    transfers_change_24h: bodyTransferChange.data.count,
    current_price: currentPrice,
    volume24h,
    market_cap: marketCap,
    market_cap_rank: marketCapRank
  });
};

export const data = relogRequestHandler(getData, { skipJwtAuth: true });
