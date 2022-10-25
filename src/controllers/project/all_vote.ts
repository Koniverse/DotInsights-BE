import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Vote } from '../../models/Vote';

const getAllVotedProjects: RequestHandler = async (req, res) => {
  const { address } = req.body;

  const votes = await Vote.find({ address });
  const votedProjects = votes.map(vote => vote.project_id);
  res.send(votedProjects);
};

export const allVote = relogRequestHandler(getAllVotedProjects, { skipJwtAuth: true });
