import { Router } from 'express';
import * as articleController from '../controllers/article.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { articleCreateSchema, articleUpdateSchema, paginationSchema } from '../schemas/index.js';

const router = Router();

// Admin routes MUST be registered before /:slug to avoid "admin" being matched as a slug
router.get('/admin/:id', requireAuth, requireRole('admin'), articleController.getById);

// Public
router.get('/', validate(paginationSchema, 'query'), articleController.list);
router.get('/:slug', articleController.getBySlug);

// Admin - C4: by :id
router.post('/', requireAuth, requireRole('admin'), validate(articleCreateSchema), articleController.create);
router.patch('/:id', requireAuth, requireRole('admin'), validate(articleUpdateSchema), articleController.update);
router.delete('/:id', requireAuth, requireRole('admin'), articleController.remove);

export default router;
