import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';

const upsertProjects: RequestHandler = async (req, res) => {
  // TODO: Change to upsertProjects()
  // TODO: Use JWT instead of API KEY
  const { projects } = req.body;
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const project = await Project.updateOne({ project_id: el.project_id }, { upsert: true, setDefaultsOnInsert: true });
      return project;
    })
  );
  res.send({ projects });
};

export const upsert = relogRequestHandler(upsertProjects);
