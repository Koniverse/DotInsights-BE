import { RequestHandler } from 'express';
import { relogRequestHandler } from '../../middleware/request-middleware';
import { Project } from '../../models/Project';
import { Vote } from '../../models/Vote';

const getAllProjects: RequestHandler = async (req, res) => {
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

export const all = relogRequestHandler(getAllProjects);
