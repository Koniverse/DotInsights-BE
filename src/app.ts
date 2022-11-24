import bodyParser from 'body-parser';
import compression from 'compression';
import path from 'path';
import express from 'express';
import { router } from './routes';
import { CHAIN_ENDPOINT_MAP, SubstrateChain } from './services/substrateChain';

export const app = express();

const cors = require('cors');

app.use(cors());

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

app.use('/api', router);
export const substrateApiMap = Object.entries(CHAIN_ENDPOINT_MAP).reduce((previousValue, [key, endPoints]) => {
  const values = { ...previousValue };
  values[key] = new SubstrateChain(endPoints, key);
  return values;
}, {} as Record<string, SubstrateChain>);
