import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { decodeAddress, isEthereumAddress, signatureVerify } from '@polkadot/util-crypto';
import { BN, u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { RANDOM_SALT } from './index';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';
import { SubstrateChain } from '../../services/substrateChain';
import { substrateApiMap } from '../../app';
import { getBalancesFromSubscan } from '../../libs/subscan';

const { CHECK_MULTICHAIN_BALANCE_NETWORK } = process.env;

// const urlBalances = (address: string, network: string) => `https://sub.id/api/v1/${address}/balances/${network}`;
const getDataResponse = (name: string, totalBalance: string) => {
  const response = new Map();
  const dataTotal = new Map();
  dataTotal.set(name, { totalBalance });
  response.set(name, Object.fromEntries(dataTotal));
  return Object.fromEntries(response);
};
const getBalanceFromSubstrateApi = async (substrateProvider: SubstrateChain, address: string) => new Promise((resolve, reject) => {
  const { name } = substrateProvider;
  const api = substrateProvider.getConnectedApi();
  if (api) {
    try {
      api.api.query.system.account(address).then(balance => {
        try {
          // @ts-ignore
          const { data } = balance.toHuman();
          const { free } = data;
          const totalBalance = new BN(free.replaceAll(',', '')).toString();
          resolve(getDataResponse(name, totalBalance));
        } catch (e) {
          resolve(getDataResponse(name, '0'));
        }
      });
    } catch (e) {
      resolve(getDataResponse(name, '0'));
    }
  }
});

const isEnoughBalances = (balanceData: any) => {
  const nonZeroBalance = Object.values(balanceData).find(balance => (new BN(String(balance))).gt(new BN(0)));
  return !!nonZeroBalance;
};

const getBalances = async (address: string) => {
  const checkBalancePromises: any[] = [];
  const balances = {};
  const isEthereum = isEthereumAddress(address);
  if (CHECK_MULTICHAIN_BALANCE_NETWORK) {
    checkBalancePromises.push(getBalancesFromSubscan(address));
    if (!isEthereum) {
      Object.values(substrateApiMap).forEach(substrateApi => {
        checkBalancePromises.push(getBalanceFromSubstrateApi(substrateApi, address));
      });
    }

    try {
      const data = await Promise.all(checkBalancePromises);
      data.forEach(balance => {
        let total = new BN(0);
        Object.entries(balance).forEach(([k, value]) => {
          Object.entries(value).forEach((val, index) => {
            const { totalBalance }: any = val[1];
            if (totalBalance) {
              total = total.add(new BN(totalBalance));
            }
          });
          // const { totalBalance }: any = Object.entries(value)[0][1];
          // @ts-ignore
          balances[k] = total.toString();
        });
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

const isValidSignature = (address: string, signedMessage: string, signature: string): boolean => {
  try {
    if (isEthereumAddress(address)) {
      const recoveredAddress = recoverPersonalSignature({
        data: signedMessage,
        signature
      });
      return recoveredAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
    }

    const publicKey = decodeAddress(address);
    const hexPublicKey = u8aToHex(publicKey);

    return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return false;
  }
};

const toggleVoteProjects: RequestHandler = async (req, res) => {
  const {
    project_id, signature, address
  } = req.body;
  const project = await Project.findOne({ project_id });
  const vote = await Vote.findOne({ project_id, address });

  if (!project) {
    return res.status(404).json({ message: 'Project Not Found' });
  }
  const user = await User.findOne({ address });

  if (!user) {
    return res.status(404).json({ message: 'User Not Found' });
  }

  try {
    // Validate signature
    // const oldSignMessage = `${RANDOM_SALT} ${user.salt}`;
    const signMessage = `${RANDOM_SALT} ${user.salt}-${project_id}`;
    if (!isValidSignature(address, signMessage, signature)) {
      return res.status(500).json({ message: 'Wrong signature!' });
    }
    // End validate signature

    // Toggle vote
    if (!vote) {
      let { voteAbility } = user;
      if (!voteAbility) {
        const balances = await getBalances(address);
        voteAbility = isEnoughBalances(balances);
        if (voteAbility) {
          user.balanceData = JSON.stringify(balances);
          user.lastCheckBalanceTime = new Date();
          user.voteAbility = voteAbility;
          user.save();
        }
      }
      if (!voteAbility) {
        return res.status(500).json({ message: 'Insufficient balance. Make sure you have some balance on any chain before submitting votes.' });
      }
      const createDate = new Date();
      const newVote = await Vote.create({
        project_id, address, signMessage, signature, createDate, createTime: createDate
      });

      newVote.save();
    } else {
      await Vote.deleteOne({ _id: vote._id });
    }
    project.vote_count = await Vote.find({ project_id }).countDocuments();
    project.save();
    // End toggle Vote
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return res.send({
    project_id: project.project_id, vote_count: project.vote_count, address: user.address, isVote: !vote
  });
};
export const toggleVote = relogRequestHandler(toggleVoteProjects, { skipJwtAuth: true });
