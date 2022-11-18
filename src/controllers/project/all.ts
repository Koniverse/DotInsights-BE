import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';

const getAllProjects: RequestHandler = async (req, res) => {
  const projects = await Project.find({ archived: { $ne: true } });
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const newEle = { ...el.toObject() };
      delete newEle['_id'];
      delete newEle['__v'];
      return newEle;
    })
  );

  res.send({ projects: newList });
};

export const all = relogRequestHandler(getAllProjects, { skipJwtAuth: true });
