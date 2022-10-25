import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { User } from '../../models/User';

const getAllVotedProjects: RequestHandler = async (req, res) => {
  const { address } = req.body;

  const user = await User.findOne({ address });
  res.send(user.votedProjects);
};

export const allVote = relogRequestHandler(getAllVotedProjects, { skipJwtAuth: true });
