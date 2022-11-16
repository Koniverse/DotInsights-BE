import { RequestHandler } from 'express';
import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { User } from '../../models/User';
import { RANDOM_SALT } from './index';
import { httpGetRequest } from '../../libs/http-request';

const urlBalances = (address: string, network: string) => `https://sub.id/api/v1/${address}/balances/${network}`;

const { CHECK_MULTICHAIN_BALANCE_NETWORK } = process.env;
export const getRandomInt = (minNum: number, maxNum: number) => {
  const min = Math.ceil(minNum);
  const max = Math.floor(maxNum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getBalancesNetworks = async (address: string) => {
  const pros: any[] = [];
  const balances = {};
  if (CHECK_MULTICHAIN_BALANCE_NETWORK) {
    const networks = CHECK_MULTICHAIN_BALANCE_NETWORK.split(',');
    networks.forEach(network => {
      // console.log(network);/
      pros.push(httpGetRequest(urlBalances(address, network), network));
    });

    try {
      const data = await Promise.all(pros);
      // console.log(data);/
      data.forEach(key => {
        // eslint-disable-next-line no-restricted-syntax
        for (const [k, value] of Object.entries(key)) {
          const { freeBalance }: any = Object.entries(value)[0][1];
          // @ts-ignore
          balances[k] = freeBalance;
        }
        // console.log('===================');
        // console.log(balances);
      });
      return balances;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return false;
    }
  }
  return false;
};

const getMessage: RequestHandler = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findOne({ address });

    const balances = await getBalancesNetworks(address);
    const enoughBalance = JSON.stringify(balances);
    if (user === null) {
      const salt = getRandomInt(1, 999999999999);
      await User.create({
        address,
        salt,
        enoughBalance,
        votedProjects: []
      });
      res.status(200).json({ message: `${RANDOM_SALT} ${salt}` });
    } else {
      user.enoughBalance = enoughBalance;
      user.save();
      res.status(200).json({ message: `${RANDOM_SALT} ${user.salt}` });
    }
  } catch (error) {
    // console.error(error);
    // await send_telegram_message("get-message error: " +  error);
    res.status(500).json({ message: 'Internal Server Error ' });
  }
};
export const message = relogRequestHandler(getMessage, { skipJwtAuth: true });
