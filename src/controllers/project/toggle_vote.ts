import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { decodeAddress, isEthereumAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { RANDOM_SALT } from './index';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';
import { isValidSignature } from './vote';

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
    const signData = `${RANDOM_SALT} ${user.salt}`;
    if (!isValidSignature(address, signData, signature)) {
      return res.status(500).json({ message: 'Wrong signature!' });
    }
    // End validate signature

    // Toggle vote
    if (!vote) {
      const newVote = await Vote.create({ project_id, address });

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
