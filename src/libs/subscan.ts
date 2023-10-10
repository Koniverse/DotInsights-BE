import fetch from 'node-fetch';

const SUBSCAN_URL = process.env.SUBSCAN_URL || 'https://polkadot.api.subscan.io';

export const getBalancesFromSubscan = async (address: string): Promise<Record<string, object>> => {
  const rs = await fetch(
    `${SUBSCAN_URL}/api/scan/multiChain/account`,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ address })
    }
  ).then(response => response.json());
  const balances: Record<string, object> = {};
  if (rs && rs.data) {
    const { data } = rs;
    data.forEach((item: any) => {
      const { network, balance } = item;
      const dataTotal = new Map();
      dataTotal.set(network, { totalBalance: balance });
      balances[network] = Object.fromEntries(dataTotal);
    });
  }

  return balances;
};
