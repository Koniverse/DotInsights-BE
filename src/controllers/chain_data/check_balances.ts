import { RequestHandler } from 'express';
import { BN } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { substrateProvider } from '../../app';

const requestCheckBalances: RequestHandler = async (req, res) => {
  const { address } = req.params;
  const api = substrateProvider.getApiConnected();
  const balance = await api.query.system.account(address);
  // @ts-ignore
  const { data } = balance.toHuman();
  const { free } = data;
  const totalBalance = new BN(free.replaceAll(',', '')).toString();
  res.send({
    another: {
      totalBalance
    }
  });
};

export const checkBalances = relogRequestHandler(requestCheckBalances, { skipJwtAuth: true });
