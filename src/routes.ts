import { Router } from 'express';
// import swaggerUi from 'swagger-ui-express';
// import apiSpec from '../swagger-doc.json';

import * as ProjectController from './controllers/project';
import * as ChainDataController from './controllers/chain_data';

export const router = Router();

const cacheService = require('express-api-cache');

const { cache } = cacheService;

// Auth routes
router.get('/getProjects', ProjectController.all);
// router.post('/upsertProjects', ProjectController.upsert);
router.post('/getMessage', ProjectController.message);
router.post('/toggleVoteProject', ProjectController.toggleVote);
router.post('/getVotedProject', ProjectController.allVote);
router.get('/getAllVotedProject', ProjectController.allVoteProject);
router.get('/chainData/:chain', cache('1 minutes'), ChainDataController.data);

// if (process.env.NODE_ENV === 'development') {
//   router.use('/dev/api-docs', swaggerUi.serve);
//   router.get('/dev/api-docs', swaggerUi.setup(apiSpec));
// }
