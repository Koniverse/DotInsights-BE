import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';

const deleteProjects: RequestHandler = async (req, res) => {
  const { projects } = req.body;
  const newList = await Promise.all(
    projects.map(async (el: any) => {
      const project = await Project.deleteOne({ project_id: el.project_id }, { upsert: true, setDefaultsOnInsert: true });
      return project;
    })
  );
  res.send({ projects });
};

export const deleteProject = relogRequestHandler(deleteProjects);
