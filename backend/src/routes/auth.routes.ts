import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/index.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getMe);

export default router;