import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { decodeAddress, isEthereumAddress, signatureVerify } from '@polkadot/util-crypto';
import { BN, u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { RANDOM_SALT } from './index';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';
import { httpGetRequest } from '../../libs/http-request';
import { substrateProviderMap } from '../../app';
import { SubstrateProvider } from '../../services/substrateProvider';

const { CHECK_MULTICHAIN_BALANCE_NETWORK } = process.env;

const urlBalances = (address: string, network: string) => `https://sub.id/api/v1/${address}/balances/${network}`;
const getDataResponse = (name: string, totalBalance: string) => {
  const response = new Map();
  const dataTotal = new Map();
  dataTotal.set(name, { totalBalance });
  response.set(name, Object.fromEntries(dataTotal));
  return Object.fromEntries(response);
};
const getBalancesSubstrateNetwork = async (substrateProvider: SubstrateProvider, address: string) => new Promise((resolve, reject) => {
  const api = substrateProvider.getApiConnected();
  const { name } = substrateProvider;
  if (api) {
    try {
      api.query.system.account(address).then(balance => {
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
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(balanceData)) {
    const currentBalance = new BN(String(value));
    if (currentBalance.gt(new BN(0))) {
      return true;
    }
  }
  return false;
};

const getBalances = async (address: string) => {
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

    if (!isEthereum) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, substrate] of Object.entries(substrateProviderMap)) {
        // @ts-ignore
        pros.push(getBalancesSubstrateNetwork(substrate, address));
      }
    }

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
        project_id, address, signMessage, signature, createDate
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
