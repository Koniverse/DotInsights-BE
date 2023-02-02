import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { IProject, Project } from '../../models/Project';

const getAllProjects: RequestHandler = async (req, res) => {
  const projects = await Project.find({ archived: { $in: [false, null] } });
  const newList = await Promise.all(
    projects.map((el: any) => {
      const rawEl = el.toObject() as IProject;
      const newEl = {
        project_id: rawEl.project_id,
        project_slug: rawEl.project_slug,
        project: rawEl.project,
        category: rawEl.category,
        layer: rawEl.layer,
        native: rawEl.native,
        token: rawEl.token,
        twitter: rawEl.twitter,
        github: rawEl.github,
        website: rawEl.website,
        vote_count: rawEl.vote_count
      };
      return newEl;
    })
  );

  res.send({ projects: newList });
};

export const all = relogRequestHandler(getAllProjects, { skipJwtAuth: true });
