import { RequestHandler } from 'express';
import { recoverPersonalSignature } from 'eth-sig-util';
import { any } from '@hapi/joi';
import { User } from '../../models/User';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';

export const RANDOM_SALT = 'Please sign message to vote project. Random nonce: ';

// TODO: Validate with JWT
const API_KEY = 'subwallet_artzero_22';

export const getAllProjects: RequestHandler = async (req, res) => {
  const projects = await Project.find();
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const voteCount = await Vote.find({
        project_id: el.project_id
      }).countDocuments();

      const newEle = { ...el.toObject(), voteCount };
      console.log(newEle);
      return newEle;
    })
  );

  res.send({ projects: newList });
};

export const getAllVotedProjects: RequestHandler = async (req, res) => {
  const { address } = req.body;

  const user = await User.findOne({ address });
  res.send(user.votedProjects);
};

export const addProjects: RequestHandler = async (req, res) => {
  const { projects, apiKey } = req.body;
  if (apiKey !== API_KEY) res.status(400).json({ message: 'Wrong key!' });
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const project = await Project.updateOne({ project_id: el.project_id }, { upsert: true, setDefaultsOnInsert: true });
      return project;
    })
  );
  res.send({ projects });
};

export const deleteProjects: RequestHandler = async (req, res) => {
  const { projects, apiKey } = req.body;
  if (apiKey !== API_KEY) res.status(400).json({ message: 'Wrong key!' });
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const project = await Project.deleteOne({ project_id: el.project_id }, { upsert: true, setDefaultsOnInsert: true });
      return project;
    })
  );
  res.send({ projects });
};

export const voteProjects: RequestHandler = async (req, res) => {
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
      sig: signature
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

export const getRandomInt = (minNum: number, maxNum: number) => {
  const min = Math.ceil(minNum);
  const max = Math.floor(maxNum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getMessage: RequestHandler = async (req, res) => {
  try {
    const { address } = req.body;

    const user = await User.findOne({ address });

    if (user === null) {
      const salt = getRandomInt(1, 999999999999);
      await User.create({
        address,
        salt,
        votedProjects: []
      });
      res.status(200).json({ message: `${RANDOM_SALT} ${salt}` });
    } else {
      res.status(200).json({ message: `${RANDOM_SALT} ${user.salt}` });
    }
  } catch (error) {
    // await send_telegram_message("get-message error: " +  error);
    res.status(500).json({ message: 'Internal Server Error ' });
  }
};
