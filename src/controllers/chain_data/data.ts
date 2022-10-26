import { RequestHandler } from 'express';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { Error } from 'mongoose';
import { relogRequestHandler } from '../../middleware/request-middleware';

const https = require('https');

const urlAccounts = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/accounts`;
const urlTransfers = (chain: string) => `https://${chain}.api.subscan.io/api/v2/scan/transfers`;
const urlPolkadot = (chain: string) => `https://api.coingecko.com/api/v3/coins/${chain}`;

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
  const dataAccounts = await httpPostRequest('post', urlAccounts(chain), postData);
  const dataTransfers = await httpPostRequest('post', urlTransfers(chain), postData);
  const dataPolkadot = await httpGetRequest(urlPolkadot(chain), dataSendPolkadot);
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
    accounts_change_24h: 9948,
    transfers: bodyTransfers.data.count,
    transfers_change_24h: 15448,
    current_price: currentPrice,
    volume24h,
    market_cap: marketCap,
    market_cap_rank: marketCapRank
  });
};

export const data = relogRequestHandler(getData, { skipJwtAuth: true });
