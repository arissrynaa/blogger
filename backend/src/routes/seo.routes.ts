import { Router } from 'express';
import * as seoController from '../controllers/seo.controller.js';

const router = Router();

router.get('/sitemap.xml', seoController.sitemapXml);
router.get('/robots.txt', seoController.robotsTxt);

export default router;