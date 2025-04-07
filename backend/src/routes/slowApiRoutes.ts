import express from 'express';
import { slowApiController } from '../controllers/slowApiController.js';

const router = express.Router();

router.get('/', slowApiController.getSlowResponse);

export const slowApiRoutes = router; 