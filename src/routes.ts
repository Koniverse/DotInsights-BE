import { Router } from 'express';
// import swaggerUi from 'swagger-ui-express';
// import apiSpec from '../swagger-doc.json';

import * as ProjectController from './controllers/project';

export const router = Router();

const cacheService = require('express-api-cache');

const { cache } = cacheService;

// Auth routes
router.get('/getProjects', cache('1 minutes'), ProjectController.all);
// router.post('/upsertProjects', ProjectController.upsert);
router.post('/getMessage', ProjectController.message);
router.post('/voteProject', ProjectController.vote);
router.post('/getVotedProject', ProjectController.allVote);

// if (process.env.NODE_ENV === 'development') {
//   router.use('/dev/api-docs', swaggerUi.serve);
//   router.get('/dev/api-docs', swaggerUi.setup(apiSpec));
// }
