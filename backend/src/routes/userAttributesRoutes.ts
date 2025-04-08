import express from 'express';
import { userAttributesController } from '../controllers/userAttributesController.js';

const router = express.Router();

router.get('/', userAttributesController.getUserAttributes);

export const userAttributesRoutes = router;