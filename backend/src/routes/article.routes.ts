import { Router } from 'express';
import * as articleController from '../controllers/article.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { articleCreateSchema, articleUpdateSchema, paginationSchema, searchSchema } from '../schemas/index.js';

const router = Router();

// Public
router.get('/', validate(paginationSchema, 'query'), articleController.list);
router.get('/search', validate(searchSchema, 'query'), articleController.search);
router.get('/:slug', articleController.getBySlug);

// Admin
router.post('/', requireAuth, requireRole('admin'), validate(articleCreateSchema), articleController.create);
router.patch('/:slug', requireAuth, requireRole('admin'), validate(articleUpdateSchema), articleController.update);
router.delete('/:slug', requireAuth, requireRole('admin'), articleController.remove);

export default router;