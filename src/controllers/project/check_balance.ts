import { RequestHandler } from 'express';
import { BN } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { getBalancesFromSubscan } from '../../libs/subscan';

const isEnoughBalances = (balanceData: any) => {
  const nonZeroBalance = Object.values(balanceData).find(balance => (new BN(String(balance))).gt(new BN(0)));
  return !!nonZeroBalance;
};
const checkBalanceSubscan: RequestHandler = async (req, res) => {
  const { address } = req.body;
  try {
    const data = await getBalancesFromSubscan(address);
    const balances = {};
    Object.entries(data).forEach(balance => {
      let total = new BN(0);
      Object.entries(balance[1]).forEach(([k, value]) => {
        const { totalBalance }: any = value;
        if (totalBalance) {
          total = total.add(new BN(totalBalance));
        }
        // const { totalBalance }: any = Object.entries(value)[0][1];
        // @ts-ignore
        balances[k] = total.toString();
      });
    });
    const voteAbility = isEnoughBalances(balances);
    return res.send({ status: voteAbility });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return res.send({ message: 'success' });
};
export const checkBalance = relogRequestHandler(checkBalanceSubscan, { skipJwtAuth: true });
