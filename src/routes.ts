import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import apiSpec from '../swagger-doc.json';

import * as ProjectController from './controllers/project';

export const router = Router();

// Auth routes
router.get('/getProjects', ProjectController.all);
router.post('/upsertProjects', ProjectController.upsert);
router.post('/getMessage', ProjectController.message);
router.post('/voteProject', ProjectController.vote);
router.post('/getVotedProject', ProjectController.allVote);

// Book routes

if (process.env.NODE_ENV === 'development') {
  router.use('/dev/api-docs', swaggerUi.serve);
  router.get('/dev/api-docs', swaggerUi.setup(apiSpec));
}
