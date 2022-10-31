import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Vote } from '../../models/Vote';

const getAllVoteProjects: RequestHandler = async (req, res) => {
  const dataVoteCount = await Vote.aggregate([
    { $unwind: '$project_id' },
    { $group: { _id: '$project_id', count: { $sum: 1 } } },
    {
      $group: {
        _id: null,
        data: {
          $push: {
            k: { $toLower: '$_id' },
            v: '$count'
          }
        }
      }
    },
    { $replaceRoot: { newRoot: { $arrayToObject: '$data' } } }
  ]);
  if (dataVoteCount.length > 0) {
    res.send(dataVoteCount[0]);
  } else {
    res.send({});
  }
};
export const allVoteProject = relogRequestHandler(getAllVoteProjects, { skipJwtAuth: true });
