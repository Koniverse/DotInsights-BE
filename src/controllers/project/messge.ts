import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { User } from '../../models/User';
import { RANDOM_SALT } from './index';

export const getRandomInt = (minNum: number, maxNum: number) => {
  const min = Math.ceil(minNum);
  const max = Math.floor(maxNum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getMessage: RequestHandler = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findOne({ address });
    if (user === null) {
      const createDate = new Date();
      const salt = getRandomInt(1, 999999999999);
      await User.create({
        address,
        salt,
        votedProjects: [],
        createDate,
        createTime: createDate
      });
      res.status(200).json({ message: `${RANDOM_SALT} ${salt}` });
    } else {
      res.status(200).json({ message: `${RANDOM_SALT} ${user.salt}` });
    }
  } catch (error) {
    // console.error(error);
    // await send_telegram_message("get-message error: " +  error);
    res.status(500).json({ message: 'Internal Server Error ' });
  }
};
export const message = relogRequestHandler(getMessage, { skipJwtAuth: true });
