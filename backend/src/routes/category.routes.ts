import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categoryCreateSchema, categoryUpdateSchema } from '../schemas/index.js';

const router = Router();

// Public
router.get('/', categoryController.list);
router.get('/:slug', categoryController.getBySlug);

// Admin
router.post('/', requireAuth, requireRole('admin'), validate(categoryCreateSchema), categoryController.create);
router.patch('/:slug', requireAuth, requireRole('admin'), validate(categoryUpdateSchema), categoryController.update);
router.delete('/:slug', requireAuth, requireRole('admin'), categoryController.remove);

export default router;