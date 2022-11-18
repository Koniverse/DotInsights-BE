import { RequestHandler } from 'express';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { BN } from '@polkadot/util';
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

export const isCheckBalances = (balanceData: any) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(balanceData)) {
    const currentBalance = new BN(String(value));
    if (currentBalance.gt(new BN(0))) {
      return true;
    }
  }
  return false;
};

export const getBalances = async (address: string) => {
  const pros: any[] = [];
  const balances = {};
  const NETWORK_ETHEREUM = ['moonbeam', 'moonriver', 'astar', 'shiden'];
  const isEthereum = isEthereumAddress(address);
  if (CHECK_MULTICHAIN_BALANCE_NETWORK) {
    const networks = CHECK_MULTICHAIN_BALANCE_NETWORK.split(',');
    networks.forEach(network => {
      if (NETWORK_ETHEREUM.includes(network) && isEthereum) {
        pros.push(httpGetRequest(urlBalances(address, network), network));
      } else if (!isEthereum && !['moonbeam', 'moonriver'].includes(network)) {
        pros.push(httpGetRequest(urlBalances(address, network), network));
      }
    });

    try {
      const data = await Promise.all(pros);
      data.forEach(key => {
        // eslint-disable-next-line no-restricted-syntax
        for (const [k, value] of Object.entries(key)) {
          const { totalBalance }: any = Object.entries(value)[0][1];
          // @ts-ignore
          balances[k] = totalBalance;
        }
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

    const balances = await getBalances(address);
    const voteAbility = isCheckBalances(balances);
    const now = new Date();
    const balanceData = JSON.stringify(balances);
    if (user === null) {
      const salt = getRandomInt(1, 999999999999);
      await User.create({
        address,
        salt,
        balanceData,
        voteAbility,
        lastCheckBalanceTime: now,
        votedProjects: []
      });
      res.status(200).json({ message: `${RANDOM_SALT} ${salt}`, voteAbility });
    } else {
      user.balanceData = balanceData;
      user.lastCheckBalanceTime = now;
      user.voteAbility = voteAbility;
      user.save();
      res.status(200).json({ message: `${RANDOM_SALT} ${user.salt}`, voteAbility });
    }
  } catch (error) {
    // console.error(error);
    // await send_telegram_message("get-message error: " +  error);
    res.status(500).json({ message: 'Internal Server Error ' });
  }
};
export const message = relogRequestHandler(getMessage, { skipJwtAuth: true });
