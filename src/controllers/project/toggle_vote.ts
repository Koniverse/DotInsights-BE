import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { decodeAddress, isEthereumAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { RANDOM_SALT } from './index';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';
import { provider } from '../../app';

const MINIMUM_DOT_TO_GENERATE_VOUCHER = process.env.MINIMUM_DOT_TO_GENERATE_VOUCHER || 0;

const isValidSignature = (address: string, signedMessage: string, signature: string): boolean => {
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
};

const toggleVoteProjects: RequestHandler = async (req, res) => {
  const {
    project_id, signature, address
  } = req.body;
  const project = await Project.findOne({ project_id });
  const vote = await Vote.findOne({ project_id, address });

  if (!project) {
    return res.status(404).send('Project Not Found');
  }
  const user = await User.findOne({ address });

  if (!user) {
    return res.status(404).send('User Not Found');
  }

  try {
    // Validate signature
    // TODO: Remove this check old sign data after FE update new signature api
    const oldSignMessage = `${RANDOM_SALT} ${user.salt}`;
    const signMessage = `${RANDOM_SALT} ${user.salt}-${project_id}`;
    if (!isValidSignature(address, oldSignMessage, signature) && !isValidSignature(address, signMessage, signature)) {
      return res.status(500).json({ message: 'Wrong signature!' });
    }
    // End validate signature

    // Toggle vote
    if (!vote) {
      const api = provider.getApiConnected();
      if (MINIMUM_DOT_TO_GENERATE_VOUCHER > 0) {
        if (!api) {
          return res.status(500).json({ message: 'Unable to check validate balance when all api can not check them!' });
        }
        const balance = await api.query.system.account(address);
        // @ts-ignore
        const { data } = balance.toHuman();
        const { reserved, miscFrozen } = data;
        const numberDot = Number(reserved.replaceAll(',', '')) + Number(miscFrozen.replaceAll(',', ''));
        if (numberDot < MINIMUM_DOT_TO_GENERATE_VOUCHER) {
          return res.status(500).json({ message: `Required at least ${MINIMUM_DOT_TO_GENERATE_VOUCHER} DOT in balance for submit vote` });
        }
      };
      const newVote = await Vote.create({
        project_id, address, signMessage, signature
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
