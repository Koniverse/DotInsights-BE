import { RequestHandler } from 'express';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';
import { RANDOM_SALT } from './index';

const voteProjects: RequestHandler = async (req, res) => {
  // TODO: Support vote with substrate account
  const {
    project_id, signature, address, isVote
  } = req.body;
  const project = await Project.findOne({ project_id });
  const vote = await Vote.findOne({ project_id, address });
  console.log(vote);

  if (!project) {
    return res.status(400).send('Not Found');
  }
  const user = await User.findOne({ address });
  try {
    // Validate signature
    const recoveredAddress = recoverPersonalSignature({
      data: `${RANDOM_SALT} ${user.salt}`,
      signature
    });
    if (recoveredAddress.toLocaleLowerCase() !== address.toLocaleLowerCase()) {
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
    project.save();
    // End update vote status
  } catch (e) {
    console.log(e);
  }

  return res.send({ project });
};

export const vote = relogRequestHandler(voteProjects);
