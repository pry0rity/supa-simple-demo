import express from 'express';
import { dbQueryController } from '../controllers/dbQueryController.js';

const router = express.Router();

router.get('/', dbQueryController.getUsers);

export const dbQueryRoutes = router; 