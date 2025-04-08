import express from 'express';
import { batchApiController } from '../controllers/batchApiController.js';

const router = express.Router();

router.get('/', batchApiController.getBatchResults);

export const batchApiRoutes = router;