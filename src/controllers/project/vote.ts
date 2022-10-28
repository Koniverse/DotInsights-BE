import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { decodeAddress, isEthereumAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { RANDOM_SALT } from './index';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';

export const isValidSignature = (address: string, signedMessage: string, signature: string): boolean => {
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

const voteProjects: RequestHandler = async (req, res) => {
  const {
    project_id, signature, address, isVote
  } = req.body;
  const project = await Project.findOne({ project_id });
  const vote = await Vote.findOne({ project_id, address });

  if (!project) {
    return res.status(400).send('Not Found');
  }
  const user = await User.findOne({ address });
  try {
    // Validate signature
    const signData = `${RANDOM_SALT} ${user.salt}`;
    if (!isValidSignature(address, signData, signature)) {
      return res.status(500).json({ message: 'Wrong signature!' });
    }
    // End validate signature

    // Update vote status
    if (!isVote) {
      if (vote) {
        await Vote.deleteOne({ project_id, address });
        user.votedProjects.splice(user.votedProjects.indexOf(project_id), 1);
      }
    } else if (!vote) {
      const newVote = await Vote.create({ project_id, address });
      user.votedProjects.push(project_id);

      newVote.save();
    } else {
      return res.status(500).json({ message: 'You voted' });
    }
    user.save();
    project.vote_count = await Vote.find({ project_id }).countDocuments();
    // End update vote status
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return res.send({ project });
};

export const vote = relogRequestHandler(voteProjects, { skipJwtAuth: true });
