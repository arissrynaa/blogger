import { Router } from 'express';
import * as tagController from '../controllers/tag.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { tagCreateSchema, tagUpdateSchema } from '../schemas/index.js';

const router = Router();

// Public
router.get('/', tagController.list);
router.get('/:slug', tagController.getBySlug);

// Admin
router.post('/', requireAuth, requireRole('admin'), validate(tagCreateSchema), tagController.create);
router.patch('/:slug', requireAuth, requireRole('admin'), validate(tagUpdateSchema), tagController.update);
router.delete('/:slug', requireAuth, requireRole('admin'), tagController.remove);

export default router;