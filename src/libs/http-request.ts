import https from 'https';
import { IncomingMessage } from 'http';
import { Error } from 'mongoose';

export const httpGetRequest = (url: string, keyResponse: string = null,) => new Promise((resolve, reject) => {
  const clientRequest = https.get(url, {}, (incomingMessage: IncomingMessage) => {
    // Buffer the body entirely for processing as a whole.
    const bodyChunks: any[] | readonly Uint8Array[] = [];
    incomingMessage.on('data', (chunk: any) => {
      // @ts-ignore
      bodyChunks.push(chunk);
    }).on('end', () => {
      // console.log(incomingMessage);
      const response = Buffer.concat(bodyChunks);
      // console.log(response);

      if (incomingMessage.statusCode === 200) {
        // @ts-ignore
        const responseSend = JSON.parse(response);
        let dataSend = responseSend;
        if (keyResponse) {
          dataSend = {};
          dataSend[keyResponse] = responseSend;
        }
        resolve(dataSend);
      } else {
        resolve({});
      }
    });
  });
  clientRequest.on('error', (error: Error) => {
    reject(error);
  });
  clientRequest.end();
});
