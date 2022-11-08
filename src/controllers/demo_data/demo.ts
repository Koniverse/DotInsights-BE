import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';
import { User } from '../../models/User';

const createDemo: RequestHandler = async (req, res) => {
  const { NODE_ENV } = process.env;
  if (NODE_ENV !== 'development') {
    return res.send('fail');
  }
  const { address, project } = req.body;
  const { project_id } = project;
  const dataProject = await Project.findOne({ project_id });
  if (!dataProject) {
    await Project.create(project);
  }

  res.send('ok');
};

const removeDemo: RequestHandler = async (req, res) => {
  const { NODE_ENV } = process.env;
  if (NODE_ENV !== 'development') {
    return res.send('fail');
  }
  const { address, project } = req.body;
  const { project_id } = project;
  await Vote.deleteMany({ address });
  await User.deleteMany({ address });
  await Project.deleteMany({ project_id });

  res.send('ok');
};

export const create = relogRequestHandler(createDemo, { skipJwtAuth: true });
export const remove = relogRequestHandler(removeDemo, { skipJwtAuth: true });
