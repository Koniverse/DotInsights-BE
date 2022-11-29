import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { User } from '../../models/User';
import { Vote } from '../../models/Vote';

const migrateUserVotes: RequestHandler = async (req, res) => {
  const users = await User.find({});
  users.forEach(user => {
    if (user.createDate) {
      // eslint-disable-next-line no-param-reassign
      user.createTime = new Date(user.createDate);
      user.save();
    }
  });
  const votes = await Vote.find({});
  votes.forEach(vote => {
    if (vote.createDate) {
      // eslint-disable-next-line no-param-reassign
      vote.createTime = new Date(vote.createDate);
      vote.save();
    }
  });
  res.send('done');
};

export const userVote = relogRequestHandler(migrateUserVotes, { skipJwtAuth: true });
