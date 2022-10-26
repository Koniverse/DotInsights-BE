import { RequestHandler } from 'express';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Error } from 'mongoose';
import { relogRequestHandler } from '../../middleware/request-middleware';
import moment from 'moment';

const https = require('https');

const urlAccounts = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/accounts`;
const urlTransfers = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/transfers`;
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

function httpPostRequest(method: string, url: string, body: string) {
  if (!['get', 'post', 'head'].includes(method)) {
    throw new Error(`Invalid method: ${method}`);
  }

  let urlObject;

  try {
    urlObject = new URL(url);
  } catch (error) {
    throw new Error(`Invalid url ${url}`);
  }
  const options = {
    method: method.toUpperCase(),
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

const getData: RequestHandler = async (req, res) => {
  const {
    chain
  } = req.params;
  //
  const now = moment().utc();
  const yesterday = moment().utc().subtract(1,'d');
  const timeStampNow = now.unix();
  const stringTimeNow = now.format('YYYY-MM-DD');
  const timeStampYesterday = yesterday.unix();
  const stringTimeYesterday = yesterday.format('YYYY-MM-DD');
  console.log(now);
  console.log(now.format('YYYY-MM-DD'));
  console.log(stringTimeNow);
  console.log(stringTimeYesterday);
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
  const requestAccounts = httpPostRequest('post', urlAccounts(chain), postData);
  const requestTransfers = httpPostRequest('post', urlTransfers(chain), postData);
  const requestPolkadot = httpGetRequest(urlPolkadot(chain), dataSendPolkadot);
  const requestAccountDaily = httpPostRequest('post', urlAccountDaily(chain), postDataDaily);
  const [dataAccounts, dataTransfers, dataPolkadot, dataAccountDaily] = await Promise.all([requestAccounts, requestTransfers, requestPolkadot, requestAccountDaily]);
  // console.log(data);
  // @ts-ignore
  const bodyAccountDaily = dataAccountDaily.body;
  let accountsChange24h = 0;
  for(const item of bodyAccountDaily.data?.list) {
    const timeUtc = moment(item.time_utc).utc();
    if (timeUtc.isBefore(now)) {
      accountsChange24h += item.total;
    }
  }

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
    transfers_change_24h: 15448,
    current_price: currentPrice,
    volume24h,
    market_cap: marketCap,
    market_cap_rank: marketCapRank
  });
};

export const data = relogRequestHandler(getData, { skipJwtAuth: true });
