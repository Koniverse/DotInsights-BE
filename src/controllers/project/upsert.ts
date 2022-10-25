import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { IProject, Project } from '../../models/Project';

const upsertProjects: RequestHandler = async (req, res) => {
  const { projects } = req.body;
  const newList = await Promise.all(
    projects.map(async (el: IProject) => Project.updateOne({ project_id: el.project_id }, { $set: { ...el } }, { upsert: true }))
  );
  res.send({ projects: newList });
};

export const upsert = relogRequestHandler(upsertProjects);
